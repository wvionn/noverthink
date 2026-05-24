'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants, easeInOut, easeOut } from 'framer-motion';

// --- Types ---
type AnimationStage = 'typing' | 'crystallizing' | 'morphing' | 'releasing' | 'complete' | 'affirmation';

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

const bottleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5, y: 0, filter: 'blur(10px)' },
  morphing: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: easeOut }
  },
  releasing: {
    opacity: 0,
    scale: 0.2,
    y: '45vh', // Translates downwards towards the ocean waves
    transition: { duration: 2.5, ease: easeInOut }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
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
const calmingSteps = [
  
];

const getRandomAffirmation = () => {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
};

// --- Raw SVG Icons (Zero Dependencies) ---
const BottleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 2v3.31a2 2 0 0 0 .59 1.41l1.82 1.82c.59.59.59 1.56 0 2.15l-1.82 1.82a2 2 0 0 0-.59 1.41V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5.08a2 2 0 0 0-.59-1.41l-1.82-1.82a1.5 1.5 0 0 1 0-2.15l1.82-1.82a2 2 0 0 0 .59-1.41V2" />
    <path d="M8 2h8" />
    <path d="M8 22h8" />
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydration & initial setup
  useEffect(() => {
    setIsMounted(true);
    const savedCount = localStorage.getItem('thoughtsReleased');
    if (savedCount) setReleasedCount(parseInt(savedCount, 10));

    // Setup ambient ocean sound
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/water/ocean_waves_crashing.ogg');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
      timeout = setTimeout(() => setStage('complete'), 2500);
    } else if (stage === 'complete') {
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
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleRelease = () => {
    if (text.trim().length > 0 && stage === 'typing') {
      setStage('crystallizing');
    }
  };

  if (!isMounted) return null; // Prevent SSR hydration mismatch

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-blue-950 font-sans text-white/90 selection:bg-white/20">

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
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
          <BottleIcon className="w-5 h-5 text-blue-300" />
          <span className="text-sm font-medium tracking-wide">
            <strong className="text-white">{releasedCount}</strong> thoughts let go
          </span>
        </div>

        <button
          onClick={toggleAudio}
          className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg"
          aria-label="Toggle ambient sound"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
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

              <button
                onClick={handleRelease}
                disabled={text.trim().length === 0 || stage !== 'typing'}
                className={`flex items-center justify-center py-4 rounded-2xl font-medium tracking-wide transition-all duration-300
                  ${text.trim().length > 0
                    ? 'bg-white/10 hover:bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer border border-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                  }`}
              >
                Release to the Ocean
                <SendIcon />
              </button>
            </motion.div>
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
              <p className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white/90">
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
              className="absolute inset-0 m-auto w-24 h-24 flex items-center justify-center rounded-full bg-blue-400/10 border border-blue-300/20 backdrop-blur-md shadow-[0_0_40px_rgba(96,165,250,0.3)]"
            >
              <BottleIcon className="w-10 h-10 text-blue-200" />
              {/* Subtle pulsing glow behind the bottle */}
              <div className="absolute inset-0 rounded-full bg-blue-300/20 animate-ping opacity-50" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Ambient Ocean Waves (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] pointer-events-none z-10 overflow-hidden text-blue-400/20">

        {/* Back Wave (Slow) */}
        <div className="wave-layer wave-slow text-[#0a192f]/60 mix-blend-screen">
          <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,60 C300,120 300,0 600,60 C900,120 900,0 1200,60 C1500,120 1500,0 1800,60 C2100,120 2100,0 2400,60 L2400,120 L0,120 Z" />
          </svg>
        </div>

        {/* Middle Wave (Medium, Reverse) */}
        <div className="wave-layer wave-mid text-indigo-900/40 mix-blend-screen">
          <svg viewBox="0 0 2400 120" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M0,80 C300,20 300,140 600,80 C900,20 900,140 1200,80 C1500,20 1500,140 1800,80 C2100,20 2100,140 2400,80 L2400,120 L0,120 Z" />
          </svg>
        </div>

        {/* Front Wave (Fast) */}
        <div className="wave-layer wave-fast text-blue-800/30 mix-blend-screen">
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