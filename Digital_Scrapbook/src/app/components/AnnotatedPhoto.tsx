import { useState } from "react";
import { Annotation } from "../data/types";
import { X } from "lucide-react";

interface AnnotatedPhotoProps {
  photo: {
    id: string;
    url: string;
    caption?: string;
    annotations: Annotation[];
  };
  imageClassName?: string;
  frameClassName?: string;
}

export function AnnotatedPhoto({ photo, imageClassName, frameClassName }: AnnotatedPhotoProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const resolvedFrameClassName = frameClassName ?? "mx-auto w-fit";
  const resolvedImageClassName = imageClassName ?? "mx-auto h-auto max-h-[500px] w-auto max-w-full object-contain";

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className={`relative border-4 border-white shadow-xl rounded-sm overflow-hidden ${resolvedFrameClassName}`.trim()}>
          <img
            src={photo.url}
            alt={photo.caption || ""}
            className={resolvedImageClassName}
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
        </div>
      </div>

      {photo.caption && (
        <p className="text-center text-[#6b7c8d] text-lg leading-relaxed">{photo.caption}</p>
      )}
    </div>
  );
}