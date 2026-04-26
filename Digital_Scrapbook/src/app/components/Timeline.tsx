import { useEffect, useRef } from "react";
import { Milestone } from "../data/types";
import { Card, CardContent } from "./ui/card";
import mastheadImage from '../../assets/c91b4e962107e52ada9704179f213d4fc1fc70b0.png';

interface TimelineProps {
  milestones: Milestone[];
  onMilestoneClick: (id: string) => void;
  onDeleteMilestone?: (id: string) => void;
  focusMilestoneId?: string | null;
}

export function Timeline({ milestones, onMilestoneClick, onDeleteMilestone, focusMilestoneId }: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const milestoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!focusMilestoneId) return;
    const el = milestoneRefs.current[focusMilestoneId];
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    // Center the milestone horizontally within the scroll container.
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = (elRect.left + elRect.width / 2) - (containerRect.left + containerRect.width / 2);
    container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
  }, [focusMilestoneId, milestones]);

  return (
    <div className="h-screen flex flex-col bg-[#e8eef5] overflow-x-hidden">
      {/* Masthead with butterfly tree and title - stays fixed */}
      <div className="relative w-full bg-white overflow-hidden" style={{ height: '200px' }}>
        <img 
          src={mastheadImage}
          alt="Masthead"
          className="absolute right-0 top-0 h-full w-auto object-contain"
        />
        {/* White-to-transparent gradient overlay so the title stays legible on small screens */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,0) 75%)',
          }}
        />
        <div className="absolute inset-0 flex items-center px-12">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#c9a961' }}>
              <span className="whitespace-nowrap">Grams &amp;</span>
              <br className="sm:hidden" />
              <span className="sm:before:content-['_']">Granddad</span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl" style={{ fontFamily: "'Playfair Display', serif", color: '#d4a743' }}>
              Treasured Memories
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Timeline - scrollable, takes remaining height */}
      <div className="relative flex-1">
        {/* Gold line on the viewport-sized wrapper — always edge to edge, never clipped */}
        <div className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-[#c9a961] via-[#d4a743] to-[#c9a961]" style={{ top: '50%', transform: 'translateY(-50%)' }} />
        {/* Scroll container fills the same space */}
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-x-auto px-4 flex items-center">
          <div className="relative flex justify-start items-center px-8" style={{ minWidth: 'max-content', width: `${milestones.length * 150}px` }}>

          {milestones.map((milestone, index) => {
            const isAbove = index % 2 === 0;
            
            return (
                <div 
                  key={milestone.id} 
                  ref={(el) => { milestoneRefs.current[milestone.id] = el; }}
                  className="relative flex flex-col items-center"
                  style={{ width: '150px', flexShrink: 0 }}
              >
                {/* Card positioned above or below */}
                <div 
                  className={`absolute ${isAbove ? 'bottom-full mb-8' : 'top-full mt-8'} left-1/2 transform -translate-x-1/2`}
                  style={{ width: '200px' }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-2xl transition-all duration-300 bg-white border-gray-200 overflow-hidden relative"
                    onClick={() => onMilestoneClick(milestone.id)}
                  >
                    <CardContent className="p-4">
                      {milestone.photos && milestone.photos.length > 0 && (
                        <div className="mb-3">
                          <img 
                            src={milestone.photos[0].url} 
                            alt={milestone.title}
                            className="w-full h-32 object-cover rounded-sm"
                          />
                        </div>
                      )}
                      <h3 className="text-sm mb-1 text-[#2c3e50]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {milestone.title}
                      </h3>
                    </CardContent>
                  </Card>
                </div>

                {/* Vertical connector line */}
                <div 
                  className={`absolute ${isAbove ? 'bottom-0 top-auto' : 'top-0 bottom-auto'} w-px bg-[#d4a743]`}
                  style={{ height: '60px', transform: 'translateY(0)' }}
                />

                {/* Timeline dot */}
                <div className="relative z-10 w-5 h-5 rounded-full bg-[#d4a743] border-4 border-white shadow-lg" />

                {/* Year label */}
                <div 
                  className={`absolute ${isAbove ? 'top-full mt-2' : 'bottom-full mb-2'} text-sm text-[#5a6c7d]`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {milestone.year}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}