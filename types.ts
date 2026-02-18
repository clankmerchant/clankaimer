
export enum GameStatus {
  IDLE = 'IDLE',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export interface TargetData {
  id: string;
  position: [number, number, number];
  size: number;
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  combo: number;
  maxCombo: number;
  startTime: number;
  endTime: number | null;
  history: number[]; // Store score at intervals
}

export interface CoachFeedback {
  text: string;
  rating: string;
}

export interface CrosshairSettings {
  length: number;
  width: number;
  gap: number;
  color: string;
  dot: boolean;
}

export type MusicType = 'none' | 'mp3' | 'youtube';
export type EnvironmentType = 'night' | 'sunset' | 'forest' | 'city' | 'studio' | 'warehouse' | 'apartment' | 'lobby' | 'park' | 'dawn';

export interface GameSettings {
  sensitivity: number;
  fov: number; 
  targetSize: number;
  isIndefinite: boolean;
  hitSoundUrl: string | null;
  crosshair: CrosshairSettings;
  bgMusicType: MusicType;
  bgMusicUrl: string | null;
  youtubeUrl: string | null;
  menuBgUrl: string | null;
  menuBgTranslucent: boolean;
  environmentPreset: EnvironmentType;
}
