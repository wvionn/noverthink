'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { motion, AnimatePresence, Variants, easeInOut, easeOut } from 'framer-motion';

// --- Types ---
type AnimationStage = 'typing' | 'crystallizing' | 'morphing' | 'releasing' | 'complete' | 'affirmation';
type BreathPhase = 'in' | 'hold' | 'out';
type ReleaseEntry = { id: string; text: string; createdAt: string };
type TimeOfDay = 'day' | 'dusk' | 'night';
type TimeOfDayPreview = TimeOfDay | 'auto';

// --- Framer Motion Variants ---
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' },
  typing: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', damping: 25, stiffness: 80, mass: 1 }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(10px)',
    transition: { duration: 1, ease: easeInOut }
  }
};

const releaseDurationMs = 10000;
const breathInMs = 4000;
const breathHoldMs = 2000;
const breathOutMs = Math.max(1000, releaseDurationMs - breathInMs - breathHoldMs);
const releaseDurationSec = releaseDurationMs / 1000;

const bottleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: '0vh', filter: 'blur(10px)' },
  morphing: {
    opacity: 1,
    scale: 1,
    y: '0vh',
    filter: 'blur(0px)',
    transition: { duration: 1, ease: easeOut }
  },
  releasing: {
    opacity: [1, 0.9, 0.6, 0.2, 0],
    scale: [1, 0.9, 0.75, 0.6, 0.45],
    x: [0, -6, 6, -4, 0],
    y: ['0vh', '12vh', '28vh', '42vh', '55vh'],
    filter: ['blur(0px)', 'blur(0.5px)', 'blur(1px)', 'blur(1.5px)', 'blur(2px)'],
    transition: { duration: releaseDurationSec, ease: easeInOut, times: [0, 0.25, 0.55, 0.8, 1] }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const rippleVariants: Variants = {
  releasing: {
    opacity: [0, 0.45, 0.7, 0.6, 0.65, 0],
    scale: [0.7, 1, 1.02, 0.98, 1, 0.72],
    transition: { duration: releaseDurationSec, ease: easeInOut, times: [0, 0.4, 0.5, 0.55, 0.6, 1] }
  }
};

const textVariants: Variants = {
  messy: {
    color: 'rgba(148,163,184,0.7)',
    letterSpacing: '0.02em',
    textShadow: '0 0 0px rgba(255,255,255,0)',
    filter: 'blur(0.4px)'
  },
  tidy: {
    color: 'rgba(255,255,255,0.98)',
    letterSpacing: '0.005em',
    textShadow: '0 0 8px rgba(255,255,255,0.8)',
    filter: 'blur(0px)'
  }
};

const affirmations = [
  'You did well letting it go.',
  'Your mind is lighter now. Breathe.',
  'It is out of your hands, and that is okay.',
  'You are safe in this moment.',
  'You are allowed to rest now.'
];

const getRandomAffirmation = () => {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
};

const breathCopy: Record<BreathPhase, string> = {
  in: 'Breathe in...',
  hold: 'Hold...',
  out: 'Breathe out, let it sink...'
};

const breathFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap'
});

const uiFont = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap'
});

const timeOfDayBackgrounds: Record<TimeOfDay, string> = {
  day: 'bg-gradient-to-b from-[#7d98b1] via-[#5f7a97] to-[#314d66] text-white/90',
  dusk: 'bg-gradient-to-b from-[#1b1433] via-[#5a2436] to-[#f08a4b] text-white',
  night: 'bg-gradient-to-b from-[#0b1631] via-[#0a1329] to-[#050812] text-white/90'
};

const getDayOfYear = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const radToDeg = (rad: number) => (rad * 180) / Math.PI;

const normalizeDegrees = (deg: number) => {
  return (deg % 360 + 360) % 360;
};

const calcSunTime = (date: Date, lat: number, lon: number, isSunrise: boolean) => {
  const day = getDayOfYear(date);
  const lngHour = lon / 15;
  const t = day + ((isSunrise ? 6 : 18) - lngHour) / 24;
  const M = (0.9856 * t) - 3.289;
  const L = normalizeDegrees(
    M + (1.916 * Math.sin(degToRad(M))) + (0.020 * Math.sin(degToRad(2 * M))) + 282.634
  );

  let RA = radToDeg(Math.atan(0.91764 * Math.tan(degToRad(L))));
  RA = normalizeDegrees(RA);
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(degToRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(degToRad(90.833)) - (sinDec * Math.sin(degToRad(lat))))
    / (cosDec * Math.cos(degToRad(lat)));

  if (cosH > 1 || cosH < -1) return null;

  let H = isSunrise ? 360 - radToDeg(Math.acos(cosH)) : radToDeg(Math.acos(cosH));
  H = H / 15;
  let UT = H + RA - (0.06571 * t) - 6.622;
  UT = (UT - lngHour + 24) % 24;

  const hours = Math.floor(UT);
  const minutes = Math.floor((UT - hours) * 60);
  const seconds = Math.round((((UT - hours) * 60) - minutes) * 60);

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, seconds));
};

const getSunTimes = (date: Date, lat: number, lon: number) => {
  const sunrise = calcSunTime(date, lat, lon, true);
  const sunset = calcSunTime(date, lat, lon, false);
  if (!sunrise || !sunset) return null;
  return { sunrise, sunset };
};

// --- Raw SVG Icons (Zero Dependencies) ---

const RealisticBottleSvg = ({ className = "w-12 h-12" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bottleGlassGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e5f4ff" stopOpacity="0.5" />
        <stop offset="55%" stopColor="#a6d6ff" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#4a79b5" stopOpacity="0.22" />
      </linearGradient>
      <linearGradient id="paperGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f5d7a3" stopOpacity="0.98" />
        <stop offset="100%" stopColor="#c79057" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="bottleHighlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    <rect x="82" y="18" width="36" height="22" rx="6" fill="#b58c5a" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <rect x="78" y="36" width="44" height="12" rx="6" fill="rgba(210,232,255,0.35)" />

    <path
      d="M70 60 H130 L142 82 V156 A24 24 0 0 1 118 180 H82 A24 24 0 0 1 58 156 V82 Z"
      fill="url(#bottleGlassGradient)"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="2"
    />
    <rect
      x="78"
      y="108"
      width="44"
      height="50"
      rx="7"
      fill="url(#paperGradient)"
      transform="rotate(-4 100 133)"
    />
    <path
      d="M84 124 H118"
      stroke="rgba(120,78,42,0.35)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M86 136 H116"
      stroke="rgba(120,78,42,0.22)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M88 146 H114"
      stroke="rgba(120,78,42,0.18)"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M86 70 C78 96 78 128 86 154"
      stroke="url(#bottleHighlight)"
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M118 76 C126 98 126 122 118 150"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// --- Main Page Component ---
export default function MessageInABottle() {
  const [text, setText] = useState<string>('');
  const [stage, setStage] = useState<AnimationStage>('typing');
  const [releasedCount, setReleasedCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [affirmation, setAffirmation] = useState<string>('');
  const [breathPhase, setBreathPhase] = useState<BreathPhase | null>(null);
  const [showSoundHint, setShowSoundHint] = useState<boolean>(false);
  const [saveHistory, setSaveHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<ReleaseEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [timeOfDayPreview, setTimeOfDayPreview] = useState<TimeOfDayPreview>('auto');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef<string>('');
  const saveHistoryRef = useRef<boolean>(false);
  const effectiveTimeOfDay = timeOfDayPreview === 'auto' ? timeOfDay : timeOfDayPreview;

  // Hydration & initial setup
  useEffect(() => {
    setIsMounted(true);
    const savedCount = localStorage.getItem('thoughtsReleased');
    if (savedCount) setReleasedCount(parseInt(savedCount, 10));

    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound === 'true') setIsPlaying(true);

    const savedHistoryPref = localStorage.getItem('saveHistory');
    if (savedHistoryPref === 'true') {
      setSaveHistory(true);
      saveHistoryRef.current = true;
      const savedHistory = localStorage.getItem('releaseHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory) as ReleaseEntry[];
          setHistory(parsed);
        } catch {
          setHistory([]);
        }
      }
    }

    const hintShown = localStorage.getItem('soundHintShown');
    if (!hintShown) {
      setShowSoundHint(true);
      localStorage.setItem('soundHintShown', 'true');
    }

    // Setup ambient ocean sound
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/water/ocean_waves_crashing.ogg');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    if (savedSound === 'true') {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }

    let hintTimeout: NodeJS.Timeout | undefined;
    if (!hintShown) {
      hintTimeout = setTimeout(() => setShowSoundHint(false), 3500);
    }

    return () => {
      clearTimeout(hintTimeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const rawLat = process.env.NEXT_PUBLIC_LAT;
    const rawLon = process.env.NEXT_PUBLIC_LON;
    const lat = rawLat ? parseFloat(rawLat) : NaN;
    const lon = rawLon ? parseFloat(rawLon) : NaN;
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

    const computeTimeOfDay = () => {
      const now = new Date();
      if (!hasCoords) {
        const hour = now.getHours();
        if (hour >= 6 && hour < 17) return setTimeOfDay('day');
        if (hour >= 5 && hour < 6) return setTimeOfDay('dusk');
        if (hour >= 17 && hour < 19) return setTimeOfDay('dusk');
        return setTimeOfDay('night');
      }

      const sun = getSunTimes(now, lat, lon);
      if (!sun) {
        return setTimeOfDay('night');
      }

      const nowMs = now.getTime();
      const sunriseMs = sun.sunrise.getTime();
      const sunsetMs = sun.sunset.getTime();
      const dawnStart = sunriseMs - 60 * 60 * 1000;
      const duskEnd = sunsetMs + 60 * 60 * 1000;

      if (nowMs >= sunriseMs && nowMs <= sunsetMs) return setTimeOfDay('day');
      if (nowMs >= dawnStart && nowMs < sunriseMs) return setTimeOfDay('dusk');
      if (nowMs > sunsetMs && nowMs <= duskEnd) return setTimeOfDay('dusk');
      return setTimeOfDay('night');
    };

    computeTimeOfDay();
    const interval = setInterval(computeTimeOfDay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    saveHistoryRef.current = saveHistory;
    localStorage.setItem('saveHistory', saveHistory ? 'true' : 'false');
  }, [saveHistory]);

  useEffect(() => {
    if (!saveHistory) setIsHistoryOpen(false);
  }, [saveHistory]);

  useEffect(() => {
    if (stage !== 'releasing') {
      setBreathPhase(null);
      return;
    }

    setBreathPhase('in');
    const holdTimeout = setTimeout(() => setBreathPhase('hold'), breathInMs);
    const outTimeout = setTimeout(() => setBreathPhase('out'), breathInMs + breathHoldMs);

    return () => {
      clearTimeout(holdTimeout);
      clearTimeout(outTimeout);
    };
  }, [stage]);

  // Animation Sequence Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (stage === 'crystallizing') {
      timeout = setTimeout(() => setStage('morphing'), 500);
    } else if (stage === 'morphing') {
      // Wait for card to morph into bottle
      timeout = setTimeout(() => setStage('releasing'), 1000);
    } else if (stage === 'releasing') {
      // Wait for bottle to drop and fade into the ocean
      timeout = setTimeout(() => setStage('complete'), releaseDurationMs);
    } else if (stage === 'complete') {
      const releasedText = textRef.current.trim();
      if (saveHistoryRef.current && releasedText) {
        const entry: ReleaseEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: releasedText,
          createdAt: new Date().toISOString()
        };
        setHistory(prev => {
          const next = [entry, ...prev].slice(0, 20);
          localStorage.setItem('releaseHistory', JSON.stringify(next));
          return next;
        });
      }

      setReleasedCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem('thoughtsReleased', newCount.toString());
        return newCount;
      });

      setText('');
      setAffirmation(getRandomAffirmation());
      setStage('affirmation');
    } else if (stage === 'affirmation') {
      timeout = setTimeout(() => { setStage('typing'); }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [stage]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    const next = !isPlaying;
    if (next) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
    setIsPlaying(next);
    localStorage.setItem('soundEnabled', next ? 'true' : 'false');
    setShowSoundHint(false);
  };

  const toggleSaveHistory = () => {
    setSaveHistory(prev => !prev);
  };

  const formatReleaseDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('releaseHistory');
    setIsHistoryOpen(false);
  };

  const handleRelease = () => {
    if (text.trim().length > 0 && stage === 'typing') {
      setStage('crystallizing');
    }
  };

  if (!isMounted) return null; // Prevent SSR hydration mismatch

  return (
    <div className={`${uiFont.className} relative w-screen h-screen overflow-hidden ${timeOfDayBackgrounds[effectiveTimeOfDay]} selection:bg-white/20`}>

      {/* Global CSS for Wave Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pan-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pan-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .wave-layer { width: 200%; height: 100%; position: absolute; bottom: 0; left: 0; }
        .wave-slow { animation: pan-left 35s linear infinite; }
        .wave-mid { animation: pan-right 25s linear infinite; }
        .wave-fast { animation: pan-left 15s linear infinite; }
      `}} />

      {/* Header Controls */}
      <header className="absolute top-0 left-0 w-full p-6 sm:p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/6 border border-white/15 backdrop-blur-md shadow-lg">
          <RealisticBottleSvg className="w-6 h-6" />
          <span className="text-sm font-medium tracking-wide">
            <strong className="text-white">{releasedCount}</strong> thoughts let go
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-1 py-1 text-[10px] sm:text-xs tracking-wide text-white/75">
            {(['auto', 'day', 'dusk', 'night'] as TimeOfDayPreview[]).map(option => (
              <button
                key={option}
                onClick={() => setTimeOfDayPreview(option)}
                className={`px-2 py-1 rounded-full transition-colors ${timeOfDayPreview === option
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
                }`}
                aria-pressed={timeOfDayPreview === option}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsHistoryOpen(prev => !prev)}
            className="px-4 py-2 rounded-full border border-white/15 bg-white/6 text-xs sm:text-sm tracking-wide text-white/75 hover:text-white transition-colors"
            aria-expanded={isHistoryOpen}
          >
            Release history
          </button>

          <div className="relative">
            <button
              onClick={toggleAudio}
              className="p-3 rounded-full bg-white/6 border border-white/15 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg"
              aria-label="Toggle ambient sound"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            {showSoundHint && (
              <div className="absolute right-0 top-12 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] sm:text-xs text-white/80 shadow-lg">
                Sound on?
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Interactive Area */}
      <main className="absolute inset-0 flex items-center justify-center p-6 z-40">
        <AnimatePresence>
          {(stage === 'typing' || stage === 'crystallizing') && (
            <motion.div
              key="typing-card"
              variants={cardVariants}
              initial="hidden"
              animate="typing"
              exit="exit"
              className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-6 relative"
            >
              <motion.textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What is heavily weighing on your mind right now? Pour it out here..."
                className="w-full min-h-[160px] max-h-[30vh] bg-transparent text-lg sm:text-xl leading-relaxed tracking-wide placeholder:text-white/30 resize-none outline-none overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                variants={textVariants}
                initial="messy"
                animate={stage === 'crystallizing' ? 'tidy' : 'messy'}
                transition={{ duration: 0.5, ease: easeInOut }}
              />

              <AnimatePresence>
                {stage === 'crystallizing' && (
                  <motion.div
                    key="crystal-shimmer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: [0, 0.8, 0], x: [-20, 0, 20] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: easeInOut }}
                    className="pointer-events-none absolute left-8 right-8 top-6 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {(stage === 'typing' || stage === 'crystallizing') && (
          <div className="absolute inset-x-0 bottom-[18vh] flex justify-center">
            <button
              onClick={handleRelease}
              disabled={text.trim().length === 0 || stage !== 'typing'}
              className={`group flex items-center gap-3 rounded-full border px-5 py-3 transition-all duration-300 backdrop-blur-md
                ${text.trim().length > 0
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)] cursor-pointer hover:scale-[1.02]'
                  : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                }`}
              aria-label="Release to the Ocean"
            >
              <span className="text-xs sm:text-sm uppercase tracking-[0.28em] text-white/80 group-hover:text-white">
                Release
              </span>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <SendIcon />
              </div>
            </button>
          </div>
        )}

        {/* Ocean Breath Overlay */}
        <AnimatePresence>
          {stage === 'releasing' && (
            <motion.div
              key="ocean-breath"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: easeInOut }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="absolute w-60 h-60 rounded-full border border-sky-200/30 shadow-[0_0_25px_rgba(56,189,248,0.25)]"
                variants={rippleVariants}
                initial={false}
                animate="releasing"
              />
              <AnimatePresence mode="wait">
                {breathPhase && (
                  <motion.p
                    key={breathPhase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4, ease: easeInOut }}
                    className={`${breathFont.className} absolute -translate-y-40 sm:-translate-y-48 text-base sm:text-lg font-medium tracking-[0.16em] text-sky-100/85`}
                  >
                    {breathCopy[breathPhase]}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Release Vignette Focus */}
        <AnimatePresence>
          {stage === 'releasing' && (
            <motion.div
              key="release-vignette"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: easeInOut }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(6,12,24,0.05) 0%, rgba(4,8,16,0.55) 68%, rgba(2,4,8,0.75) 100%)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Affirmation Splash */}
        <AnimatePresence>
          {stage === 'affirmation' && (
            <motion.div
              key="affirmation-splash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: [8, 0, -6] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: easeInOut, times: [0, 0.35, 1] }}
              className="absolute inset-0 flex items-center justify-center text-center px-6 pointer-events-none"
            >
              <p className={`${breathFont.className} text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white/90`}>
                {affirmation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Morphing & Releasing Bottle */}
        <AnimatePresence>
          {(stage === 'morphing' || stage === 'releasing') && (
            <motion.div
              key="releasing-bottle"
              variants={bottleVariants}
              initial="hidden"
              animate={stage}
              exit="exit"
              className="absolute inset-0 m-auto w-28 h-28 flex items-center justify-center"
            >
              <RealisticBottleSvg className="relative w-16 h-16 drop-shadow-[0_0_10px_rgba(96,165,250,0.28)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            key="history-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeInOut }}
            className="absolute right-6 top-24 w-[82vw] max-w-xs max-h-[35vh] overflow-hidden rounded-2xl border border-white/15 bg-[#0b1326]/80 backdrop-blur-xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs uppercase tracking-[0.22em] text-white/70">Release History</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSaveHistory}
                  className={`text-xs transition-colors ${saveHistory ? 'text-white' : 'text-white/60 hover:text-white'}`}
                  aria-pressed={saveHistory}
                >
                  {saveHistory ? 'Saving on' : 'Saving off'}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[28vh] overflow-y-auto px-4 py-3 space-y-3">
              {history.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-sm text-white/70 leading-relaxed">
                    No releases yet. Turn on saving, then release a message to see it here.
                  </p>
                </div>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-sm text-white/85 leading-relaxed">
                      {entry.text}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {formatReleaseDate(entry.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Ocean Waves (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] pointer-events-none z-10 overflow-hidden text-blue-300/15">

        {/* Back Wave (Slow) */}
        <div className="wave-layer wave-slow text-[#0a192f]/45 mix-blend-screen">
          <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,60 C300,120 300,0 600,60 C900,120 900,0 1200,60 C1500,120 1500,0 1800,60 C2100,120 2100,0 2400,60 L2400,120 L0,120 Z" />
          </svg>
        </div>

        {/* Middle Wave (Medium, Reverse) */}
        <div className="wave-layer wave-mid text-indigo-900/25 mix-blend-screen">
          <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,80 C300,20 300,140 600,80 C900,20 900,140 1200,80 C1500,20 1500,140 1800,80 C2100,20 2100,140 2400,80 L2400,120 L0,120 Z" />
          </svg>
        </div>

        {/* Front Wave (Fast) */}
        <div className="wave-layer wave-fast text-blue-800/20 mix-blend-screen">
          <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,100 C300,40 300,160 600,100 C900,40 900,160 1200,100 C1500,40 1500,160 1800,100 C2100,40 2100,160 2400,100 L2400,120 L0,120 Z" />
          </svg>
        </div>

        {/* Ambient Fog/Gradient at the absolute bottom to blend the SVG edges */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#020c1b] to-transparent z-20" />
      </div>

    </div>
  );
}