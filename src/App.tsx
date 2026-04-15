import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, Sparkles, Trophy, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Deck, RawData, AppState, Card, Theme } from './types';
import { cn } from './lib/utils';
import FileUploader from './components/FileUploader';
import DeckConfig from './components/DeckConfig';
import Flashcard from './components/Flashcard';
import DeckList from './components/DeckList';
import Library from './components/Library';
import Quiz from './components/Quiz';
import FieldSettings from './components/FieldSettings';

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isFieldSettingsOpen, setIsFieldSettingsOpen] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('bento');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [unitSize, setUnitSize] = useState(20);
  const [currentUnit, setCurrentUnit] = useState(0);
  const [autoplay, setAutoplay] = useState(0);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load decks and theme from localStorage
  useEffect(() => {
    const savedDecks = localStorage.getItem('noxue-decks');
    if (savedDecks) {
      try {
        setDecks(JSON.parse(savedDecks));
      } catch (e) {
        console.error('Failed to load decks', e);
      }
    }
    const savedTheme = localStorage.getItem('noxue-theme');
    if (savedTheme) {
      setTheme(savedTheme as Theme);
    }
  }, []);

  // Save decks to localStorage
  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem('noxue-decks', JSON.stringify(decks));
    }
  }, [decks]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('noxue-theme', theme);
  }, [theme]);

  const activeDeck = useMemo(() => 
    decks.find(d => d.id === activeDeckId), 
    [decks, activeDeckId]
  );

  const units = useMemo(() => {
    if (!activeDeck) return [];
    
    const hasUnits = activeDeck.cards.some(c => c.rawData?._Unit);
    
    if (hasUnits) {
      const unitMap = new Map<string, Card[]>();
      activeDeck.cards.forEach(card => {
        const unitName = card.rawData?._Unit || 'Uncategorized';
        if (!unitMap.has(unitName)) unitMap.set(unitName, []);
        unitMap.get(unitName)!.push(card);
      });
      return Array.from(unitMap.entries()).map(([name, cards]) => ({ name, cards }));
    } else {
      const chunks = [];
      for (let i = 0; i < activeDeck.cards.length; i += unitSize) {
        chunks.push({
          name: `Unit ${i / unitSize + 1} (${i + 1}-${Math.min(i + unitSize, activeDeck.cards.length)})`,
          cards: activeDeck.cards.slice(i, i + unitSize)
        });
      }
      return chunks;
    }
  }, [activeDeck, unitSize]);

  const activeCards = useMemo(() => {
    if (!units.length) return [];
    return units[currentUnit]?.cards || [];
  }, [units, currentUnit]);

  // Reset card index when active deck changes
  useEffect(() => {
    setCurrentUnit(0);
    setCurrentCardIndex(0);
  }, [activeDeckId]);

  useEffect(() => {
    setCurrentCardIndex(0);
  }, [currentUnit]);

  const currentCard = activeCards[currentCardIndex] || null;

  const progress = useMemo(() => {
    if (!activeCards || activeCards.length === 0) return 0;
    const learned = activeCards.filter(c => c.learned).length;
    return Math.round((learned / activeCards.length) * 100);
  }, [activeCards]);

  const learningData = useMemo(() => {
    const days = Array(7).fill(0);
    const now = new Date();
    now.setHours(0,0,0,0);
    
    let totalLearned = 0;
    let totalCards = 0;

    decks.forEach(deck => {
      totalCards += deck.cards.length;
      deck.cards.forEach(card => {
        if (card.learned) totalLearned++;
        if (card.learned && card.lastReviewed) {
          const revDate = new Date(card.lastReviewed);
          revDate.setHours(0,0,0,0);
          const diffTime = now.getTime() - revDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays >= 0 && diffDays < 7) {
            days[6 - diffDays]++; 
          }
        }
      });
    });

    const max = Math.max(...days, 1);
    const percentages = days.map(d => (d / max) * 100);
    
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    const retention = totalCards > 0 ? Math.round((totalLearned / totalCards) * 100) : 0;

    return { percentages, labels, retention, totalLearned };
  }, [decks]);

  const handleDataLoaded = (data: RawData) => {
    setRawData(data);
    setState('configuring');
    setError(null);
  };

  const handleDeckComplete = (newDeck: Deck) => {
    setDecks(prev => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    setState('learning');
    setRawData(null);
  };

  const handleCardResult = (learned: boolean) => {
    if (!activeDeckId || !currentCard) return;

    setDecks(prev => prev.map(deck => {
      if (deck.id !== activeDeckId) return deck;
      return {
        ...deck,
        lastAccessed: Date.now(),
        cards: deck.cards.map(card => {
          if (card.id !== currentCard.id) return card;
          return {
            ...card,
            learned: learned,
            strength: learned ? Math.min(card.strength + 0.2, 1) : Math.max(card.strength - 0.1, 0),
            lastReviewed: Date.now(),
          };
        })
      };
    }));
  };

  const handleNext = () => {
    if (!activeCards.length) return;
    setCurrentCardIndex(prev => (prev + 1) % activeCards.length);
  };

  const handlePrev = () => {
    if (!activeCards.length) return;
    setCurrentCardIndex(prev => (prev - 1 + activeCards.length) % activeCards.length);
  };

  const handleShuffle = () => {
    if (!activeDeck) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setDecks(prev => prev.map(d => d.id === activeDeck.id ? { ...d, cards: shuffled } : d));
    setCurrentCardIndex(0);
  };

  const handleUpdateNote = (note: string) => {
    if (!activeDeck || !currentCard) return;
    setDecks(prev => prev.map(d => {
      if (d.id !== activeDeck.id) return d;
      return {
        ...d,
        cards: d.cards.map(c => c.id === currentCard.id ? { ...c, note } : c)
      };
    }));
  };

  const handleDeleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    if (activeDeckId === id) {
      setActiveDeckId(null);
      setState('home');
    }
  };

  const handleUpdateFields = (frontCols: string[], backCols: string[]) => {
    if (!activeDeck) return;
    
    setDecks(prev => prev.map(deck => {
      if (deck.id !== activeDeck.id) return deck;
      
      return {
        ...deck,
        frontCols,
        backCols,
        cards: deck.cards.map(card => {
          if (!card.rawData) return card;
          return {
            ...card,
            front: frontCols.map(c => card.rawData![c]).filter(Boolean).join('\n'),
            back: backCols.map(c => card.rawData![c]).filter(Boolean).join('\n'),
          };
        })
      };
    }));
    setIsFieldSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-medical selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border px-10 h-[60px] flex items-center transition-colors duration-300">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer logo group"
            onClick={() => setState('home')}
          >
            <div className="w-8 h-8 bg-medical rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Noxue</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6 text-sm font-medium text-text-dim">
            <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-2 py-1">
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as Theme)}
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer text-text-main"
              >
                <option value="bento">Bento</option>
                <option value="dark">Dark Luxury</option>
                <option value="warm">Warm Organic</option>
                <option value="brutalist">Brutalist</option>
                <option value="wild">Wild</option>
              </select>
            </div>
            
            <button onClick={() => setState('home')} className={cn("hover:text-text-main transition-colors", state === 'home' && "text-text-main font-bold")}>Dashboard</button>
            <button onClick={() => setState('library')} className={cn("hover:text-text-main transition-colors", state === 'library' && "text-text-main font-bold")}>Library</button>
            
            {(state === 'home' || state === 'library') && (
              <button 
                onClick={() => setState('uploading')}
                className="bg-medical text-white px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 ml-1 md:ml-4 shadow-bento"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Source</span>
              </button>
            )}
            {state === 'learning' && (
              <button 
                onClick={() => setState('home')}
                className="text-text-dim hover:text-text-main transition-colors"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-10">
        <AnimatePresence mode="wait">
          {state === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Master any subject, <br />
                  <span className="text-gray-400">one card at a time.</span>
                </h2>
                <p className="text-gray-500 text-lg">
                  The artful way to learn languages and medical knowledge. 
                  Upload your sources and start your journey.
                </p>
              </div>

              {decks.length > 0 ? (
                <div className="space-y-8">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 bg-card rounded-2xl p-6 shadow-bento border border-border flex flex-col">
                      <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4">Learning Curve (Last 7 Days)</div>
                      <div className="flex-1 flex items-end gap-2 min-h-[100px] pt-4">
                        {learningData.percentages.map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-medical rounded-t-sm opacity-70 hover:opacity-100 transition-opacity cursor-help"
                            style={{ height: `${h}%` }}
                            title={`${Math.round(h)}% activity`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-4 text-[9px] font-bold text-text-dim uppercase tracking-tighter">
                        {learningData.labels.map((label, i) => (
                          <span key={i}>{label}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4">
                      <div className="bg-card rounded-2xl p-6 shadow-bento border border-border flex flex-col justify-center items-center text-center">
                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Overall Retention</div>
                        <div className="text-3xl font-extrabold text-lang">{learningData.retention}%</div>
                        <div className="text-[10px] font-bold text-lang mt-1">Total Accuracy</div>
                      </div>
                      <div className="bg-card rounded-2xl p-6 shadow-bento border border-border flex flex-col justify-center items-center text-center text-text-main">
                        <div className="text-3xl font-extrabold text-medical mb-2">{learningData.totalLearned}</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider">Cards Mastered</div>
                        <div className="text-[9px] text-text-dim mt-1">Keep it up!</div>
                      </div>
                    </div>
                  </div>

                  <DeckList 
                    decks={decks} 
                    onSelect={(deck) => {
                      setActiveDeckId(deck.id);
                      setState('learning');
                    }}
                    onDelete={handleDeleteDeck}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    <Plus className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">No decks yet. Create your first one!</p>
                  <button 
                    onClick={() => setState('uploading')}
                    className="mt-6 text-gray-900 font-bold underline underline-offset-8 hover:text-black"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {state === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button 
                onClick={() => setState('home')}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Decks
              </button>
              <FileUploader 
                onDataLoaded={handleDataLoaded}
                onError={setError}
              />
              {error && (
                <p className="mt-4 text-center text-red-500 text-sm font-medium">{error}</p>
              )}
            </motion.div>
          )}

          {state === 'configuring' && rawData && (
            <motion.div
              key="configuring"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DeckConfig 
                rawData={rawData}
                onComplete={handleDeckComplete}
                onCancel={() => {
                  setRawData(null);
                  setState('home');
                }}
              />
            </motion.div>
          )}

          {state === 'learning' && activeDeck && (
            <motion.div
              key="learning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
                <div>
                  <button 
                    onClick={() => setState('home')}
                    className="flex items-center gap-2 text-text-dim hover:text-text-main transition-colors font-medium mb-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Exit Session
                  </button>
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-text-main">{activeDeck.name}</h2>
                    <button 
                      onClick={() => setIsFieldSettingsOpen(true)}
                      className="text-text-dim hover:text-text-main transition-colors"
                      title="Adjust Fields"
                    >
                      <Settings2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsQuizMode(true)}
                      className="bg-medical/10 text-medical px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-medical/20 transition-colors"
                    >
                      Quiz Mode
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 bg-card p-2 rounded-xl border border-border shadow-bento">
                  <select 
                    value={currentUnit} 
                    onChange={e => setCurrentUnit(Number(e.target.value))}
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-medical max-w-[200px] truncate"
                  >
                    {units.map((unit, i) => (
                      <option key={i} value={i}>{unit.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={autoplay}
                    onChange={e => setAutoplay(Number(e.target.value))}
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-medical"
                  >
                    <option value={0}>Autoplay: Off</option>
                    <option value={3}>3s</option>
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                  </select>
                </div>

                <div className="text-right hidden md:block">
                  <div className="flex items-center justify-end gap-2 text-text-dim text-sm font-bold uppercase tracking-widest mb-1">
                    <Trophy className="w-4 h-4" />
                    <span>Unit Progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-medical"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-text-main">{progress}%</span>
                  </div>
                </div>
              </div>

              {isFieldSettingsOpen && activeDeck && (
                <FieldSettings 
                  deck={activeDeck}
                  onSave={handleUpdateFields}
                  onClose={() => setIsFieldSettingsOpen(false)}
                />
              )}

              {isQuizMode ? (
                <Quiz 
                  cards={activeCards}
                  onComplete={(score, total) => {
                    setIsQuizMode(false);
                  }}
                  onExit={() => setIsQuizMode(false)}
                />
              ) : currentCard ? (
                <Flashcard 
                  key={currentCard.id}
                  card={currentCard}
                  autoplay={autoplay}
                  onResult={handleCardResult}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onShuffle={handleShuffle}
                  onUpdateNote={handleUpdateNote}
                />
              ) : (
                <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Deck Mastered!</h3>
                  <p className="text-gray-500 mb-12">You've learned all the cards in this deck.</p>
                  <button 
                    onClick={() => setState('home')}
                    className="bg-medical text-white px-12 py-4 rounded-3xl font-bold hover:opacity-90 transition-all shadow-bento"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {state === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Library decks={decks} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation Spacer */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
