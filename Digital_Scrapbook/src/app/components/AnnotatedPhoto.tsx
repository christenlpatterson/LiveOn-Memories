import { useState } from "react";
import { Annotation } from "../data/types";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface AnnotatedPhotoProps {
  photo: {
    id: string;
    url: string;
    caption?: string;
    annotations: Annotation[];
  };
  onAddAnnotation?: (x: number, y: number, text: string, author: string) => void;
}

export function AnnotatedPhoto({ photo, onAddAnnotation }: AnnotatedPhotoProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [pendingText, setPendingText] = useState("");
  const [pendingAuthor, setPendingAuthor] = useState("");

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onAddAnnotation) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPending({ x, y });
    setPendingText("");
    setPendingAuthor("");
  };

  const cancelPending = () => {
    setPending(null);
    setPendingText("");
    setPendingAuthor("");
  };

  const savePending = () => {
    if (!pending || !onAddAnnotation) return;
    const text = pendingText.trim();
    if (!text) return;
    const author = pendingAuthor.trim() || "Anonymous";
    onAddAnnotation(pending.x, pending.y, text, author);
    cancelPending();
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div 
          className="relative cursor-pointer border-4 border-white shadow-xl rounded-sm overflow-hidden"
          onClick={handleImageClick}
        >
          <img 
            src={photo.url} 
            alt={photo.caption || ""} 
            className="w-full"
          />
          
          {photo.annotations.map((annotation) => (
            <div key={annotation.id}>
              {/* Annotation marker */}
              <button
                className="absolute w-6 h-6 bg-[#d4a743] border-2 border-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-white cursor-pointer text-xs rounded-full"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAnnotation(
                    selectedAnnotation === annotation.id ? null : annotation.id
                  );
                }}
              >
                ✒
              </button>
              
              {/* Annotation popup */}
              {selectedAnnotation === annotation.id && (
                <div
                  className="absolute z-10 bg-white border border-gray-200 shadow-2xl p-6 max-w-2xl rounded-md"
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    transform: 'translate(-50%, calc(-100% - 30px))'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotation(null);
                    }}
                    className="absolute top-3 right-3 text-[#6b7c8d] hover:text-[#2c3e50]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <p className="text-base text-[#2c3e50] mb-3 whitespace-pre-wrap">{annotation.text}</p>
                  <div className="text-sm text-[#6b7c8d]">
                    <div>— {annotation.author}</div>
                    <div>{annotation.date}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pending (unsaved) marker */}
          {pending && (
            <div
              className="absolute w-6 h-6 bg-[#d4a743] border-2 border-white shadow-lg flex items-center justify-center text-white text-xs rounded-full pointer-events-none animate-pulse"
              style={{
                left: `${pending.x}%`,
                top: `${pending.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              ✒
            </div>
          )}
        </div>
      </div>

      {/* Inline annotation form (no popup) */}
      {pending && (
        <div className="border border-gray-200 rounded-md bg-white p-4 space-y-3 shadow-sm">
          <textarea
            autoFocus
            placeholder="Annotation"
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); savePending(); }
              if (e.key === 'Escape') { e.preventDefault(); cancelPending(); }
            }}
            className="w-full border border-gray-200 rounded px-3 py-2 text-base resize-none"
            rows={5}
          />
          <input
            type="text"
            placeholder="Your name (optional)"
            value={pendingAuthor}
            onChange={(e) => setPendingAuthor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); savePending(); }
              if (e.key === 'Escape') { e.preventDefault(); cancelPending(); }
            }}
            className="w-full border border-gray-200 rounded px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={savePending} disabled={!pendingText.trim()}>
              Save annotation
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={cancelPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {photo.caption && (
        <p className="text-center text-[#6b7c8d] text-sm">{photo.caption}</p>
      )}
    </div>
  );
}