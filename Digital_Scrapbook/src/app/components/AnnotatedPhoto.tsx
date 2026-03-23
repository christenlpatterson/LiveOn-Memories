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
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onAddAnnotation) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const text = prompt("Add your annotation:");
    if (text) {
      const author = prompt("Your name:");
      if (author) {
        onAddAnnotation(x, y, text, author);
      }
    }
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
          
          {showAnnotations && photo.annotations.map((annotation) => (
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
                  className="absolute z-10 bg-white border border-gray-200 shadow-2xl p-4 max-w-xs rounded-md"
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
                    className="absolute top-2 right-2 text-[#6b7c8d] hover:text-[#2c3e50]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm text-[#2c3e50] mb-2">{annotation.text}</p>
                  <div className="text-xs text-[#6b7c8d]">
                    <div>— {annotation.author}</div>
                    <div>{annotation.date}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {photo.annotations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-white border-gray-200 text-[#5a6c7d] hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowAnnotations(!showAnnotations);
            }}
          >
            {showAnnotations ? 'Hide' : 'Show'} Notes ({photo.annotations.length})
          </Button>
        )}
      </div>
      
      {photo.caption && (
        <p className="text-center text-[#6b7c8d] text-sm">{photo.caption}</p>
      )}
    </div>
  );
}