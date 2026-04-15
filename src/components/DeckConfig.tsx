import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { RawData, Deck, Card } from '../types';
import { cn } from '../lib/utils';

interface DeckConfigProps {
  rawData: RawData;
  onComplete: (deck: Deck) => void;
  onCancel: () => void;
}

export default function DeckConfig({ rawData, onComplete, onCancel }: DeckConfigProps) {
  const [frontCols, setFrontCols] = useState<string[]>([]);
  const [backCols, setBackCols] = useState<string[]>([]);

  const toggleCol = (col: string, side: 'front' | 'back') => {
    const setter = side === 'front' ? setFrontCols : setBackCols;
    const current = side === 'front' ? frontCols : backCols;
    
    if (current.includes(col)) {
      setter(current.filter(c => c !== col));
    } else {
      setter([...current, col]);
    }
  };

  const handleCreate = () => {
    if (frontCols.length === 0 || backCols.length === 0) return;

    const cards: Card[] = rawData.rows.map((row, idx) => ({
      id: `card-${Date.now()}-${idx}`,
      front: frontCols.map(c => row[c]).filter(Boolean).join('\n'),
      back: backCols.map(c => row[c]).filter(Boolean).join('\n'),
      learned: false,
      strength: 0,
    })).filter(card => card.front && card.back);

    const deck: Deck = {
      id: `deck-${Date.now()}`,
      name: rawData.name,
      cards,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      sourceType: 'xlsx', // Simplified
    };

    onComplete(deck);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-bento border border-border"
    >
      <div className="mb-8">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-2">Configuration</h2>
        <p className="text-xl font-bold text-text-main">Column Mapping</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Front Side */}
        <div>
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4">Front Face</h3>
          <div className="space-y-2">
            {rawData.headers.map(header => (
              <button
                key={`front-${header}`}
                onClick={() => toggleCol(header, 'front')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between text-sm",
                  frontCols.includes(header) 
                    ? "bg-medical/5 border-medical text-medical" 
                    : "bg-bg border-border text-text-main hover:border-text-dim"
                )}
              >
                <span className="font-bold">{header}</span>
                {frontCols.includes(header) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Back Side */}
        <div>
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4">Back Face</h3>
          <div className="space-y-2">
            {rawData.headers.map(header => (
              <button
                key={`back-${header}`}
                onClick={() => toggleCol(header, 'back')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between text-sm",
                  backCols.includes(header) 
                    ? "bg-lang/5 border-lang text-lang" 
                    : "bg-bg border-border text-text-main hover:border-text-dim"
                )}
              >
                <span className="font-bold">{header}</span>
                {backCols.includes(header) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between pt-6 border-t border-border">
        <button 
          onClick={onCancel}
          className="text-text-dim hover:text-text-main font-bold text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={frontCols.length === 0 || backCols.length === 0}
          className="bg-medical text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-bento"
        >
          GO
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
