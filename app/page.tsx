'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { motion, AnimatePresence, Variants, easeInOut, easeOut, useReducedMotion } from 'framer-motion';

// --- Types ---
type AnimationStage = 'typing' | 'crystallizing' | 'morphing' | 'releasing' | 'complete' | 'affirmation';
type BreathPhase = 'in' | 'hold' | 'out';
type ReleaseEntry = { id: string; text: string; createdAt: string; mode: 'release' | 'gratitude' };
type TimeOfDay = 'day' | 'dusk' | 'night';
type TimeOfDayPreview = TimeOfDay | 'auto';
type Mode = 'release' | 'gratitude';
type Star = { id: string; x: number; y: number; text: string; delay: number };
type MoonPhase = 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
type Meteor = { id: string; x: number; y: number; angle: number; delay: number; duration: number };

// --- Framer Motion Variants ---
const cardVariants: Variants = {
  hidden: (custom) => ({
    opacity: 0,
    scale: custom ? 1 : 0.95,
    y: custom ? 0 : 30,
    filter: custom ? 'none' : 'blur(10px)'
  }),
  typing: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'none',
    transition: { type: 'spring', damping: 25, stiffness: 80, mass: 1 }
  },
  exit: (custom) => ({
    opacity: 0,
    scale: custom ? 1 : 0.8,
    filter: custom ? 'none' : 'blur(10px)',
    transition: { duration: custom ? 0.25 : 1, ease: easeInOut }
  })
};

const releaseDurationMs = 10000;
const breathInMs = 4000;
const breathHoldMs = 2000;
const breathOutMs = Math.max(1000, releaseDurationMs - breathInMs - breathHoldMs);
const releaseDurationSec = releaseDurationMs / 1000;

const bottleVariants: Variants = {
  hidden: (custom) => ({
    opacity: 0,
    scale: custom ? 1 : 0.5,
    y: '0vh',
    filter: custom ? 'none' : 'blur(10px)'
  }),
  morphing: {
    opacity: 1,
    scale: 1,
    y: '0vh',
    filter: 'none',
    transition: { duration: 1, ease: easeOut }
  },
  releasing: (custom) => ({
    opacity: [1, 0.9, 0.6, 0.2, 0],
    scale: custom ? [1, 0.9, 0.8, 0.7, 0.6] : [1, 0.9, 0.75, 0.6, 0.45],
    x: custom ? 0 : [0, -6, 6, -4, 0],
    y: custom ? ['0vh', '12vh', '28vh', '42vh', '55vh'] : ['0vh', '12vh', '28vh', '42vh', '55vh'],
    filter: 'none',
    transition: { duration: releaseDurationSec, ease: easeInOut, times: [0, 0.25, 0.55, 0.8, 1] }
  }),
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const textVariants: Variants = {
  messy: {
    color: 'rgba(248, 250, 252, 0.9)',
    textShadow: '0 0 0px rgba(255,255,255,0)',
    filter: 'blur(0.4px)'
  },
  tidy: {
    color: 'rgba(255,255,255,0.98)',
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

// Reflection prompts to guide deeper emotional processing
const reflectionPrompts = [
  'What would you tell a friend feeling this way?',
  'If this feeling had a voice, what would it be trying to tell you?',
  'What does this remind you of from your past?',
  'What are you afraid might happen if you let this go?',
  'What would it feel like to be free of this?',
  'What do you need to hear right now?'
];

// Emotion wheel categories to help identify feelings
const emotionWheel = {
  'Angry': ['Frustrated', 'Irritated', 'Resentful', 'Bitter', 'Furious'],
  'Sad': ['Lonely', 'Disappointed', 'Hurt', 'Hopeless', 'Grieving'],
  'Anxious': ['Worried', 'Overwhelmed', 'Nervous', 'Scared', 'Panicked'],
  'Ashamed': ['Guilty', 'Embarrassed', 'Inadequate', 'Regretful', 'Worthless'],
  'Happy': ['Grateful', 'Peaceful', 'Hopeful', 'Content', 'Joyful'],
  'Confused': ['Uncertain', 'Lost', 'Conflicted', 'Indecisive', 'Doubtful']
};

// --- Seasonal & Celestial Calculations ---

const getMoonPhase = (date: Date): MoonPhase => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    const y = year - 1;
    const m = month + 12;
    c = Math.floor(y / 100);
    e = Math.floor(c / 4);
    jd = 365.25 * (y + 4716);
    b = Math.floor(30.6001 * (m + 1));
  } else {
    c = Math.floor(year / 100);
    e = Math.floor(c / 4);
    jd = 365.25 * (year + 4716);
    b = Math.floor(30.6001 * (month + 1));
  }

  const jdn = jd + b + day + 2 - c + e - 1524.5;
  const daysSinceNew = (jdn - 2451549.5) / 29.53;
  const phase = (daysSinceNew - Math.floor(daysSinceNew)) * 29.53;

  if (phase < 1.84566) return 'new';
  if (phase < 5.53699) return 'waxing-crescent';
  if (phase < 9.22831) return 'first-quarter';
  if (phase < 12.91963) return 'waxing-gibbous';
  if (phase < 16.61096) return 'full';
  if (phase < 20.30228) return 'waning-gibbous';
  if (phase < 23.99361) return 'last-quarter';
  if (phase < 27.68493) return 'waning-crescent';
  return 'new';
};

const isFullMoon = (phase: MoonPhase): boolean => phase === 'full';

const shouldShowMeteorShower = (date: Date): boolean => {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Perseids (Aug 10-14)
  if (month === 7 && day >= 10 && day <= 14) return true;
  // Geminids (Dec 13-14)
  if (month === 11 && day >= 13 && day <= 14) return true;
  // Quadrantids (Jan 3-4)
  if (month === 0 && day >= 3 && day <= 4) return true;
  
  return false;
};



const breathCopy: Record<BreathPhase, string> = {
  in: 'Breathe in…',
  hold: 'Hold…',
  out: 'Breathe out, let it go…'
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-2" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const MeteorSvg = ({ className = "w-32 h-32" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="meteorGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#7dd3fc" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="meteorCore" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <radialGradient id="meteorGlow">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    {/* Outer glow */}
    <ellipse cx="40" cy="40" rx="25" ry="25" fill="url(#meteorGlow)" />
    
    {/* Tail (multiple layers for depth) */}
    <path
      d="M 40 40 Q 80 50, 140 70 Q 160 75, 190 85"
      stroke="url(#meteorGradient)"
      strokeWidth="18"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M 40 40 Q 75 45, 130 65 Q 150 70, 180 78"
      stroke="url(#meteorGradient)"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    <path
      d="M 40 40 Q 70 42, 120 58 Q 140 63, 170 70"
      stroke="url(#meteorGradient)"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Core/Head */}
    <circle cx="40" cy="40" r="8" fill="url(#meteorCore)" />
    <circle cx="40" cy="40" r="5" fill="#ffffff" opacity="0.9" />
    
    {/* Sparkles */}
    <circle cx="80" cy="52" r="2" fill="#ffffff" opacity="0.8" />
    <circle cx="110" cy="62" r="1.5" fill="#bae6fd" opacity="0.7" />
    <circle cx="145" cy="73" r="1" fill="#7dd3fc" opacity="0.6" />
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
  const [showReflectionPrompt, setShowReflectionPrompt] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [showEmotionWheel, setShowEmotionWheel] = useState<boolean>(false);
  const [showPreReleasePrompt, setShowPreReleasePrompt] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>('release');
  const [stars, setStars] = useState<Star[]>([]);
  const [gratitudeCount, setGratitudeCount] = useState<number>(0);
  const [moonPhase, setMoonPhase] = useState<MoonPhase>('new');
  const [showMeteorShower, setShowMeteorShower] = useState<boolean>(false);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [showEventsPanel, setShowEventsPanel] = useState<boolean>(false);
  const [manualOverrides, setManualOverrides] = useState({
    fullMoon: false,
    meteorShower: false
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef<string>('');
  const saveHistoryRef = useRef<boolean>(false);
  const effectiveTimeOfDay = timeOfDayPreview === 'auto' ? timeOfDay : timeOfDayPreview;
  const shouldReduceMotion = useReducedMotion();

  // Warning safeguard for unsaved journal draft entries
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (text.trim().length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [text]);

  // Hydration & initial setup
  useEffect(() => {
    setIsMounted(true);
    const savedCount = localStorage.getItem('thoughtsReleased');
    if (savedCount) setReleasedCount(parseInt(savedCount, 10));

    const savedGratitudeCount = localStorage.getItem('gratitudeCount');
    if (savedGratitudeCount) setGratitudeCount(parseInt(savedGratitudeCount, 10));

    const savedStars = localStorage.getItem('gratitudeStars');
    if (savedStars) {
      try {
        const parsed = JSON.parse(savedStars) as Star[];
        setStars(parsed);
      } catch {
        setStars([]);
      }
    }

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

    // Setup ambient audio
    const audio = new Audio('/leberch-meditation-ambient-375361.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;
    
    console.log('Audio initialized:', audio.src);

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

  // Seasonal & Celestial Effects
  useEffect(() => {
    const updateSeasonalEffects = () => {
      const now = new Date();
      const phase = getMoonPhase(now);
      setMoonPhase(phase);
      
      if (manualOverrides.meteorShower) {
        setShowMeteorShower(true);
      } else {
        setShowMeteorShower(shouldShowMeteorShower(now));
      }
      
    };

    updateSeasonalEffects();
    const interval = setInterval(updateSeasonalEffects, 60 * 60 * 1000); // Check hourly
    return () => clearInterval(interval);
  }, [timeOfDay, manualOverrides]);

  // Generate meteors for meteor shower
  useEffect(() => {
    if (!showMeteorShower) {
      setMeteors([]);
      return;
    }

    const generateMeteor = (): Meteor => ({
      id: `meteor-${Date.now()}-${Math.random()}`,
      x: Math.random() * 100,
      y: Math.random() * 40,
      angle: 30 + Math.random() * 30, // 30-60 degrees
      delay: Math.random() * 10,
      duration: 0.8 + Math.random() * 0.7
    });

    const initialMeteors = Array.from({ length: 8 }, generateMeteor);
    setMeteors(initialMeteors);

    const interval = setInterval(() => {
      setMeteors(prev => {
        const newMeteor = generateMeteor();
        return [...prev.slice(-7), newMeteor];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [showMeteorShower]);

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
      const currentMode = mode;

      if (saveHistoryRef.current && releasedText) {
        const entry: ReleaseEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: releasedText,
          createdAt: new Date().toISOString(),
          mode: currentMode
        };
        setHistory(prev => {
          const next = [entry, ...prev].slice(0, 20);
          localStorage.setItem('releaseHistory', JSON.stringify(next));
          return next;
        });
      }

      if (currentMode === 'release') {
        setReleasedCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('thoughtsReleased', newCount.toString());
          return newCount;
        });
      } else {
        // Gratitude mode - create a star
        const newStar: Star = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          x: Math.random() * 80 + 10, // 10-90% of screen width
          y: Math.random() * 40 + 5,  // 5-45% of screen height
          text: releasedText,
          delay: 0
        };
        
        setStars(prev => {
          const next = [...prev, newStar].slice(-30); // Keep max 30 stars
          localStorage.setItem('gratitudeStars', JSON.stringify(next));
          return next;
        });

        setGratitudeCount(prev => {
          const newCount = prev + 1;
          localStorage.setItem('gratitudeCount', newCount.toString());
          return newCount;
        });
      }

      setText('');
      setAffirmation(currentMode === 'release' ? getRandomAffirmation() : 'Your gratitude shines bright.');
      setStage('affirmation');
    } else if (stage === 'affirmation') {
      timeout = setTimeout(() => { setStage('typing'); }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [stage]);

  const toggleAudio = () => {
    if (!audioRef.current) {
      console.error('Audio ref is null');
      return;
    }
    
    const next = !isPlaying;
    if (next) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('soundEnabled', 'true');
          console.log('Audio playing');
        })
        .catch(e => {
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('soundEnabled', 'false');
      console.log('Audio paused');
    }
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
      setShowPreReleasePrompt(true);
      
      // Auto-play audio immediately when user clicks the initial Release button
      if (audioRef.current && !isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            localStorage.setItem('soundEnabled', 'true');
            console.log('Audio started playing on handleRelease');
          })
          .catch(e => {
            console.error("Audio play failed:", e);
          });
      }
    }
  };

  const confirmRelease = () => {
    setShowPreReleasePrompt(false);
    setStage('crystallizing');
    
    // Redundant check in case audio play failed initially or was paused
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('soundEnabled', 'true');
          console.log('Audio started playing on confirmRelease');
        })
        .catch(e => {
          console.error("Audio play failed:", e);
        });
    }
  };

  const getRandomPrompt = () => {
    const prompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
    setCurrentPrompt(prompt);
    setShowReflectionPrompt(true);
  };

  const toggleEmotionWheel = () => {
    setShowEmotionWheel(prev => !prev);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'release' ? 'gratitude' : 'release');
  };

  const toggleEvent = (event: 'fullMoon' | 'meteorShower') => {
    setManualOverrides(prev => ({
      ...prev,
      [event]: !prev[event]
    }));
  };

  const resetOverrides = () => {
    setManualOverrides({
      fullMoon: false,
      meteorShower: false
    });
  };

  return (
    <div className={`${uiFont.className} relative w-full h-dvh overflow-hidden ${timeOfDayBackgrounds[effectiveTimeOfDay]} selection:bg-white/20 ${shouldReduceMotion ? 'motion-reduce' : ''}`}>

      {/* Global CSS for Wave Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pan-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pan-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .wave-layer { width: 200%; height: 100%; position: absolute; bottom: 0; left: 0; }
        .wave-slow { animation: pan-left 35s linear infinite; }
        .wave-mid { animation: pan-right 25s linear infinite; }
        .wave-fast { animation: pan-left 15s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .wave-slow, .wave-mid, .wave-fast {
            animation: none !important;
          }
        }
        .motion-reduce .wave-slow,
        .motion-reduce .wave-mid,
        .motion-reduce .wave-fast {
          animation: none !important;
        }
      `}} />

      {/* Header Controls */}
      <header className="absolute top-0 left-0 w-full p-3 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 z-50">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/6 border border-white/15 backdrop-blur-md shadow-lg"
            aria-label={`${releasedCount} thoughts released`}
          >
            <RealisticBottleSvg className="w-5 sm:w-6 h-5 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              <strong className="text-white tabular-nums">{releasedCount}</strong> released
            </span>
          </div>
          <div
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/6 border border-white/15 backdrop-blur-md shadow-lg"
            aria-label={`${gratitudeCount} gratitude stars shared`}
          >
            <StarIcon className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-300/80" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              <strong className="text-white tabular-nums">{gratitudeCount}</strong> grateful
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <button
            onClick={toggleMode}
            className={`px-3 sm:px-4 py-2 rounded-full border border-white/15 backdrop-blur-md text-[10px] sm:text-xs md:text-sm tracking-wide transition-[background-color,border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              mode === 'release'
                ? 'bg-blue-500/20 text-blue-100 border-blue-300/30 focus-visible:ring-blue-400'
                : 'bg-yellow-500/20 text-yellow-100 border-yellow-300/30 focus-visible:ring-yellow-400'
            }`}
          >
            {mode === 'release' ? '🌊 Release' : '⭐ Grateful'}
          </button>

          <div
            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-1 py-1 text-[8px] sm:text-[10px] md:text-xs tracking-wide text-white/75"
            role="region"
            aria-label="Select theme background"
          >
            {(['auto', 'day', 'dusk', 'night'] as TimeOfDayPreview[]).map(option => (
              <button
                key={option}
                onClick={() => setTimeOfDayPreview(option)}
                className={`px-1.5 sm:px-2 py-1 rounded-full transition-colors text-[8px] sm:text-[10px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${timeOfDayPreview === option
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
                }`}
                aria-pressed={timeOfDayPreview === option}
                aria-label={`${option === 'auto' ? 'Automatic time theme' : option.charAt(0).toUpperCase() + option.slice(1) + ' theme'}`}
              >
                {option === 'auto' ? 'A' : option.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsHistoryOpen(prev => !prev)}
            className="px-3 sm:px-4 py-2 rounded-full border border-white/15 bg-white/6 text-[10px] sm:text-xs md:text-sm tracking-wide text-white/75 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-expanded={isHistoryOpen}
          >
            History
          </button>

          <button
            onClick={() => setShowEventsPanel(prev => !prev)}
            className="px-3 sm:px-4 py-2 rounded-full border border-white/15 bg-white/6 text-[10px] sm:text-xs md:text-sm tracking-wide text-white/75 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-expanded={showEventsPanel}
          >
            Events
          </button>

          <div className="relative">
            <button
              onClick={toggleAudio}
              className="p-2 sm:p-3 rounded-full bg-white/6 border border-white/15 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Toggle ambient sound"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            {showSoundHint && (
              <div className="absolute right-0 top-10 sm:top-12 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-2 sm:px-3 py-1 text-[8px] sm:text-xs text-white/80 shadow-lg">
                Sound on?
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Interactive Area */}
      <main id="main-content" className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 z-40 pt-24 sm:pt-20 md:pt-16">
        <h1 className="sr-only">Noverthink — Message in a Bottle</h1>
        <AnimatePresence>
          {(stage === 'typing' || stage === 'crystallizing') && (
            <motion.div
              key="typing-card"
              variants={cardVariants}
              custom={shouldReduceMotion}
              initial="hidden"
              animate="typing"
              exit="exit"
              className="w-full max-w-lg p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-4 sm:gap-6 relative"
            >
              <motion.textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                name="journal-entry"
                autoComplete="off"
                aria-label={mode === 'release' ? "Thoughts to release" : "Gratitude journal entry"}
                placeholder={
                  mode === 'release'
                    ? "What is weighing on your mind? Pour it out…"
                    : "What are you grateful for? Let it shine…"
                }
                className="w-full min-h-[120px] sm:min-h-[160px] max-h-[40vh] sm:max-h-[30vh] bg-transparent text-base sm:text-lg md:text-xl font-medium md:font-semibold leading-relaxed tracking-wide placeholder:text-white/30 resize-none outline-none focus-visible:ring-2 focus-visible:ring-white/15 rounded-xl px-2 py-1 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                variants={textVariants}
                initial="messy"
                animate={stage === 'crystallizing' ? 'tidy' : 'messy'}
                transition={{ duration: 0.5, ease: easeInOut }}
              />

              {/* Reflection Tools */}
              {stage === 'typing' && mode === 'release' && (
                <div className="flex flex-wrap gap-2 pt-2 sm:pt-3 border-t border-white/10">
                  <button
                    onClick={getRandomPrompt}
                    className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                  >
                    Need a prompt?
                  </button>
                  <button
                    onClick={toggleEmotionWheel}
                    className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                  >
                    How am I feeling?
                  </button>
                </div>
              )}

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
          <div className="absolute inset-x-0 bottom-[20vh] sm:bottom-[18vh] flex justify-center px-4">
            <button
              onClick={handleRelease}
              disabled={text.trim().length === 0 || stage !== 'typing'}
              className={`group flex items-center gap-2 sm:gap-3 rounded-full border px-4 sm:px-5 py-2 sm:py-3 transition-[color,background-color,border-color,box-shadow,transform] duration-300 backdrop-blur-md text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                ${text.trim().length > 0
                  ? mode === 'release'
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-white border-blue-300/30 shadow-[0_0_30px_rgba(96,165,250,0.15)] cursor-pointer hover:scale-[1.02] focus-visible:ring-blue-400'
                    : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-white border-yellow-300/30 shadow-[0_0_30px_rgba(253,224,71,0.15)] cursor-pointer hover:scale-[1.02] focus-visible:ring-yellow-400'
                  : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                }`}
              aria-label={mode === 'release' ? 'Release to the Ocean' : 'Send to the Stars'}
            >
              <span className="uppercase tracking-[0.28em] text-white/80 group-hover:text-white">
                {mode === 'release' ? 'Release' : 'Send'}
              </span>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                {mode === 'release' ? <SendIcon /> : <StarIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
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
                className="absolute w-40 sm:w-48 md:w-60 h-40 sm:h-48 md:h-60 rounded-full"
                style={{
                  border: '3px solid rgba(186, 230, 253, 0.6)',
                  boxShadow: '0 0 50px rgba(56, 189, 248, 0.6), inset 0 0 50px rgba(56, 189, 248, 0.3)',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.15) 50%, rgba(56, 189, 248, 0.05) 100%)'
                }}
                animate={{
                  opacity: [0, 0.8, 1, 0.9, 0.95, 0],
                  scale: [0.7, 1, 1.05, 1.02, 1.08, 0.75]
                }}
                transition={{
                  duration: releaseDurationSec,
                  ease: easeInOut,
                  times: [0, 0.3, 0.5, 0.6, 0.7, 1]
                }}
              />
              <motion.div
                className="absolute w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full"
                style={{
                  border: '2px solid rgba(186, 230, 253, 0.5)',
                  boxShadow: '0 0 35px rgba(56, 189, 248, 0.5)',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(14, 165, 233, 0.1) 70%, transparent 100%)'
                }}
                animate={{
                  opacity: [0, 0.7, 0.9, 0.8, 0.85, 0],
                  scale: [0.8, 1.05, 1.1, 1.08, 1.12, 0.8]
                }}
                transition={{
                  duration: releaseDurationSec,
                  ease: easeInOut,
                  times: [0, 0.3, 0.5, 0.6, 0.7, 1],
                  delay: 0.15
                }}
              />
              <AnimatePresence mode="wait">
                {breathPhase && (
                  <motion.p
                    key={breathPhase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4, ease: easeInOut }}
                    className={`${breathFont.className} absolute -translate-y-32 sm:-translate-y-40 md:-translate-y-48 text-sm sm:text-base md:text-lg font-medium tracking-[0.16em] text-sky-100/85`}
                    aria-live="polite"
                    role="status"
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
              className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-6 pointer-events-none"
              aria-live="polite"
              role="status"
            >
              <p className={`${breathFont.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-white/90`}>
                {affirmation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Morphing & Releasing Bottle or Star */}
        <AnimatePresence>
          {(stage === 'morphing' || stage === 'releasing') && mode === 'release' && (
            <motion.div
              key="releasing-bottle"
              variants={bottleVariants}
              custom={shouldReduceMotion}
              initial="hidden"
              animate={stage}
              exit="exit"
              className="absolute inset-0 m-auto w-28 h-28 flex items-center justify-center"
            >
              <RealisticBottleSvg className="relative w-16 h-16 drop-shadow-[0_0_10px_rgba(96,165,250,0.28)]" />
            </motion.div>
          )}
          {(stage === 'morphing' || stage === 'releasing') && mode === 'gratitude' && (
            <motion.div
              key="releasing-star"
              initial={{ opacity: 0, scale: 0.5, y: '0vh' }}
              animate={
                stage === 'morphing'
                  ? { opacity: 1, scale: 1, y: '0vh', transition: { duration: 1, ease: easeOut } }
                  : {
                      opacity: [1, 1, 0.8, 0],
                      scale: shouldReduceMotion ? [1, 0.9, 0.8, 0.7] : [1, 0.8, 0.6, 0.3],
                      y: shouldReduceMotion ? ['0vh', '-10vh', '-20vh', '-30vh'] : ['0vh', '-15vh', '-35vh', '-55vh'],
                      transition: { duration: releaseDurationSec, ease: easeInOut }
                    }
              }
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute inset-0 m-auto w-28 h-28 flex items-center justify-center"
            >
              <StarIcon className="relative w-16 h-16 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Reflection Prompt Modal */}
      <AnimatePresence>
        {showReflectionPrompt && (
          <motion.div
            key="reflection-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowReflectionPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reflection-title"
              className="w-full max-w-md p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl"
            >
              <p id="reflection-title" className={`${breathFont.className} text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed mb-4 sm:mb-6`}>
                {currentPrompt}
              </p>
              <button
                onClick={() => setShowReflectionPrompt(false)}
                className="w-full px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emotion Wheel Modal */}
      <AnimatePresence>
        {showEmotionWheel && (
          <motion.div
            key="emotion-wheel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
            onClick={toggleEmotionWheel}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="emotion-title"
              className="w-full max-w-lg max-h-[70vh] overflow-y-auto p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl"
            >
              <h3 id="emotion-title" className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 text-center">What are you feeling?</h3>
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(emotionWheel).map(([category, emotions]) => (
                  <div key={category} className="rounded-lg sm:rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-medium text-white/90 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {emotions.map(emotion => (
                        <button
                          key={emotion}
                          onClick={() => {
                            setText(prev => prev + (prev ? ' ' : '') + emotion.toLowerCase());
                            toggleEmotionWheel();
                          }}
                          className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={toggleEmotionWheel}
                className="w-full mt-3 sm:mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Release Reflection Prompt */}
      <AnimatePresence>
        {showPreReleasePrompt && (
          <motion.div
            key="pre-release-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="prerelease-title"
              className="w-full max-w-md p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl"
            >
              <p id="prerelease-title" className={`${breathFont.className} text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed mb-4 sm:mb-6 text-center`}>
                Before you release…
                <br />
                <span className="text-base sm:text-lg text-white/70 mt-2 block">
                  What do you need right now?
                </span>
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowPreReleasePrompt(false)}
                  className="flex-1 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs sm:text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                >
                  Keep writing
                </button>
                <button
                  onClick={confirmRelease}
                  className="flex-1 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-xs sm:text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
                >
                  Release it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Control Panel */}
      <AnimatePresence>
        {showEventsPanel && (
          <motion.div
            key="events-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeInOut }}
            role="region"
            aria-label="Seasonal Events Panel"
            className="absolute right-4 sm:right-6 top-20 sm:top-24 w-[calc(100vw-2rem)] sm:w-[82vw] md:max-w-xs overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-[#0b1326]/95 backdrop-blur-xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-white/70">Seasonal Events</span>
              <button
                onClick={() => setShowEventsPanel(false)}
                className="text-[10px] sm:text-xs text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1326] p-1 rounded"
                aria-label="Close events panel"
              >
                ✕
              </button>
            </div>
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3">
              <div className="space-y-2">
                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Celestial</p>
                <button
                  onClick={() => toggleEvent('fullMoon')}
                  className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1326] ${
                    manualOverrides.fullMoon
                      ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-300/30 focus-visible:ring-yellow-400'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 focus-visible:ring-white/40'
                  }`}
                >
                  🌕 Full Moon
                </button>
                <button
                  onClick={() => toggleEvent('meteorShower')}
                  className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1326] ${
                    manualOverrides.meteorShower
                      ? 'bg-blue-500/20 text-blue-100 border border-blue-300/30 focus-visible:ring-blue-400'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 focus-visible:ring-white/40'
                  }`}
                >
                  ☄️ Meteor Shower
                </button>

              </div>


              <button
                onClick={resetOverrides}
                className="w-full mt-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] sm:text-xs text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1326]"
              >
                Reset to Auto
              </button>

              <p className="text-[9px] sm:text-[10px] text-white/40 pt-2">
                💡 Set time to NIGHT to see celestial events
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            key="history-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeInOut }}
            role="region"
            aria-label="Thoughts Release History Panel"
            className="absolute right-4 sm:right-6 top-20 sm:top-24 w-[calc(100vw-2rem)] sm:w-[82vw] md:max-w-xs max-h-[50vh] sm:max-h-[35vh] overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-[#0b1326]/80 backdrop-blur-xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 gap-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-white/70">Release History</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleSaveHistory}
                  className={`text-[10px] sm:text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white p-0.5 rounded ${saveHistory ? 'text-white' : 'text-white/60 hover:text-white'}`}
                  aria-pressed={saveHistory}
                >
                  {saveHistory ? 'On' : 'Off'}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] sm:text-xs text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white p-0.5 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-[10px] sm:text-xs text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b1326] p-1 rounded"
                  aria-label="Close history panel"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-[42vh] sm:max-h-[28vh] overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
              {history.length === 0 ? (
                <div className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 sm:py-3">
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    No entries yet. Turn on saving, then release or share gratitude to see it here.
                  </p>
                </div>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2">
                    <div className="flex items-start gap-2">
                      {entry.mode === 'gratitude' ? (
                        <StarIcon className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-300/70 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-blue-300/70 text-xs sm:text-sm flex-shrink-0">🌊</span>
                      )}
                      <p className="text-xs sm:text-sm text-white/85 leading-relaxed flex-1 line-clamp-2 break-words break-all">
                        {entry.text}
                      </p>
                    </div>
                    <p className="mt-1 ml-5 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {formatReleaseDate(entry.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Moon - Realistic */}
      {(isFullMoon(moonPhase) || manualOverrides.fullMoon) && effectiveTimeOfDay === 'night' && (
        <div className="absolute top-[8%] right-[15%] w-24 h-24 sm:w-32 sm:h-32 pointer-events-none z-5">
          {/* Outer glow layers */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,252,240,0.4) 0%, rgba(255,252,240,0.2) 40%, transparent 70%)',
              filter: 'blur(20px)'
            }}
          />
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,250,230,0.5) 0%, rgba(255,245,210,0.3) 50%, transparent 80%)',
              filter: 'blur(15px)'
            }}
          />
          
          {/* Moon surface with craters */}
          <div className="absolute inset-0 rounded-full overflow-hidden" style={{
            background: 'radial-gradient(circle at 35% 35%, #fffef7 0%, #fef9e7 30%, #f5f0d8 60%, #e8dfc0 100%)',
            boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.15), 0 0 40px rgba(255,252,240,0.6), 0 0 80px rgba(255,252,240,0.3)'
          }}>
            {/* Crater details */}
            <div className="absolute top-[25%] left-[30%] w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300/30" />
            <div className="absolute top-[45%] left-[55%] w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300/25" />
            <div className="absolute top-[60%] left-[35%] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-gray-300/20" />
            <div className="absolute top-[35%] left-[65%] w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300/30" />
            <div className="absolute top-[70%] left-[60%] w-2 h-2 rounded-full bg-gray-300/20" />
            
            {/* Surface texture overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, transparent 0%, rgba(0,0,0,0.1) 100%)'
            }} />
          </div>
          
          {/* Atmospheric glow */}
          <motion.div
            animate={{ 
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 45%, rgba(255,252,240,0.15) 60%, transparent 75%)',
              filter: 'blur(2px)'
            }}
          />
        </div>
      )}



      {/* Meteor Shower */}
      {(showMeteorShower || manualOverrides.meteorShower) && effectiveTimeOfDay === 'night' && meteors.map(meteor => (
        <motion.div
          key={meteor.id}
          initial={{ opacity: 0, x: `${meteor.x}vw`, y: `${meteor.y}vh` }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [`${meteor.x}vw`, `${meteor.x + 35}vw`],
            y: [`${meteor.y}vh`, `${meteor.y + 35}vh`]
          }}
          transition={{
            duration: meteor.duration,
            delay: meteor.delay,
            ease: "easeIn",
            times: [0, 0.1, 0.7, 1]
          }}
          className="absolute pointer-events-none z-5"
          style={{ rotate: `${meteor.angle}deg` }}
        >
          <MeteorSvg className="w-24 h-24 sm:w-32 sm:h-32" />
        </motion.div>
      ))}

      {/* Gratitude Stars in the Sky */}
      <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
        {stars.map((star, index) => (
          <motion.button
            key={star.id}
            type="button"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.7], scale: [0, 1.2, 1] }}
            transition={{ duration: 1.5, delay: star.delay }}
            className="absolute group pointer-events-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            aria-label={`Gratitude star: ${star.text}`}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 3 + (index % 3),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <StarIcon className="w-2 sm:w-3 md:w-4 h-2 sm:h-3 md:h-4 text-yellow-200/60 drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]" aria-hidden="true" />
            </motion.div>
            <div className="absolute left-1/2 -translate-x-1/2 top-4 sm:top-6 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity bg-black/85 text-white text-[10px] sm:text-xs px-2 py-1 rounded whitespace-normal break-words w-40 pointer-events-none border border-white/10 shadow-lg text-center z-50">
              {star.text}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Bioluminescent Plankton (Night Only) */}
      {effectiveTimeOfDay === 'night' && (
        <div className="absolute bottom-0 left-0 w-full h-[30vh] pointer-events-none z-15 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`plankton-${i}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0.3, 0.8, 0],
                x: [
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`
                ],
                y: [
                  `${60 + Math.random() * 40}%`,
                  `${50 + Math.random() * 30}%`,
                  `${70 + Math.random() * 30}%`
                ]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                delay: Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"
            />
          ))}
        </div>
      )}

      {/* Ambient Ocean Waves (Bottom) with Seasonal Variations */}
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