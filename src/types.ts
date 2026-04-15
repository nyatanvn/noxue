export interface Card {
  id: string;
  front: string;
  back: string;
  learned: boolean;
  lastReviewed?: number;
  strength: number; // 0 to 1, for spaced repetition or learning curve
  note?: string;
  rawData?: Record<string, any>;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
  lastAccessed: number;
  sourceType: 'xlsx' | 'docx' | 'manual';
  headers?: string[];
  frontCols?: string[];
  backCols?: string[];
}

export interface RawData {
  headers: string[];
  rows: Record<string, any>[];
  name: string;
}

export type AppState = 'home' | 'uploading' | 'configuring' | 'learning' | 'library';
export type Theme = 'bento' | 'dark' | 'warm' | 'brutalist' | 'wild';
