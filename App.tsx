
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AimTrainer from './components/AimTrainer';
import UIOverlay from './components/UIOverlay';
import { GameStatus, GameStats, CoachFeedback, GameSettings } from './types';
import { getCoachFeedback } from './services/geminiService';
import * as storage from './services/storageService';

const GAME_DURATION = 30;

const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 0.1096,
  fov: 103,
  targetSize: 1.0,
  isIndefinite: false,
  hitSoundUrl: null,
  crosshair: {
    length: 12,
    width: 2,
    gap: 4,
    color: '#4ade80',
    dot: true
  },
  bgMusicType: 'none',
  bgMusicUrl: null,
  youtubeUrl: null,
  menuBgUrl: null,
  menuBgTranslucent: true,
  environmentPreset: 'night'
};

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    hits: 0,
    misses: 0,
    combo: 0,
    maxCombo: 0,
    startTime: 0,
    endTime: null,
    history: [0]
  });
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [countdown, setCountdown] = useState<number | string | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  
  const timerRef = useRef<any>(null);
  const statsRef = useRef(stats);
  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Load Saved State on Mount
  useEffect(() => {
    const init = async () => {
      const savedSettings = storage.loadSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }

      const fileKeys = [
        { key: 'target_skin', setter: setTargetImage },
        { key: 'hit_sound', setter: (url: string) => setSettings(s => ({ ...s, hitSoundUrl: url })) },
        { key: 'bg_music', setter: (url: string) => setSettings(s => ({ ...s, bgMusicUrl: url })) },
        { key: 'menu_bg', setter: (url: string) => setSettings(s => ({ ...s, menuBgUrl: url })) }
      ];

      for (const item of fileKeys) {
        const blob = await storage.getFile(item.key);
        if (blob) {
          const url = URL.createObjectURL(blob);
          item.setter(url);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof (window as any).onYouTubeIframeAPIReady === 'undefined') {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    hitAudioRef.current = settings.hitSoundUrl ? new Audio(settings.hitSoundUrl) : null;
  }, [settings.hitSoundUrl]);

  useEffect(() => {
    if (settings.bgMusicUrl && settings.bgMusicType === 'mp3') {
      bgAudioRef.current = new Audio(settings.bgMusicUrl);
      bgAudioRef.current.loop = true;
    } else {
      bgAudioRef.current = null;
    }
  }, [settings.bgMusicUrl, settings.bgMusicType]);

  useEffect(() => {
    if (settings.bgMusicType === 'youtube' && settings.youtubeUrl && (window as any).YT) {
      const videoId = settings.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        if (ytPlayerRef.current) {
          try { ytPlayerRef.current.destroy(); } catch(e) {}
        }
        ytPlayerRef.current = new (window as any).YT.Player('yt-player-container', {
          height: '0', width: '0', videoId: videoId,
          playerVars: { autoplay: 0, loop: 1, playlist: videoId, controls: 0, showinfo: 0, autohide: 1 },
          events: { onReady: (event: any) => { event.target.setVolume(100); event.target.unMute(); } }
        });
      }
    }
  }, [settings.bgMusicType, settings.youtubeUrl]);

  const fadeOutMusic = useCallback(() => {
    const FADE_STEP = 0.05;
    const FADE_INTERVAL = 50;
    if (bgAudioRef.current && bgAudioRef.current.volume > 0) {
      const interval = setInterval(() => {
        if (bgAudioRef.current) {
          bgAudioRef.current.volume = Math.max(0, bgAudioRef.current.volume - FADE_STEP);
          if (bgAudioRef.current.volume <= 0) { bgAudioRef.current.pause(); clearInterval(interval); }
        } else clearInterval(interval);
      }, FADE_INTERVAL);
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getVolume === 'function') {
      let vol = ytPlayerRef.current.getVolume();
      const interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
          vol = Math.max(0, vol - 5);
          ytPlayerRef.current.setVolume(vol);
          if (vol <= 0) { try { ytPlayerRef.current.pauseVideo(); } catch(e) {} clearInterval(interval); }
        } else clearInterval(interval);
      }, FADE_INTERVAL);
    }
  }, []);

  const playMusic = useCallback(() => {
    if (settings.bgMusicType === 'mp3' && bgAudioRef.current) {
      bgAudioRef.current.volume = 1.0;
      bgAudioRef.current.play().catch(() => {});
    } else if (settings.bgMusicType === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.setVolume(100);
      ytPlayerRef.current.unMute();
      ytPlayerRef.current.playVideo();
    }
  }, [settings.bgMusicType]);

  const startGame = useCallback(() => {
    setStatus(GameStatus.COUNTDOWN);
    setCountdown(null); // Wait for first click to start numeric countdown
    setStats({ score: 0, hits: 0, misses: 0, combo: 0, maxCombo: 0, startTime: Date.now(), endTime: null, history: [0] });
    setTimeLeft(GAME_DURATION);
    setTimeElapsed(0);
    setCoachFeedback(null);
  }, []);

  const startPlaying = useCallback(() => {
    setStatus(GameStatus.PLAYING);
    playMusic();
  }, [playMusic]);

  // Countdown Logic
  useEffect(() => {
    if (status === GameStatus.COUNTDOWN && countdown !== null) {
      if (countdown === 'GO!') {
        const timer = setTimeout(() => {
          setCountdown(null);
          startPlaying();
        }, 500);
        return () => clearTimeout(timer);
      } else if (typeof countdown === 'number') {
        const timer = setTimeout(() => {
          if (countdown === 1) {
            setCountdown('GO!');
          } else {
            setCountdown(countdown - 1);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, countdown, startPlaying]);

  const finishGame = useCallback(async () => {
    setStatus(GameStatus.FINISHED);
    if (timerRef.current) clearInterval(timerRef.current);
    fadeOutMusic();
    setIsLoadingCoach(true);
    const feedback = await getCoachFeedback(statsRef.current);
    setCoachFeedback(feedback);
    setIsLoadingCoach(false);
  }, [fadeOutMusic]);

  const pauseGame = useCallback(() => {
    if (status === GameStatus.PLAYING) {
      setStatus(GameStatus.PAUSED);
      if (timerRef.current) clearInterval(timerRef.current);
      fadeOutMusic();
    }
  }, [status, fadeOutMusic]);

  const resumeGame = useCallback(() => {
    if (status === GameStatus.PAUSED) {
      setStatus(GameStatus.PLAYING);
      playMusic();
    }
  }, [status, playMusic]);

  const quitGame = useCallback(() => {
    setStatus(GameStatus.IDLE);
    setCountdown(null);
    if (timerRef.current) clearInterval(timerRef.current);
    fadeOutMusic();
  }, [fadeOutMusic]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(e => e + 0.1);
        if (!settings.isIndefinite) {
          setTimeLeft(prev => {
            if (prev <= 0.1) { finishGame(); return 0; }
            return Math.max(0, prev - 0.1);
          });
        }
        const currentElapsed = timeElapsed;
        if (Math.abs((currentElapsed * 10) % 10) < 0.1) {
           setStats(s => ({...s, history: [...s.history, s.score]}));
        }
      }, 100);
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [status, finishGame, settings.isIndefinite, timeElapsed]);

  const handleHit = useCallback(() => {
    if (hitAudioRef.current) { hitAudioRef.current.currentTime = 0; hitAudioRef.current.play().catch(() => {}); }
    setStats(prev => {
      const newCombo = prev.combo + 1;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const comboBonus = Math.floor(newCombo / 10) * 50;
      return { ...prev, score: prev.score + 100 + comboBonus, hits: prev.hits + 1, combo: newCombo, maxCombo: newMaxCombo };
    });
  }, []);

  const handleMiss = useCallback(() => {
    setStats(prev => ({ ...prev, misses: prev.misses + 1, combo: 0 }));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await storage.saveFile('target_skin', file);
      const url = URL.createObjectURL(file);
      setTargetImage(url);
    }
  };

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await storage.saveFile('hit_sound', file);
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, hitSoundUrl: url }));
    }
  };

  const handleBgMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await storage.saveFile('bg_music', file);
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, bgMusicUrl: url, bgMusicType: 'mp3' }));
    }
  };

  const handleMenuBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await storage.saveFile('menu_bg', file);
      const url = URL.createObjectURL(file);
      setSettings(prev => ({ ...prev, menuBgUrl: url }));
    }
  };

  const handlePointerLockChange = (isLocked: boolean) => {
    if (status === GameStatus.COUNTDOWN && isLocked && countdown === null) {
      setCountdown(3);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black text-white">
      <div id="yt-player-container" className="hidden pointer-events-none opacity-0"></div>
      <AimTrainer 
        status={status} 
        targetImage={targetImage} 
        onHit={handleHit} 
        onMiss={handleMiss} 
        settings={settings} 
        onUnlock={pauseGame}
        onLockChange={handlePointerLockChange}
      />
      <UIOverlay 
        status={status} stats={stats} onStart={startGame} onPause={pauseGame} onResume={resumeGame} onQuit={quitGame}
        onImageUpload={handleImageUpload} onSoundUpload={handleSoundUpload} onBgMusicUpload={handleBgMusicUpload} onMenuBgUpload={handleMenuBgUpload}
        targetImage={targetImage} timeLeft={timeLeft} timeElapsed={timeElapsed} feedback={coachFeedback} isLoadingCoach={isLoadingCoach}
        settings={settings} onSettingsChange={setSettings} countdown={countdown}
      />
      <div className="absolute bottom-4 left-4 text-white/20 text-[10px] font-black tracking-widest uppercase pointer-events-none">
        50.2CM_CALIBRATED // PERSISTENT_STORAGE_ACTIVE // YT_BGM_FIXED // COUNTDOWN_ACTIVE
      </div>
    </div>
  );
}
