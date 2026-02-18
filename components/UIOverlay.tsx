
import React from 'react';
import { GameStatus, GameStats, CoachFeedback, GameSettings, MusicType, EnvironmentType } from '../types';
import { Target, Trophy, Play, RefreshCw, Upload, Crosshair, Settings2, Pause, LogOut, Activity, Infinity, Music, Youtube, Volume2, Zap, Image as ImageIcon, Map, Layers, Palette, MousePointer2 } from 'lucide-react';
import { CrosshairDisplay } from './AimTrainer';

interface UIOverlayProps {
  status: GameStatus;
  stats: GameStats;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSoundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBgMusicUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMenuBgUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  targetImage: string | null;
  timeLeft: number;
  timeElapsed: number;
  feedback: CoachFeedback | null;
  isLoadingCoach: boolean;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  countdown: number | string | null;
}

const ScoreGraph: React.FC<{ history: number[] }> = ({ history }) => {
  if (history.length < 2) return null;
  const width = 400;
  const height = 100;
  const maxScore = Math.max(...history, 100);
  const points = history.map((score, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - (score / maxScore) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="w-full mt-4">
      <div className="flex items-center gap-2 mb-2 text-zinc-500 uppercase font-black text-[9px] tracking-[0.2em]">
        <Activity className="w-3 h-3" /> Score Progression
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill="url(#grad)" />
        <polyline fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" points={points} className="drop-shadow-[0_0_3px_rgba(99,102,241,0.5)]" />
      </svg>
    </div>
  );
};

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  status, stats, onStart, onPause, onResume, onQuit, onImageUpload, onSoundUpload, onBgMusicUpload, onMenuBgUpload,
  targetImage, timeLeft, timeElapsed, feedback, isLoadingCoach, settings, onSettingsChange, countdown
}) => {
  const accuracy = stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0;
  
  const envPresets: EnvironmentType[] = [
    'night', 'sunset', 'dawn', 'forest', 'park', 'city', 'apartment', 'lobby', 'studio', 'warehouse'
  ];

  const crosshairPresets = ['#4ade80', '#22d3ee', '#f472b6', '#fbbf24', '#ffffff', '#ff4444'];

  if (status === GameStatus.IDLE) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 backdrop-blur-md overflow-y-auto py-8 px-4">
        {settings.menuBgUrl && (
          <div 
            className={`absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-700 ${settings.menuBgTranslucent ? 'opacity-40 brightness-50' : 'opacity-100'}`}
            style={{ backgroundImage: `url(${settings.menuBgUrl})` }}
          />
        )}

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-zinc-900/90 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col justify-between h-fit">
            <div>
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-indigo-600 rounded-2xl rotate-3 shadow-lg shadow-indigo-500/20">
                  <Crosshair className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Target Skin</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-600">
                      {targetImage ? <img src={targetImage} alt="Target" className="w-full h-full object-cover" /> : <Target className="w-4 h-4 text-zinc-600" />}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors border border-zinc-600 text-[9px] font-bold uppercase text-center">Upload</div>
                      <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Hit Sound (MP3)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                      <Volume2 className={`w-4 h-4 ${settings.hitSoundUrl ? 'text-indigo-400' : 'text-zinc-600'}`} />
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors border border-zinc-600 text-[9px] font-bold uppercase text-center">Set Hit MP3</div>
                      <input type="file" className="hidden" accept="audio/mpeg" onChange={onSoundUpload} />
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Menu Background</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-600">
                      {settings.menuBgUrl ? <img src={settings.menuBgUrl} alt="Menu Bg" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-zinc-600" />}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors border border-zinc-600 text-[9px] font-bold uppercase text-center">Set Menu Bg</div>
                      <input type="file" className="hidden" accept="image/*" onChange={onMenuBgUpload} />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                     <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Translucent View</span>
                     <button 
                      onClick={() => onSettingsChange({...settings, menuBgTranslucent: !settings.menuBgTranslucent})}
                      className={`w-8 h-4 rounded-full relative transition-colors ${settings.menuBgTranslucent ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.menuBgTranslucent ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onStart} className="w-full py-4 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all transform hover:scale-[1.02] shadow-xl uppercase italic">
              Begin Drill
            </button>
          </div>

          <div className="p-6 bg-zinc-900/90 border border-zinc-700 rounded-2xl shadow-2xl h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase italic">Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sensitivity</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{settings.sensitivity.toFixed(4)}</span>
                </div>
                <input type="range" min="0.01" max="1.0" step="0.0001" value={settings.sensitivity} onChange={(e) => onSettingsChange({...settings, sensitivity: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">FOV</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{settings.fov}°</span>
                </div>
                <input type="range" min="60" max="130" step="1" value={settings.fov} onChange={(e) => onSettingsChange({...settings, fov: parseInt(e.target.value)})} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Target Size</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{settings.targetSize.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.2" max="3.0" step="0.1" value={settings.targetSize} onChange={(e) => onSettingsChange({...settings, targetSize: parseFloat(e.target.value)})} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>

              <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Indefinite</span>
                  <button onClick={() => onSettingsChange({...settings, isIndefinite: !settings.isIndefinite})} className={`w-8 h-4 rounded-full relative transition-colors ${settings.isIndefinite ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.isIndefinite ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/90 border border-zinc-700 rounded-2xl shadow-2xl h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase italic">Scenery</h3>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Atmosphere</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {envPresets.map(preset => (
                      <button 
                        key={preset}
                        onClick={() => onSettingsChange({...settings, environmentPreset: preset})}
                        className={`py-1.5 text-[7px] font-black rounded border transition-all uppercase ${settings.environmentPreset === preset ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="w-3.5 h-3.5 text-zinc-500" />
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Background BGM</label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {(['none', 'mp3', 'youtube'] as MusicType[]).map((type) => (
                      <button key={type} onClick={() => onSettingsChange({...settings, bgMusicType: type})} className={`py-1.5 text-[8px] font-black rounded border transition-all uppercase ${settings.bgMusicType === type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{type}</button>
                    ))}
                  </div>
                  {settings.bgMusicType === 'youtube' && (
                    <div className="space-y-1">
                      <input type="text" placeholder="Paste YouTube Link..." value={settings.youtubeUrl || ''} onChange={(e) => onSettingsChange({...settings, youtubeUrl: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 px-3 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-300" />
                      <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Audio starts on Drill Begin</p>
                    </div>
                  )}
                  {settings.bgMusicType === 'mp3' && (
                    <label className="cursor-pointer block">
                      <div className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 text-[9px] font-bold uppercase text-center">Upload BGM MP3</div>
                      <input type="file" className="hidden" accept="audio/mpeg" onChange={onBgMusicUpload} />
                    </label>
                  )}
               </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/90 border border-zinc-700 rounded-2xl shadow-2xl h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase italic">Crosshair</h3>
            </div>
            <div className="relative w-full aspect-video bg-black rounded-xl border border-zinc-700 flex items-center justify-center overflow-hidden mb-4">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]" />
               <div className="relative scale-[1.5]">
                 <CrosshairDisplay settings={settings.crosshair} />
               </div>
            </div>

            <div className="mb-4">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Primary Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {crosshairPresets.map(color => (
                  <button 
                    key={color} 
                    onClick={() => onSettingsChange({...settings, crosshair: {...settings.crosshair, color}})}
                    className={`w-6 h-6 rounded border border-zinc-700 transition-transform ${settings.crosshair.color === color ? 'scale-110 border-white ring-2 ring-indigo-500/50' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="relative">
                  <input 
                    type="color" 
                    value={settings.crosshair.color} 
                    onChange={(e) => onSettingsChange({...settings, crosshair: {...settings.crosshair, color: e.target.value}})}
                    className="w-6 h-6 bg-transparent border-0 cursor-pointer p-0 block"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Length', key: 'length', min: 1, max: 40 },
                { label: 'Width', key: 'width', min: 1, max: 10 },
                { label: 'Gap', key: 'gap', min: 0, max: 20 },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</label>
                    <span className="text-indigo-400 font-mono text-[9px]">{(settings.crosshair as any)[s.key]}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step="1" value={(settings.crosshair as any)[s.key]} onChange={(e) => onSettingsChange({...settings, crosshair: { ...settings.crosshair, [s.key]: parseInt(e.target.value) }})} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === GameStatus.COUNTDOWN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm pointer-events-none">
        <div className="text-center">
          {countdown === null ? (
            <div className="flex flex-col items-center gap-4 animate-bounce">
              <MousePointer2 className="w-12 h-12 text-indigo-400" />
              <h2 className="text-4xl font-black text-white italic uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                Click to Start
              </h2>
              <p className="text-zinc-400 text-xs font-black uppercase tracking-widest italic">
                Awaiting Pointer Lock
              </p>
            </div>
          ) : (
            <div className="relative">
              <span className={`text-9xl font-black italic drop-shadow-[0_0_20px_rgba(99,102,241,0.8)] transition-all duration-300 transform scale-125 ${countdown === 'GO!' ? 'text-green-400' : 'text-white'}`}>
                {countdown}
              </span>
              <div className="absolute -inset-8 bg-indigo-500/10 blur-3xl -z-10 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === GameStatus.PAUSED) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
        {settings.menuBgUrl && (
          <div 
            className={`absolute inset-0 -z-10 bg-cover bg-center opacity-40 brightness-50`}
            style={{ backgroundImage: `url(${settings.menuBgUrl})` }}
          />
        )}
        <div className="max-w-xs w-full p-8 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl text-center space-y-4">
          <h2 className="text-2xl font-black text-white uppercase italic">Paused</h2>
          <button onClick={onResume} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg transition-all uppercase italic flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Resume</button>
          <button onClick={onStart} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-lg transition-all border border-zinc-700 uppercase italic flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Restart</button>
          <button onClick={onQuit} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-red-400 font-black rounded-lg transition-all border border-zinc-700 uppercase italic flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Quit</button>
        </div>
      </div>
    );
  }

  if (status === GameStatus.FINISHED) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10 backdrop-blur-md p-4 overflow-y-auto">
        <div className="max-w-xl w-full p-10 bg-zinc-900 border-t-4 border-indigo-500 rounded-2xl shadow-2xl my-8">
          <div className="flex items-center gap-3 mb-6"><Trophy className="w-8 h-8 text-yellow-500" /><h2 className="text-3xl font-black text-white italic uppercase">Session Stats</h2></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"><span className="text-zinc-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Score</span><span className="text-3xl font-black text-white italic">{stats.score}</span></div>
            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"><span className="text-zinc-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Accuracy</span><span className={`text-3xl font-black italic ${accuracy >= 80 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</span></div>
            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"><span className="text-zinc-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Max Combo</span><span className="text-3xl font-black text-indigo-400 italic">{stats.maxCombo}</span></div>
            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"><span className="text-zinc-500 text-[10px] font-black uppercase block mb-1 tracking-widest">Total Hits</span><span className="text-3xl font-black text-white italic">{stats.hits}</span></div>
          </div>
          <ScoreGraph history={stats.history} />
          <div className="mt-8 mb-8 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-3"><span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Coaching Report</span>{feedback && <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase italic">{feedback.rating}</span>}</div>
            {isLoadingCoach ? <div className="flex items-center gap-2 text-zinc-500 italic text-sm"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div> Generating insights...</div> : <p className="text-lg font-medium text-zinc-200 leading-snug italic">"{feedback?.text || "Session terminated."}"</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={onStart} className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black rounded-xl transition-all shadow-xl uppercase italic flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Redo</button>
            <button onClick={onQuit} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black rounded-xl border border-zinc-700 transition-all uppercase italic flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 pointer-events-auto">
          <div className="bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-xl">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block">Points</span>
            <span className="text-2xl font-black text-white italic">{stats.score}</span>
          </div>
          <button onClick={onPause} className="bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl transition-colors">
            <Pause className="w-6 h-6 text-white fill-white" />
          </button>
        </div>
        <div className={`transition-all duration-300 transform ${stats.combo > 0 ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} pointer-events-none`}>
          <div className="bg-indigo-600/90 backdrop-blur-md px-6 py-2 rounded-xl border border-indigo-400/30 shadow-2xl flex items-center gap-3">
             <Zap className={`w-5 h-5 text-yellow-300 ${stats.combo > 10 ? 'animate-bounce' : ''}`} />
             <div>
                <span className="text-indigo-200 text-[8px] font-black uppercase tracking-widest block">Combo</span>
                <span className="text-xl font-black text-white italic leading-tight">{stats.combo}</span>
             </div>
          </div>
        </div>
      </div>
      <div className={`bg-zinc-900/80 backdrop-blur-md px-8 py-3 rounded-2xl border-2 transition-colors duration-300 ${timeLeft <= 5 && !settings.isIndefinite ? 'border-red-500 animate-pulse' : 'border-white/5'} shadow-xl`}>
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block text-center">{settings.isIndefinite ? 'Indefinite' : 'Remaining'}</span>
        <span className={`text-2xl font-black italic block text-center ${timeLeft <= 5 && !settings.isIndefinite ? 'text-red-500' : 'text-white'}`}>{settings.isIndefinite ? <div className="flex items-center gap-2 justify-center"><Infinity className="w-5 h-5" /> {timeElapsed.toFixed(0)}s</div> : `${timeLeft.toFixed(1)}s`}</span>
      </div>
    </div>
  );
};

export default UIOverlay;
