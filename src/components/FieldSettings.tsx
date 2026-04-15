import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Deck } from '../types';
import { cn } from '../lib/utils';

interface FieldSettingsProps {
  deck: Deck;
  onSave: (frontCols: string[], backCols: string[]) => void;
  onClose: () => void;
}

export default function FieldSettings({ deck, onSave, onClose }: FieldSettingsProps) {
  const [frontCols, setFrontCols] = useState<string[]>(deck.frontCols || []);
  const [backCols, setBackCols] = useState<string[]>(deck.backCols || []);

  const headers = deck.headers || [];

  if (headers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card rounded-3xl shadow-bento border border-border p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-text-main mb-4">Feature Unavailable</h2>
          <p className="text-text-dim mb-8">This deck was created before the field adjustment feature was added. Please re-import your file to adjust fields.</p>
          <button
            onClick={onClose}
            className="bg-medical text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-bento w-full"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const toggleCol = (col: string, side: 'front' | 'back') => {
    const setter = side === 'front' ? setFrontCols : setBackCols;
    const current = side === 'front' ? frontCols : backCols;
    
    if (current.includes(col)) {
      setter(current.filter(c => c !== col));
    } else {
      setter([...current, col]);
    }
  };

  const handleSave = () => {
    if (frontCols.length > 0 && backCols.length > 0) {
      onSave(frontCols, backCols);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-card rounded-3xl shadow-bento border border-border p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-main">Card Fields</h2>
            <p className="text-text-dim text-sm">Adjust what shows on the front and back of your cards.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-dim hover:text-text-main transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Front Side */}
          <div>
            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4">Front Face</h3>
            <div className="space-y-2">
              {headers.map(header => (
                <button
                  key={`front-${header}`}
                  onClick={() => toggleCol(header, 'front')}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between text-sm",
                    frontCols.includes(header) 
                      ? "bg-medical/10 border-medical text-medical" 
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
              {headers.map(header => (
                <button
                  key={`back-${header}`}
                  onClick={() => toggleCol(header, 'back')}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between text-sm",
                    backCols.includes(header) 
                      ? "bg-lang/10 border-lang text-lang" 
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

        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={frontCols.length === 0 || backCols.length === 0}
            className="bg-medical text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-bento"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
