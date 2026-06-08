import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Story } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  currentUserId?: string;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose, currentUserId }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const story = stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + 1;
      });
    }, 40); // 4 seconds per story roughly (100 * 40ms)

    // Mark as viewed
    if (currentUserId && story && !story.viewers.includes(currentUserId)) {
      const storyRef = doc(db, 'stories', story.id);
      updateDoc(storyRef, { viewers: arrayUnion(currentUserId) });
    }

    return () => clearInterval(interval);
  }, [currentIndex, story, currentUserId]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!story) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {/* Header / Bars */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 space-y-4">
        <div className="flex space-x-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-white transition-all duration-100 ease-linear",
                  i < currentIndex ? "w-full" : (i === currentIndex ? "" : "w-0")
                )}
                style={{ width: i === currentIndex ? `${progress}%` : undefined }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-full border-2 border-vibe-neon-blue p-0.5">
                <img src={story.userPhotoURL || `https://ui-avatars.com/api/?name=${story.userDisplayName}`} className="w-full h-full rounded-full object-cover" />
             </div>
             <div>
                <h4 className="text-white text-xs font-black uppercase tracking-widest">{story.userDisplayName}</h4>
                <p className="text-[10px] text-white/60 font-bold uppercase">{formatDistanceToNow(story.createdAt.toDate(), { addSuffix: true, locale: ptBR })}</p>
             </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-1 text-white/60">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black">{story.viewers?.length || 0}</span>
             </div>
             <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full max-w-lg overflow-hidden">
        {story.type === 'video' ? (
          <video 
            src={story.mediaUrl} 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={story.mediaUrl} 
            className="w-full h-full object-cover"
            alt="Story"
          />
        )}

        {/* Navigation Layers */}
        <div className="absolute inset-0 flex">
           <div className="w-1/3 h-full" onClick={handlePrev} />
           <div className="w-1/3 h-full" />
           <div className="w-1/3 h-full" onClick={handleNext} />
        </div>

        {/* Swipe Hint */}
        <div className="absolute bottom-10 left-0 w-full flex justify-center">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Toque para navegar</p>
        </div>
      </div>
    </motion.div>
  );
}
