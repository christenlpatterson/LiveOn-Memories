import { ArrowLeft, Mic, Square } from "lucide-react";
import { useState, useRef } from "react";
import { Milestone } from "../../data/types";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Card, CardContent } from "../ui/card";
import { AnnotatedPhoto } from "../AnnotatedPhoto";
import { VisitorLog } from "../VisitorLog";

interface DetailPageProps {
  milestone: Milestone;
  onBack: () => void;
  onAddComment: (author: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onAddAnnotation?: (photoId: string, x: number, y: number, text: string, author: string) => void;
  onDeleteMilestone?: () => void;
  onAddAudioClip?: (blob: Blob) => void;
  onDeleteAudioClip?: (clipId: string) => void;
  onEditMilestone?: () => void;
}

export function DetailPage({ milestone, onBack, onAddComment, onDeleteComment, onAddAnnotation, onDeleteMilestone, onAddAudioClip, onDeleteAudioClip, onEditMilestone }: DetailPageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAddAudioClip?.(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access was denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-[#e8eef5] py-12 px-4">
      <div className="max-w-4xl mx-auto relative">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-8 hover:bg-white/50 text-[#5a6c7d]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Timeline
        </Button>

        <Card className="bg-white border-gray-200 shadow-2xl mb-8">
          <CardContent className="p-10">
            {/* Header */}
            <div className="mb-10 text-center border-b border-gray-200 pb-8">
              <div className="inline-block px-8 py-3 mb-6 rounded-md bg-gradient-to-r from-[#c9a961] to-[#d4a743] text-white shadow-md">
                <div className="text-3xl tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {milestone.year}
                </div>
              </div>
              <h1 className="text-4xl mb-2 text-[#2c3e50] tracking-wide">
                {milestone.title}
              </h1>
              {milestone.description && milestone.description.trim() && (
                <p className="text-2xl text-[#c9a961] mt-1" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  {milestone.description}
                </p>
              )}
            </div>

            {/* Story */}
            {milestone.story && milestone.story.trim() && (
              <div className="mb-10">
                <div className="prose max-w-none">
                  <p className="text-[#5a6c7d] leading-relaxed text-lg whitespace-pre-line" style={{ fontFamily: "'Crimson Text', serif" }}>
                    {milestone.story}
                  </p>
                </div>
              </div>
            )}

            {/* Photos */}
            {milestone.photos && milestone.photos.length > 0 && (
              <div className="mb-10">
                {milestone.photos.length === 1 ? (
                  <AnnotatedPhoto
                    photo={milestone.photos[0]}
                    onAddAnnotation={
                      onAddAnnotation
                        ? (x, y, text, author) => onAddAnnotation(milestone.photos[0].id, x, y, text, author)
                        : undefined
                    }
                  />
                ) : milestone.photos.length === 2 ? (
                  <div className="flex gap-8">
                    {milestone.photos.map((photo) => (
                      <div key={photo.id} className="flex-1">
                        <AnnotatedPhoto
                          photo={photo}
                          onAddAnnotation={
                            onAddAnnotation
                              ? (x, y, text, author) => onAddAnnotation(photo.id, x, y, text, author)
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-8">
                    {/* Left column: photos 1 & 2 stacked */}
                    <div className="flex flex-col gap-8 flex-1">
                      {milestone.photos.slice(0, 2).map((photo) => (
                        <AnnotatedPhoto
                          key={photo.id}
                          photo={photo}
                          onAddAnnotation={
                            onAddAnnotation
                              ? (x, y, text, author) => onAddAnnotation(photo.id, x, y, text, author)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    {/* Right column: photos 3 & 4 */}
                    <div className="flex flex-col gap-8 flex-1">
                      {milestone.photos.slice(2, 4).map((photo) => (
                        <AnnotatedPhoto
                          key={photo.id}
                          photo={photo}
                          onAddAnnotation={
                            onAddAnnotation
                              ? (x, y, text, author) => onAddAnnotation(photo.id, x, y, text, author)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video */}
            {milestone.videoUrl && (
              <div className="mb-10 border-t border-gray-200 pt-10">
                <h2 className="text-2xl mb-6 text-[#2c3e50] tracking-wide text-center">Video</h2>
                <div className="aspect-video bg-gray-100 border border-gray-200 flex items-center justify-center shadow-lg rounded-md">
                  <p className="text-[#6b7c8d]">Video player would go here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Clips */}
        {milestone.audioClips && milestone.audioClips.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-2xl mb-6">
            <CardContent className="p-8">
              <div className="space-y-3">
                {milestone.audioClips.map((clip, i) => (
                  <div key={clip.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 shrink-0">Recording {i + 1} &mdash; {clip.date}</span>
                    <audio controls src={clip.url} className="flex-1 h-8" style={{ accentColor: '#c9a961' }} />
                    {onDeleteAudioClip && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            title="Delete recording"
                            className="text-gray-300 hover:text-gray-400 hover:bg-gray-100 rounded px-1 py-1 text-xs transition-colors"
                          >✕</button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete this recording?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-gray-500 mb-4">This voice recording will be permanently removed.</p>
                          <DialogFooter>
                            <Button variant="ghost" type="button">Cancel</Button>
                            <Button variant="destructive" onClick={() => onDeleteAudioClip(clip.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visitor Log */}
        <Card className="bg-white border-gray-200 shadow-2xl">
          <CardContent className="p-10">
            <VisitorLog 
              comments={milestone.comments}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          </CardContent>
        </Card>

        {/* Return to Timeline button */}
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-white/50 text-[#5a6c7d]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Timeline
          </Button>
        </div>

        {/* Bottom row: Delete Page (left) + Edit Page (center) + Mic (right) */}
        <div className="mt-6 mb-8 flex justify-between items-center">
          {onDeleteMilestone ? (
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-xs text-gray-400 hover:text-gray-400 hover:bg-gray-200 px-2 py-1 rounded opacity-70 hover:opacity-100 transition-colors">
                  Delete Page
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this page?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete this page? This action cannot be undone.</p>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="destructive" onClick={onDeleteMilestone}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : <span />}

          {onEditMilestone && (
            <button
              onClick={onEditMilestone}
              className="text-xs text-gray-400 hover:text-gray-400 hover:bg-gray-200 px-2 py-1 rounded opacity-70 hover:opacity-100 transition-colors"
            >
              Edit Page
            </button>
          )}

          {onAddAudioClip && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? 'Stop recording' : 'Record voice note'}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded opacity-70 hover:opacity-100 transition-colors ${
                isRecording
                  ? 'text-gray-500 hover:text-gray-500 hover:bg-gray-200 animate-pulse'
                  : 'text-gray-400 hover:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {isRecording ? 'Stop' : 'Record Voice Notes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
