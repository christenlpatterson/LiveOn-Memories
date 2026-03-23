import { useState } from 'react';
import { Milestone, Photo } from '../data/types';
import { createMilestone, updateMilestone, uploadPhoto, deletePhoto } from '../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function extractMonth(date?: string): string {
  if (!date) return '';
  return MONTHS.find(m => date.includes(m)) ?? '';
}
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ScrapbookEditorProps {
  onCreate: (milestone: Milestone) => void;
  onClose: () => void;
  editMilestone?: Milestone | null;
  onUpdate?: (milestone: Milestone) => void;
}

export function ScrapbookEditor({ onCreate, onClose, editMilestone, onUpdate }: ScrapbookEditorProps) {
  const isEdit = Boolean(editMilestone);
  const [title, setTitle] = useState(editMilestone?.title ?? '');
  const [year, setYear] = useState(editMilestone?.year ? String(editMilestone.year) : '');
  const [month, setMonth] = useState(extractMonth(editMilestone?.date));
  const [description, setDescription] = useState(editMilestone?.description ?? '');
  const [story, setStory] = useState(editMilestone?.story ?? '');
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(editMilestone?.photos ?? []);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Array<{ id: string; previewUrl: string; file: File; type: string; caption?: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = `f${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const previewUrl = URL.createObjectURL(file);
      setPreviews((p) => [...p, { id, previewUrl, file, type: file.type, caption: '' }]);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setPreviews((p) => p.map(x => x.id === id ? { ...x, caption } : x));
  };

  const removePreview = (id: string) => {
    setPreviews((p) => {
      const rem = p.find(x => x.id === id);
      if (rem) URL.revokeObjectURL(rem.previewUrl);
      return p.filter(x => x.id !== id);
    });
  };

  const queueDeleteExisting = (photoId: string) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const entryYear = year ? parseInt(year) : new Date().getFullYear();
      const dateString = month ? `${month} ${entryYear}` : `${entryYear}`;

      if (isEdit && editMilestone) {
        const milestone = await updateMilestone(editMilestone.id, {
          year: entryYear,
          title: title || 'Untitled',
          date: dateString,
          description: description || '',
          story: story || '',
        });
        await Promise.all(photosToDelete.map(pid => deletePhoto(editMilestone.id, pid).catch(() => {})));
        const uploadedPhotos = await Promise.all(
          previews.map((pr) => uploadPhoto(editMilestone.id, pr.file, pr.caption))
        );
        previews.forEach((pr) => URL.revokeObjectURL(pr.previewUrl));
        onUpdate?.({ ...milestone, photos: [...existingPhotos, ...uploadedPhotos] });
      } else {
        const milestone = await createMilestone({
          year: entryYear,
          title: title || 'Untitled',
          date: dateString,
          description: description || '',
          story: story || '',
        });
        const uploadedPhotos = await Promise.all(
          previews.map((pr) => uploadPhoto(milestone.id, pr.file, pr.caption))
        );
        previews.forEach((pr) => URL.revokeObjectURL(pr.previewUrl));
        onCreate({ ...milestone, photos: uploadedPhotos });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8eef5] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-2xl mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl mb-6">{isEdit ? 'Edit Scrapbook Entry' : 'Create Scrapbook Entry'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm mb-1">Year <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="e.g. 1985"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="1800"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Month <span className="text-gray-400 text-xs">(optional)</span></label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
                  <option value="">— select a month —</option>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Short description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm mb-1">Story / Notes</label>
                <textarea value={story} onChange={(e) => setStory(e.target.value)} className="w-full border rounded px-3 py-2 h-32" />
              </div>

              {isEdit && existingPhotos.length > 0 && (
                <div>
                  <label className="block text-sm mb-2">Existing Photos</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingPhotos.map((p) => (
                      <div key={p.id} className="border rounded p-2 relative bg-gray-50">
                        <img src={p.url} alt={p.caption || ''} className="w-full h-40 object-cover rounded" />
                        <button type="button" onClick={() => queueDeleteExisting(p.id)} className="absolute top-2 right-2 bg-white border rounded px-2 py-1 text-xs">Remove</button>
                        {p.caption && <div className="mt-2 text-xs text-gray-600">{p.caption}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">Media (images, video, audio)</label>
                <label className="inline-flex items-center gap-1 cursor-pointer text-sm px-3 py-1.5 border rounded bg-white hover:bg-gray-50 transition-colors">
                  <span>+ file</span>
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    className="hidden"
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                  />
                </label>
              </div>

              {previews.length > 0 && (
                <div>
                  <label className="block text-sm mb-2">Previews</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((p) => (
                      <div key={p.id} className="border rounded p-2 relative bg-gray-50">
                        {p.type.startsWith('image/') && (
                          <img src={p.previewUrl} alt={p.caption} className="w-full h-40 object-cover rounded" />
                        )}
                        {p.type.startsWith('video/') && (
                          <video src={p.previewUrl} controls className="w-full h-40 object-cover rounded" />
                        )}
                        {p.type.startsWith('audio/') && (
                          <audio src={p.previewUrl} controls className="w-full" />
                        )}
                        <button type="button" onClick={() => removePreview(p.id)} className="absolute top-2 right-2 bg-white border rounded px-2 py-1 text-xs">Remove</button>
                        <input
                          type="text"
                          placeholder="Annotation (optional)"
                          value={p.caption}
                          onChange={(e) => updateCaption(p.id, e.target.value)}
                          className="mt-2 w-full border rounded px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}</Button>
                <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ScrapbookEditor;
