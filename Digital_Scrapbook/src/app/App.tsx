import { useState, useEffect } from 'react';
import { Timeline } from './components/Timeline';
import { DetailPage } from './components/pages/DetailPage';
import { PhotoIntakePage } from './components/pages/PhotoIntakePage';
import { ScrapbookEditor } from './components/ScrapbookEditor';
import { Milestone } from './data/types';
import {
  getMilestones,
  addComment,
  deleteComment,
  deleteMilestone,
  uploadAudio,
  deleteAudioClip,
} from './api';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { Butterfly } from './components/Butterfly';

const PASSCODE = 'Patterson';
const PASSCODE_STORAGE_KEY = 'liveon-memories-passcode-ok';

export default function App() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PASSCODE_STORAGE_KEY) === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [loading, setLoading]       = useState(isUnlocked);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [lastViewedMilestoneId, setLastViewedMilestoneId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPhotoIntake, setShowPhotoIntake] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    setLoading(true);
    getMilestones()
      .then(setMilestones)
      .catch(() => toast.error('Could not reach the server. Is the Flask backend running?'))
      .finally(() => setLoading(false));
  }, [isUnlocked]);

  const selectedMilestone = selectedMilestoneId
    ? milestones.find(m => m.id === selectedMilestoneId)
    : null;

  const handleAddComment = async (milestoneId: string, author: string, text: string) => {
    try {
      const comment = await addComment(milestoneId, author, text);
      setMilestones(prev => prev.map(m =>
        m.id === milestoneId ? { ...m, comments: [...m.comments, comment] } : m
      ));
      toast.success('Comment posted!');
    } catch { toast.error('Failed to post comment.'); }
  };

  const handleDeleteComment = async (milestoneId: string, commentId: string) => {
    try {
      await deleteComment(milestoneId, commentId);
      setMilestones(prev => prev.map(m =>
        m.id === milestoneId ? { ...m, comments: m.comments.filter(c => String(c.id) !== String(commentId)) } : m
      ));
      toast.success('Entry deleted.');
    } catch { toast.error('Failed to delete entry.'); }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await deleteMilestone(milestoneId);
      setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      setSelectedMilestoneId(null);
      toast.success('Page deleted.');
    } catch { toast.error('Failed to delete page.'); }
  };

  const handleAddAudioClip = async (milestoneId: string, blob: Blob) => {
    try {
      const clip = await uploadAudio(milestoneId, blob);
      setMilestones(prev => prev.map(m =>
        m.id === milestoneId ? { ...m, audioClips: [...(m.audioClips ?? []), clip] } : m
      ));
      toast.success('Voice recording saved.');
    } catch { toast.error('Failed to save recording.'); }
  };

  const handleDeleteAudioClip = async (milestoneId: string, clipId: string) => {
    try {
      await deleteAudioClip(milestoneId, clipId);
      setMilestones(prev => prev.map(m =>
        m.id === milestoneId
          ? { ...m, audioClips: (m.audioClips ?? []).filter(c => c.id !== clipId) }
          : m
      ));
    } catch { toast.error('Failed to delete recording.'); }
  };

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passcode.trim() !== PASSCODE) {
      setPasscodeError(true);
      return;
    }

    window.localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
    setPasscode('');
    setPasscodeError(false);
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(234,214,178,0.9),_rgba(245,239,229,0.97)_38%,_rgba(221,226,230,1)_100%)] px-6 py-10 text-[#2f3b33]">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#ceb98e] bg-[#f8f2e7]/95 shadow-[0_25px_80px_rgba(79,62,34,0.18)] md:grid-cols-[1.1fr_0.9fr]">
            <div className="hidden border-r border-[#d8c6a2] bg-[linear-gradient(180deg,rgba(113,87,46,0.18),rgba(113,87,46,0.03))] p-10 md:block">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#8a6d3b]">LiveOn Memories</p>
                  <h1 className="mt-6 max-w-sm text-5xl leading-[1.02] text-[#4a3520]">Family stories, tucked behind a simple gate.</h1>
                  <p className="mt-6 max-w-md text-base leading-7 text-[#5f5444]">
                    Enter the family passcode to open the scrapbook timeline, photos, stories, and recordings.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-[#d8c6a2] bg-[#fff9f0]/75 p-5 text-sm leading-6 text-[#6a5b44]">
                  This is a client-side passcode screen meant to keep casual visitors out of the site.
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 md:p-12">
              <p className="text-xs uppercase tracking-[0.32em] text-[#8a6d3b] md:hidden">LiveOn Memories</p>
              <h2 className="mt-4 text-3xl text-[#4a3520] sm:text-4xl">Enter passcode</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#675a47]">
                This scrapbook is private. Enter the passcode to continue.
              </p>

              <form className="mt-10 space-y-4" onSubmit={handleUnlock}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5f4a2e]">Passcode</span>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(event) => {
                      setPasscode(event.target.value);
                      if (passcodeError) setPasscodeError(false);
                    }}
                    className="w-full rounded-2xl border border-[#ccb68b] bg-white px-5 py-4 text-base text-[#2f3b33] outline-none transition focus:border-[#8a6d3b] focus:ring-4 focus:ring-[#d8c6a2]/50"
                    autoComplete="current-password"
                    autoFocus
                  />
                </label>

                {passcodeError ? (
                  <p className="text-sm text-[#9a3a2a]">That passcode did not match.</p>
                ) : null}

                <Button type="submit" className="w-full rounded-2xl bg-[#7e5d31] py-6 text-base hover:bg-[#6d4f29]">
                  Open scrapbook
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e8eef5] text-[#5a6c7d]">
        Loading…
      </div>
    );
  }

  const editingMilestone = editingMilestoneId
    ? milestones.find(m => m.id === editingMilestoneId)
    : null;

  const handleUpdateMilestone = (updated: Milestone) => {
    setMilestones(prev => prev.map(m => String(m.id) === String(updated.id) ? updated : m));
    setEditingMilestoneId(null);
    toast.success('Page updated.');
  };

  if (editingMilestone) {
    return (
      <>
        <ScrapbookEditor
          editMilestone={editingMilestone}
          onUpdate={handleUpdateMilestone}
          onCreate={() => {}}
          onClose={() => setEditingMilestoneId(null)}
        />
        <Toaster />
      </>
    );
  }

  if (selectedMilestone) {
    const currentIndex = milestones.findIndex(m => m.id === selectedMilestone.id);
    const prevMilestone = currentIndex > 0 ? milestones[currentIndex - 1] : null;
    const nextMilestone = currentIndex >= 0 && currentIndex < milestones.length - 1
      ? milestones[currentIndex + 1]
      : null;
    return (
      <>
        <DetailPage 
          milestone={selectedMilestone}
          onBack={() => {
            if (prevMilestone) {
              setLastViewedMilestoneId(prevMilestone.id);
              setSelectedMilestoneId(prevMilestone.id);
            } else {
              setLastViewedMilestoneId(selectedMilestone.id);
              setSelectedMilestoneId(null);
            }
          }}
          onNext={nextMilestone ? () => {
            setLastViewedMilestoneId(nextMilestone.id);
            setSelectedMilestoneId(nextMilestone.id);
          } : undefined}
          onReturnToTimeline={() => {
            setLastViewedMilestoneId(selectedMilestone.id);
            setSelectedMilestoneId(null);
          }}
          onAddComment={(author, text) => handleAddComment(selectedMilestone.id, author, text)}
          onDeleteComment={(commentId) => handleDeleteComment(selectedMilestone.id, commentId)}
          onDeleteMilestone={() => handleDeleteMilestone(selectedMilestone.id)}
          onAddAudioClip={(blob) => handleAddAudioClip(selectedMilestone.id, blob)}
          onDeleteAudioClip={(clipId) => handleDeleteAudioClip(selectedMilestone.id, clipId)}
          onEditMilestone={() => setEditingMilestoneId(selectedMilestone.id)}
        />
        <Toaster />
      </>
    );
  }

  if (showEditor) {
    return (
      <>
        <ScrapbookEditor
          onCreate={(m) => {
            setMilestones(prev => {
              const combined = [...prev, m];
              const getTime = (item: Milestone) => {
                if (item.date) {
                  const t = Date.parse(item.date);
                  if (!isNaN(t)) return t;
                }
                if (item.year) return new Date(item.year, 0, 1).getTime();
                return 0;
              };
              return combined.slice().sort((a, b) => getTime(a) - getTime(b));
            });
            setShowEditor(false);
            setSelectedMilestoneId(m.id);
            toast.success('Scrapbook entry created');
          }}
          onClose={() => setShowEditor(false)}
        />
        <Toaster />
      </>
    );
  }

  if (showPhotoIntake) {
    return (
      <>
        <PhotoIntakePage onBack={() => setShowPhotoIntake(false)} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Timeline 
        milestones={milestones}
        onMilestoneClick={(id) => {
          setLastViewedMilestoneId(id);
          setSelectedMilestoneId(id);
        }}
        onDeleteMilestone={handleDeleteMilestone}
        focusMilestoneId={lastViewedMilestoneId}
      />

      <div className="fixed bottom-6 right-6 flex gap-2">
        <Button variant="outline" onClick={() => setShowPhotoIntake(true)}>
          Photo Intake
        </Button>
        <Button onClick={() => setShowEditor(true)}>Add Entry</Button>
      </div>

      <Toaster />
      <Butterfly opacity={0.7} tallTopWings />
      <Butterfly scale={0.65} delay={2} pathVariant={2} tallTopWings />
      <Butterfly scale={0.52} delay={4.3} opacity={0.58} pathVariant={1} baseColor="#d8a73a" tallTopWings />
    </>
  );
}
