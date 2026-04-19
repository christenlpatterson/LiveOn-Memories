import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { getPhotoIntakeEntries, savePhotoIntakeEntry, type PhotoIntakeEntry } from '../../api';

interface PhotoIntakePageProps {
  onBack: () => void;
}

interface DraftValue {
  year: string;
  notes: string;
}

export function PhotoIntakePage({ onBack }: PhotoIntakePageProps) {
  const [entries, setEntries] = useState<PhotoIntakeEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getPhotoIntakeEntries()
      .then(setEntries)
      .catch(() => toast.error('Failed to load photos from the server.'))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = useMemo(() => {
    return entries.filter((entry) => entry.year.trim() || entry.notes.trim()).length;
  }, [entries]);

  const currentValue = (entry: PhotoIntakeEntry): DraftValue => {
    return drafts[entry.filename] ?? { year: entry.year ?? '', notes: entry.notes ?? '' };
  };

  const updateDraft = (filename: string, patch: Partial<DraftValue>) => {
    setDrafts((prev) => {
      const current = prev[filename] ?? { year: '', notes: '' };
      return {
        ...prev,
        [filename]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const saveEntry = async (entry: PhotoIntakeEntry) => {
    const value = currentValue(entry);

    setSaving((prev) => ({ ...prev, [entry.filename]: true }));
    try {
      const saved = await savePhotoIntakeEntry(entry.filename, {
        year: value.year,
        notes: value.notes,
      });

      setEntries((prev) => prev.map((item) => item.filename === saved.filename ? saved : item));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[entry.filename];
        return next;
      });
      toast.success(`Saved notes for ${entry.filename}`);
    } catch {
      toast.error(`Failed to save ${entry.filename}`);
    } finally {
      setSaving((prev) => ({ ...prev, [entry.filename]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f2ed] text-[#3f3a32] flex items-center justify-center">
        Loading photo intake page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-[#2f2a23]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Photo Intake</h1>
            <p className="text-sm sm:text-base text-[#6a6256] mt-1">
              Enter the year and memory notes for each photo.
            </p>
            <p className="text-sm text-[#6a6256] mt-1">
              Completed: {completedCount} / {entries.length}
            </p>
          </div>

          <Button onClick={onBack} variant="outline">Back to Scrapbook</Button>
        </div>

        <div className="grid gap-5 sm:gap-6">
          {entries.map((entry) => {
            const value = currentValue(entry);
            const isSaving = Boolean(saving[entry.filename]);

            return (
              <Card key={entry.filename} className="bg-white/90 border-[#ddd4c2]">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg break-all">{entry.filename}</CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
                  <div>
                    <img
                      src={entry.url}
                      alt={entry.filename}
                      className="rounded-md border border-[#d8cebb] object-contain"
                      style={{ maxWidth: '300px', maxHeight: '400px', width: 'auto', height: 'auto' }}
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <Input
                        value={value.year}
                        onChange={(e) => updateDraft(entry.filename, { year: e.target.value })}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. 1978"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <Textarea
                        value={value.notes}
                        onChange={(e) => updateDraft(entry.filename, { notes: e.target.value })}
                        placeholder="Describe the event, people, objects, and any story details..."
                        className="min-h-28"
                      />
                    </div>

                    <div className="rounded-md border border-[#e2d7c4] bg-[#fbf8f2] p-3 text-sm">
                      <div className="font-semibold text-[#4d4438] mb-1">Saved Values</div>
                      <div><span className="font-medium">Year:</span> {entry.year || 'Not saved yet'}</div>
                      <div className="mt-1 whitespace-pre-wrap">
                        <span className="font-medium">Notes:</span> {entry.notes || 'Not saved yet'}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateDraft(entry.filename, { year: entry.year, notes: entry.notes })}
                  >
                    Reset
                  </Button>
                  <Button onClick={() => saveEntry(entry)} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
