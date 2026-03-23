import { useState, useEffect } from 'react';
import { Timeline } from './components/Timeline';
import { DetailPage } from './components/pages/DetailPage';
import { ScrapbookEditor } from './components/ScrapbookEditor';
import { Milestone } from './data/types';
import {
  getMilestones,
  addComment,
  deleteComment,
  addAnnotation,
  deleteMilestone,
  uploadAudio,
  deleteAudioClip,
} from './api';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Button } from './components/ui/button';

export default function App() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  useEffect(() => {
    getMilestones()
      .then(setMilestones)
      .catch(() => toast.error('Could not reach the server. Is the Flask backend running?'))
      .finally(() => setLoading(false));
  }, []);

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

  const handleAddAnnotation = async (
    milestoneId: string, photoId: string,
    x: number, y: number, text: string, author: string,
  ) => {
    try {
      const annotation = await addAnnotation(milestoneId, photoId, x, y, text, author);
      setMilestones(prev => prev.map(m => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          photos: (m.photos ?? []).map(p =>
            p.id === photoId ? { ...p, annotations: [...p.annotations, annotation] } : p
          ),
        };
      }));
      toast.success('Annotation added!');
    } catch { toast.error('Failed to save annotation.'); }
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
    return (
      <>
        <DetailPage 
          milestone={selectedMilestone}
          onBack={() => setSelectedMilestoneId(null)}
          onAddComment={(author, text) => handleAddComment(selectedMilestone.id, author, text)}
          onDeleteComment={(commentId) => handleDeleteComment(selectedMilestone.id, commentId)}
          onAddAnnotation={(photoId, x, y, text, author) => 
            handleAddAnnotation(selectedMilestone.id, photoId, x, y, text, author)
          }
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

  return (
    <>
      <Timeline 
        milestones={milestones}
        onMilestoneClick={setSelectedMilestoneId}
        onDeleteMilestone={handleDeleteMilestone}
      />

      <div className="fixed bottom-6 right-6">
        <Button onClick={() => setShowEditor(true)}>Add Entry</Button>
      </div>

      <Toaster />
    </>
  );
}
