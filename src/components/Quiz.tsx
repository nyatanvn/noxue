import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, XCircle, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { Card } from '../types';
import { cn } from '../lib/utils';

interface QuizProps {
  cards: Card[];
  onComplete: (score: number, total: number) => void;
  onExit: () => void;
}

export default function Quiz({ cards, onComplete, onExit }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  // Generate options for the current card
  const options = useMemo(() => {
    if (!currentCard) return [];
    
    // Get 3 random incorrect answers from other cards
    const otherCards = cards.filter(c => c.id !== currentCard.id);
    const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
    const incorrectOptions = shuffledOthers.slice(0, 3).map(c => c.back);
    
    // Combine with correct answer and shuffle
    const allOptions = [currentCard.back, ...incorrectOptions];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [currentCard, cards]);

  const handleSelect = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    if (answer === currentCard.back) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (!cards.length) {
    return (
      <div className="text-center py-20 bg-card rounded-3xl shadow-bento border border-border">
        <p className="text-text-dim">No cards available for quiz.</p>
        <button onClick={onExit} className="mt-4 text-medical font-bold">Go Back</button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / cards.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-card rounded-3xl shadow-bento border border-border p-10 text-center"
      >
        <div className="w-24 h-24 bg-medical/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-medical" />
        </div>
        <h2 className="text-3xl font-bold text-text-main mb-2">Quiz Complete!</h2>
        <p className="text-text-dim mb-8">You scored {score} out of {cards.length}</p>
        
        <div className="text-6xl font-extrabold text-medical mb-10">
          {percentage}%
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setIsFinished(false);
              setSelectedAnswer(null);
              setIsAnswered(false);
            }}
            className="w-full bg-bg border border-border text-text-main py-4 rounded-xl font-bold hover:border-text-dim transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          <button 
            onClick={() => onComplete(score, cards.length)}
            className="w-full bg-medical text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-bento"
          >
            Back to Study
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onExit} className="text-text-dim hover:text-text-main font-medium transition-colors">
          Exit Quiz
        </button>
        <div className="text-sm font-bold text-text-dim uppercase tracking-widest">
          Question {currentIndex + 1} of {cards.length}
        </div>
        <div className="text-medical font-bold">
          Score: {score}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-bento border border-border p-8 mb-6">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-medical/10 text-medical rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
            What is the definition of:
          </span>
          <h3 className="text-3xl font-bold text-text-main font-sans leading-tight">
            {currentCard.front}
          </h3>
        </div>

        <div className="space-y-3">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentCard.back;
            
            let btnClass = "bg-bg border-border text-text-main hover:border-medical";
            if (isAnswered) {
              if (isCorrect) {
                btnClass = "bg-[#DCFCE7] border-[#166534] text-[#166534]";
              } else if (isSelected) {
                btnClass = "bg-[#FEE2E2] border-[#991B1B] text-[#991B1B]";
              } else {
                btnClass = "bg-bg border-border text-text-dim opacity-50";
              }
            } else if (isSelected) {
              btnClass = "bg-medical/10 border-medical text-medical";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left p-5 rounded-2xl border-2 transition-all font-serif text-lg leading-relaxed flex items-center justify-between",
                  btnClass
                )}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-end"
          >
            <button
              onClick={handleNext}
              className="bg-medical text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-bento"
            >
              {currentIndex < cards.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
