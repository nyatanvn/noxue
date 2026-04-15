import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Trash2, Clock, Layers } from 'lucide-react';
import { Deck } from '../types';

interface DeckListProps {
  decks: Deck[];
  onSelect: (deck: Deck) => void;
  onDelete: (id: string) => void;
}

export default function DeckList({ decks, onSelect, onDelete }: DeckListProps) {
  if (decks.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">Active Sources</h2>
        <span className="text-[10px] font-bold text-text-dim bg-border px-2 py-1 rounded-full uppercase tracking-widest">
          {decks.length} {decks.length === 1 ? 'Source' : 'Sources'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {decks.map((deck, idx) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-card rounded-2xl p-5 shadow-bento border border-border hover:border-medical transition-all cursor-pointer flex flex-col"
            onClick={() => onSelect(deck)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center group-hover:bg-medical group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text-main truncate">{deck.name}</h3>
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">
                  {deck.sourceType === 'xlsx' ? 'Excel Sheet' : 'Word Doc'}
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-text-dim text-[11px] font-medium">
                <Layers className="w-3 h-3" />
                <span>{deck.cards.length} cards</span>
              </div>
              <div className="flex items-center gap-1 text-text-dim text-[11px] font-medium">
                <Clock className="w-3 h-3" />
                <span>{new Date(deck.lastAccessed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(deck.id);
              }}
              className="absolute top-3 right-3 p-1.5 text-text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
