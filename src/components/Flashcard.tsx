import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Shuffle, Edit3 } from 'lucide-react';
import { Card } from '../types';

interface FlashcardProps {
  card: Card;
  autoplay: number;
  onResult: (learned: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onUpdateNote: (note: string) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ card, autoplay, onResult, onNext, onPrev, onShuffle, onUpdateNote }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setIsEditingNote(false);
  }, [card.id]);

  useEffect(() => {
    if (autoplay > 0 && !isEditingNote) {
      const timer = setTimeout(() => {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          onResult(false); 
          setIsFlipped(false);
          onNext();
        }
      }, autoplay * 1000);
      return () => clearTimeout(timer);
    }
  }, [autoplay, isFlipped, card.id, isEditingNote, onNext, onResult]);

  const handleCardClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    if (!isEditingNote) setIsFlipped(!isFlipped);
  };

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    // Escape regex special characters
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="text-medical font-bold bg-medical/10 px-1 rounded">{part}</span>
      ) : (
        <span key={i} className="opacity-80">{part}</span>
      )
    );
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <motion.div
        className="relative w-full h-[400px] cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleCardClick}
      >
        {/* Front Side */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-card rounded-2xl shadow-bento border-2 border-medical p-8 flex flex-col items-center justify-center text-center">
          <span className="inline-block px-2 py-1 bg-[#DCFCE7] text-[#166534] rounded-full text-[10px] font-bold mb-8 uppercase tracking-wider">Mobile Preview</span>
          <div className="flex-1 flex items-center justify-center">
            <h3 className="text-2xl font-bold text-text-main leading-tight whitespace-pre-wrap font-sans tracking-tight">
              {card.front}
            </h3>
          </div>
          <div className="mt-8 text-text-dim text-xs font-medium italic">
            Tap to flip
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden bg-card border-2 border-lang rounded-2xl shadow-bento p-8 flex flex-col items-center justify-center text-center rotate-y-180"
        >
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-8">Definition</span>
          <div className="flex-1 flex items-center justify-center w-full">
            <h3 className="text-lg font-serif text-text-main leading-relaxed whitespace-pre-wrap">
              {renderHighlightedText(card.back, card.front)}
            </h3>
          </div>
          <div className="mt-8 text-text-dim text-xs font-medium italic">
            Tap to flip back
          </div>
        </div>
      </motion.div>

      {/* Note Section (Visible when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-4 shadow-bento">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-dim uppercase tracking-widest">Self Note</span>
                <button 
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className="text-text-dim hover:text-medical transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              {isEditingNote ? (
                <textarea
                  autoFocus
                  value={card.note || ''}
                  onChange={(e) => onUpdateNote(e.target.value)}
                  placeholder="Add your personal notes here..."
                  className="w-full bg-bg border border-border rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-medical min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-text-main whitespace-pre-wrap min-h-[40px]">
                  {card.note || <span className="text-text-dim italic">No notes added yet.</span>}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation & Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button onClick={onPrev} className="p-3 rounded-full bg-card border border-border text-text-dim hover:text-text-main hover:border-text-dim transition-all shadow-bento active:scale-95">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <AnimatePresence mode="wait">
          {isFlipped ? (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-3"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResult(false);
                  setIsFlipped(false);
                  setIsEditingNote(false);
                  onNext(); // Auto advance
                }}
                className="flex items-center justify-center gap-2 bg-card border border-border text-text-main px-4 py-3 rounded-xl font-bold hover:border-text-dim transition-all shadow-bento active:scale-95"
              >
                <XCircle className="w-4 h-4 text-lang" style={{ color: '#ef4444' }} />
                Still Learning
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResult(true);
                  setIsFlipped(false);
                  setIsEditingNote(false);
                  onNext(); // Auto advance
                }}
                className="flex items-center justify-center gap-2 bg-medical text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-bento active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got it
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="shuffle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <button onClick={onShuffle} className="p-3 rounded-full bg-card border border-border text-text-dim hover:text-medical hover:border-medical transition-all shadow-bento active:scale-95">
                <Shuffle className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onNext} className="p-3 rounded-full bg-card border border-border text-text-dim hover:text-text-main hover:border-text-dim transition-all shadow-bento active:scale-95">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Flashcard;
