import React, { useState, useMemo } from 'react';
import { Search, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Deck } from '../types';

interface LibraryProps {
  decks: Deck[];
}

export default function Library({ decks }: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const allCards = useMemo(() => {
    return decks.flatMap(deck => 
      deck.cards.map(card => ({
        ...card,
        deckName: deck.name,
        deckId: deck.id
      }))
    );
  }, [decks]);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return allCards;
    const lowerTerm = searchTerm.toLowerCase();
    return allCards.filter(c => 
      c.front.toLowerCase().includes(lowerTerm) || 
      c.back.toLowerCase().includes(lowerTerm) ||
      (c.note && c.note.toLowerCase().includes(lowerTerm)) ||
      c.deckName.toLowerCase().includes(lowerTerm)
    );
  }, [allCards, searchTerm]);

  const totalMastered = allCards.filter(c => c.learned).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Master Glossary</h2>
          <p className="text-text-dim">Search and review all {allCards.length} words across your decks.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-bento">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-medical">{totalMastered}</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Mastered</div>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-text-main">{allCards.length}</div>
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Total Words</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-dim" />
        </div>
        <input
          type="text"
          placeholder="Search by word, definition, notes, or deck name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-card border-2 border-border rounded-2xl text-text-main placeholder-text-dim focus:outline-none focus:border-medical transition-colors shadow-bento font-medium"
        />
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 text-text-dim mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-text-main mb-2">No words found</h3>
          <p className="text-text-dim">Try adjusting your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => (
            <div key={card.id} className="bg-card rounded-2xl p-6 border border-border shadow-bento flex flex-col hover:border-medical transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <span className="inline-block px-2 py-1 bg-bg text-text-dim rounded-md text-[10px] font-bold uppercase tracking-wider border border-border">
                  {card.deckName}
                </span>
                {card.learned ? (
                  <CheckCircle2 className="w-5 h-5 text-medical" />
                ) : (
                  <Circle className="w-5 h-5 text-border" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-text-main mb-2 font-sans">{card.front}</h3>
              <p className="text-sm text-text-dim font-serif leading-relaxed mb-4 flex-1">{card.back}</p>
              
              {card.note && (
                <div className="mt-auto pt-4 border-t border-border">
                  <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Note</div>
                  <p className="text-xs text-text-main italic line-clamp-2">{card.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
