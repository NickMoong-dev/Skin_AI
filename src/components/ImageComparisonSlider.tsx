import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Split } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  before: string;
  after: string;
}

export const ImageComparisonSlider: React.FC<Props> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'slider' | 'side'>('slider');

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    // Prevent default scroll behavior on touch devices during sliding
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;

    if (position >= 0 && position <= 100) {
      setSliderPos(position);
    }
  };

  const handleEnd = () => setIsResizing(false);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    const ResizeObserver = (window as any).ResizeObserver;
    const observer = new ResizeObserver(() => {
      // Trigger a re-render to update container width in style
      setSliderPos(pos => pos);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      observer.disconnect();
    };
  }, [isResizing]);

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl shadow-slate-200 ring-2 ring-slate-100 group select-none touch-none"
        onMouseMove={(e) => isResizing && handleMove(e as any)}
        onTouchMove={(e) => isResizing && handleMove(e as any)}
      >
        <div className="absolute inset-0">
          {/* After image (background) */}
          <img src={after} alt="after" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          
          {/* Before image (foreground clip) */}
          <div 
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img 
              src={before} 
              alt="before" 
              className="absolute inset-0 object-cover max-w-none" 
              style={{ width: containerRef.current?.getBoundingClientRect().width || '100%', height: '100%' }} 
            />
          </div>

          {/* Slider handle */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-xl flex items-center justify-center">
              <div 
                className="w-10 h-10 rounded-full bg-white shadow-2xl border border-slate-100 flex items-center justify-center pointer-events-auto cursor-ew-resize active:scale-110 transition-transform"
                onMouseDown={() => setIsResizing(true)}
                onTouchStart={() => setIsResizing(true)}
              >
                <div className="flex space-x-0.5">
                  <ChevronLeft size={16} className="text-slate-900" />
                  <ChevronRight size={16} className="text-slate-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-6 left-6 pointer-events-none">
            <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest border border-white/50">변경 전</span>
          </div>
          <div className="absolute top-6 right-6 pointer-events-none">
            <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">최종 결과</span>
          </div>
        </div>
      </div>
    </div>
  );
};
