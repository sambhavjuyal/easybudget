import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  PiggyBank, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Briefcase, 
  ExternalLink, 
  X,
  Compass
} from 'lucide-react';
import { soundEngine } from '../utils/gameAudio';
import { formatINR } from '../utils/currency';
import { JobListing, GroundingSource } from '../types';

export interface MoneyMasterGameProps {
  onExitGame?: () => void;
  defaultSalary?: number;
}

type DropCategory = 'essential' | 'saving' | 'investment' | 'hazard' | 'bonus';

interface DropItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  category: DropCategory;
  name: string;
  amount: number;
  icon: string;
  color: string;
  size: number;
  rot: number;
  rotSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface MonthEvent {
  month: number;
  title: string;
  prompt: string;
  options: {
    label: string;
    impact: string;
    financialLesson: string;
    action: 'save' | 'invest' | 'spend' | 'earn';
    cashDelta: number;
  }[];
}

const MONTH_EVENTS: MonthEvent[] = [
  {
    month: 1,
    title: 'The Golden 50-30-20 Rule Unlocked',
    prompt: 'You received your first salary of the year! How do you want to allocate your hard-earned money?',
    options: [
      {
        label: 'Stick to 50% Essentials, 20% Emergency, 30% Investments (Recommended)',
        impact: '+Balanced wealth growth',
        financialLesson: 'The 50-30-20 rule ensures you never go broke: 50% covers rent & food, 20% protects you from crises, and 30% builds your future crore-rupee net worth.',
        action: 'save',
        cashDelta: 5000,
      },
      {
        label: 'Splurge on an expensive smartphone on 12-month EMI',
        impact: '-₹3,500/mo EMI debt',
        financialLesson: 'EMIs on depreciating gadgets lock you into fixed debt before your safety cushion is built. Avoid consumer debt early!',
        action: 'spend',
        cashDelta: -15000,
      },
      {
        label: 'Park everything in a 3% low-interest savings account',
        impact: 'Safe, but inflation eats your money',
        financialLesson: 'Keeping all money in basic savings loses value to inflation (~6%). Emergency funds belong in high-yield liquid accounts, and long-term funds in Index Funds.',
        action: 'save',
        cashDelta: 0,
      },
    ],
  },
  {
    month: 3,
    title: 'Emergency Alert: Urgent Family Medical Bill!',
    prompt: 'An unexpected hospitalization requires ₹15,000 immediately.',
    options: [
      {
        label: 'Pay from your 20% Emergency Savings cushion (Zero debt)',
        impact: 'Safe emergency fund buffer used',
        financialLesson: 'This is why the 20% Emergency Fund exists! Having 3 to 6 months of expenses in a liquid fund prevents taking costly 42% credit card loans.',
        action: 'save',
        cashDelta: -12000,
      },
      {
        label: 'Swipe a high-interest credit card and pay minimum due',
        impact: '+42% annual compound interest trap',
        financialLesson: 'Credit card rollover interest is loan-shark territory (36-42% APR). Never pay just the minimum due — always pay in full.',
        action: 'spend',
        cashDelta: -18000,
      },
    ],
  },
  {
    month: 6,
    title: 'Mid-Year Bonus: Where Should You Invest?',
    prompt: 'You received a performance appraisal bonus of ₹25,000! Where will you put it?',
    options: [
      {
        label: 'Nifty 50 Index Mutual Fund (Low cost, compounding 12-14% CAGR)',
        impact: '+Long-term wealth compounding',
        financialLesson: 'Nifty 50 invests in India\'s top 50 blue-chip companies with ultra-low expense ratio (0.1%). Over 10-15 years, it turns steady monthly SIPs into multi-lakh wealth.',
        action: 'invest',
        cashDelta: 25000,
      },
      {
        label: 'Public Provident Fund (PPF) or Sovereign Gold Bond (Tax-free safe return)',
        impact: '+Guaranteed sovereign safety',
        financialLesson: 'PPF provides 7.1% tax-free returns under EEE (Exempt-Exempt-Exempt) category. Gold bonds protect purchasing power against currency debasement.',
        action: 'invest',
        cashDelta: 25000,
      },
      {
        label: 'Put it all in a hot trending meme stock or crypto tip',
        impact: 'High risk of 70% capital loss',
        financialLesson: 'Speculating with tips is gambling, not investing. Only risk money you can afford to lose 100% of after your essential index SIPs are funded.',
        action: 'spend',
        cashDelta: -10000,
      },
    ],
  },
  {
    month: 9,
    title: 'Side Hustle Opportunity: Extra Cash via Online Portals',
    prompt: 'You have 5 spare hours over the weekend. A client offers remote content editing or customer support.',
    options: [
      {
        label: 'Take the gig and invest the ₹10,000 extra earnings into your SIP',
        impact: '+₹10,000 invested directly into compounding',
        financialLesson: 'Earning extra money on portals like Naukri, RemoteOK, or Internshala accelerates financial freedom by 5 to 7 years!',
        action: 'earn',
        cashDelta: 10000,
      },
      {
        label: 'Skip it and order food delivery while watching TV',
        impact: '-₹2,000 delivery leak',
        financialLesson: 'Rest is important, but balancing leisure with a 4-hour weekly monetization habit builds massive financial resilience.',
        action: 'spend',
        cashDelta: -2000,
      },
    ],
  },
];

export const MoneyMasterGame: React.FC<MoneyMasterGameProps> = ({
  onExitGame,
  defaultSalary = 60000,
}) => {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'milestone' | 'gameover' | 'victory'>('title');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [selectedDifficulty, setSelectedDifficulty] = useState<'starter' | 'standard' | 'advanced'>('standard');
  
  const [month, setMonth] = useState<number>(1);
  const [netWorth, setNetWorth] = useState<number>(50000);
  const [monthIncome, setMonthIncome] = useState<number>(defaultSalary);
  const [essentialsCaught, setEssentialsCaught] = useState<number>(0);
  const [savingsCaught, setSavingsCaught] = useState<number>(0);
  const [investmentsCaught, setInvestmentsCaught] = useState<number>(0);
  const [debtAccumulated, setDebtAccumulated] = useState<number>(0);
  const [monthProgress, setMonthProgress] = useState<number>(0);

  const [currentEvent, setCurrentEvent] = useState<MonthEvent | null>(null);
  const [showGuidanceModal, setShowGuidanceModal] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'essentials' | 'savings' | 'investing' | 'easyjobs'>('essentials');

  // Real Job Portal Search within Game
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobSources, setJobSources] = useState<GroundingSource[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Player physics
  const playerRef = useRef({
    x: 400,
    y: 520,
    width: 90,
    height: 48,
    vx: 0,
    speed: 700,
    squashX: 1,
    squashY: 1,
  });

  const keysRef = useRef<{ left: boolean; right: boolean; dash: boolean }>({
    left: false,
    right: false,
    dash: false,
  });

  const dropsRef = useRef<DropItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingText[]>([]);
  const nextDropTimerRef = useRef<number>(0);
  const monthTimerRef = useRef<number>(0);
  const MONTH_DURATION = 26; // 26 seconds per month
  const screenShakeRef = useRef({ time: 0, magnitude: 0 });

  const targets = {
    essentials: Math.round(monthIncome * 0.5),   // 50%
    savings: Math.round(monthIncome * 0.2),      // 20%
    investments: Math.round(monthIncome * 0.3),  // 30%
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const fetchPortalJobs = async (category = 'Work From Home / Remote') => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/ai/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: category,
          location: 'India / Remote / Work From Home',
          targetDeficit: 15000,
          category,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
        setJobSources(data.sources || []);
      }
    } catch {
      // Graceful fallback handled by API
    } finally {
      setLoadingJobs(false);
    }
  };

  const startGame = useCallback((difficulty = selectedDifficulty) => {
    let income = defaultSalary;
    if (difficulty === 'starter') income = 35000;
    if (difficulty === 'advanced') income = 120000;

    setMonthIncome(income);
    setMonth(1);
    setNetWorth(income * 0.8);
    setEssentialsCaught(0);
    setSavingsCaught(0);
    setInvestmentsCaught(0);
    setDebtAccumulated(0);
    setMonthProgress(0);

    dropsRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];
    nextDropTimerRef.current = 0.5;
    monthTimerRef.current = 0;

    soundEngine.playLevelUp();
    setGameState('playing');
    isPlayingRef.current = true;
  }, [defaultSalary, selectedDifficulty]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      soundEngine.playClick();
      setGameState('paused');
      isPlayingRef.current = false;
    } else if (gameState === 'paused') {
      soundEngine.playClick();
      setGameState('playing');
      isPlayingRef.current = true;
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keysRef.current.dash = true;
      if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) startGame();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keysRef.current.dash = false;
    };

    const handleBlur = () => {
      keysRef.current.left = false;
      keysRef.current.right = false;
      keysRef.current.dash = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, togglePause, startGame]);

  const handlePointerDownOrMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || gameState !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    playerRef.current.x = Math.max(
      playerRef.current.width / 2,
      Math.min(canvasRef.current.width - playerRef.current.width / 2, touchX)
    );
  };

  const createBurst = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 70 + Math.random() * 160;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  };

  const createFloater = (x: number, y: number, text: string, color: string) => {
    floatersRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 0.85,
    });
  };

  const triggerShake = (magnitude = 8, duration = 0.25) => {
    screenShakeRef.current = { magnitude, time: duration };
  };

  const spawnDrop = (canvasWidth: number) => {
    const templates: {
      category: DropCategory;
      name: string;
      amountRatio: number;
      icon: string;
      color: string;
      size: number;
    }[] = [
      // 50% Essentials (Needs)
      { category: 'essential', name: 'House Rent', amountRatio: 0.15, icon: '🏠', color: '#3b82f6', size: 28 },
      { category: 'essential', name: 'Groceries / Dal', amountRatio: 0.08, icon: '🛒', color: '#2563eb', size: 26 },
      { category: 'essential', name: 'Electricity & WiFi', amountRatio: 0.04, icon: '⚡', color: '#60a5fa', size: 24 },
      { category: 'essential', name: 'Medicine & Health', amountRatio: 0.05, icon: '💊', color: '#1d4ed8', size: 25 },

      // 20% Emergency Savings
      { category: 'saving', name: 'Emergency Cushion', amountRatio: 0.07, icon: '🛡️', color: '#10b981', size: 26 },
      { category: 'saving', name: 'Liquid Savings', amountRatio: 0.06, icon: '🏦', color: '#059669', size: 26 },
      { category: 'saving', name: 'Rainy Day Fund', amountRatio: 0.05, icon: '☂️', color: '#34d399', size: 25 },

      // 30% Investments (Compounding)
      { category: 'investment', name: 'Nifty 50 Index Fund', amountRatio: 0.10, icon: '📈', color: '#8b5cf6', size: 28 },
      { category: 'investment', name: 'Mutual Fund SIP', amountRatio: 0.08, icon: '🚀', color: '#7c3aed', size: 27 },
      { category: 'investment', name: 'Sovereign Gold / PPF', amountRatio: 0.06, icon: '🪙', color: '#2563eb', size: 26 },

      // Hazards / Debt Traps
      { category: 'hazard', name: 'Swiggy Midnight Surge', amountRatio: 0.04, icon: '🍔', color: '#ef4444', size: 26 },
      { category: 'hazard', name: 'Credit Card 42% APR Trap', amountRatio: 0.10, icon: '💳', color: '#dc2626', size: 28 },
      { category: 'hazard', name: 'Impulse Gadget Sale', amountRatio: 0.08, icon: '🔥', color: '#b91c1c', size: 27 },
      { category: 'hazard', name: 'Meme Crypto Tip', amountRatio: 0.07, icon: '💀', color: '#991b1b', size: 26 },

      // Bonus Extra Income
      { category: 'bonus', name: 'Side Freelance Gig', amountRatio: 0.08, icon: '⭐', color: '#f59e0b', size: 28 },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    const margin = 50;
    const x = margin + Math.random() * (canvasWidth - margin * 2);
    const speed = 140 + Math.random() * 110 + month * 12;

    dropsRef.current.push({
      id: Math.random(),
      x,
      y: -30,
      speed,
      category: pick.category,
      name: pick.name,
      amount: Math.round(monthIncome * pick.amountRatio),
      icon: pick.icon,
      color: pick.color,
      size: pick.size,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 3,
    });
  };

  const triggerMonthEnd = useCallback((currentMonth: number) => {
    soundEngine.playLevelUp();
    isPlayingRef.current = false;

    if (currentMonth >= 12) {
      setGameState('victory');
      return;
    }

    const event = MONTH_EVENTS.find((e) => e.month === currentMonth) || {
      month: currentMonth,
      title: `Month ${currentMonth} Financial Review`,
      prompt: 'Excellent discipline! Your salary was successfully managed according to the 50-30-20 principle.',
      options: [
        {
          label: 'Re-invest returns into Nifty 50 Index Fund for compound interest',
          impact: '+12% compounding rate',
          financialLesson: 'Compounding is the 8th wonder: reinvesting yields turns small savings into crore-rupee portfolios over time.',
          action: 'invest',
          cashDelta: 5000,
        },
        {
          label: 'Boost 3-month Emergency Fund buffer in high-yield savings',
          impact: '+Extra crisis safety shield',
          financialLesson: 'A solid emergency buffer gives you calm sleep at night and career negotiation confidence.',
          action: 'save',
          cashDelta: 5000,
        },
      ],
    };

    setCurrentEvent(event);
    setGameState('milestone');
  }, []);

  const continueToNextMonth = (option: MonthEvent['options'][0]) => {
    soundEngine.playCoin();
    setNetWorth((prev) => prev + option.cashDelta);

    const nextM = month + 1;
    setMonth(nextM);
    setEssentialsCaught(0);
    setSavingsCaught(0);
    setInvestmentsCaught(0);
    setDebtAccumulated(0);
    setMonthProgress(0);
    monthTimerRef.current = 0;
    dropsRef.current = [];

    setCurrentEvent(null);
    setGameState('playing');
    isPlayingRef.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      animFrameId.current = requestAnimationFrame(loop);
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const dt = Math.min(rawDt, 0.05);

      const logicalWidth = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
      const logicalHeight = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      ctx.save();

      if (screenShakeRef.current.time > 0) {
        screenShakeRef.current.time -= dt;
        const mag = screenShakeRef.current.magnitude;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }

      // Background subtle grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < logicalWidth; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
      }
      for (let y = 0; y < logicalHeight; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
      }

      if (isPlayingRef.current && gameState === 'playing') {
        monthTimerRef.current += dt;
        const progressPct = Math.min(100, Math.round((monthTimerRef.current / MONTH_DURATION) * 100));
        setMonthProgress(progressPct);

        if (monthTimerRef.current >= MONTH_DURATION) {
          triggerMonthEnd(month);
        }

        nextDropTimerRef.current -= dt;
        if (nextDropTimerRef.current <= 0) {
          spawnDrop(logicalWidth);
          nextDropTimerRef.current = Math.max(0.35, 0.95 - month * 0.04);
        }

        const player = playerRef.current;
        player.y = logicalHeight - 65;
        let moveDir = 0;
        if (keysRef.current.left) moveDir -= 1;
        if (keysRef.current.right) moveDir += 1;

        const currentSpeed = keysRef.current.dash ? player.speed * 1.5 : player.speed;
        player.x += moveDir * currentSpeed * dt;

        const halfW = player.width / 2;
        if (player.x < halfW) player.x = halfW;
        if (player.x > logicalWidth - halfW) player.x = logicalWidth - halfW;

        player.squashX += (1 - player.squashX) * 10 * dt;
        player.squashY += (1 - player.squashY) * 10 * dt;

        for (let i = dropsRef.current.length - 1; i >= 0; i--) {
          const drop = dropsRef.current[i];
          drop.y += drop.speed * dt;
          drop.rot += drop.rotSpeed * dt;

          const pLeft = player.x - halfW;
          const pRight = player.x + halfW;
          const pTop = player.y - player.height / 2;
          const pBottom = player.y + player.height / 2;

          const collides =
            drop.x + drop.size > pLeft &&
            drop.x - drop.size < pRight &&
            drop.y + drop.size > pTop &&
            drop.y - drop.size < pBottom;

          if (collides) {
            player.squashX = 1.25;
            player.squashY = 0.78;

            if (drop.category === 'hazard') {
              soundEngine.playHazard();
              triggerShake(12, 0.28);
              createBurst(drop.x, drop.y, '#ef4444', 16);
              createFloater(drop.x, drop.y - 15, `-${formatINR(drop.amount)} ${drop.name}`, '#ef4444');
              setDebtAccumulated((d) => d + drop.amount);
              setNetWorth((nw) => Math.max(0, nw - drop.amount));
            } else if (drop.category === 'essential') {
              soundEngine.playCoin(1.0);
              createBurst(drop.x, drop.y, '#3b82f6', 10);
              createFloater(drop.x, drop.y - 15, `+${formatINR(drop.amount)} ${drop.name}`, '#2563eb');
              setEssentialsCaught((e) => e + drop.amount);
            } else if (drop.category === 'saving') {
              soundEngine.playCoin(1.2);
              createBurst(drop.x, drop.y, '#10b981', 12);
              createFloater(drop.x, drop.y - 15, `+${formatINR(drop.amount)} ${drop.name}`, '#059669');
              setSavingsCaught((s) => s + drop.amount);
              setNetWorth((nw) => nw + drop.amount);
            } else if (drop.category === 'investment') {
              soundEngine.playInvestment();
              createBurst(drop.x, drop.y, '#8b5cf6', 16);
              createFloater(drop.x, drop.y - 15, `+${formatINR(drop.amount)} ${drop.name}`, '#7c3aed');
              setInvestmentsCaught((inv) => inv + drop.amount);
              setNetWorth((nw) => nw + Math.round(drop.amount * 1.15));
            } else if (drop.category === 'bonus') {
              soundEngine.playInvestment();
              createBurst(drop.x, drop.y, '#f59e0b', 20);
              createFloater(drop.x, drop.y - 15, `+${formatINR(drop.amount)} Extra Gig Income!`, '#d97706');
              setInvestmentsCaught((inv) => inv + drop.amount);
              setNetWorth((nw) => nw + drop.amount);
            }

            dropsRef.current.splice(i, 1);
            continue;
          }

          if (drop.y > logicalHeight + 40) {
            dropsRef.current.splice(i, 1);
          }
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pItem = particlesRef.current[i];
          pItem.x += pItem.vx * dt;
          pItem.y += pItem.vy * dt;
          pItem.life += dt;
          if (pItem.life >= pItem.maxLife) particlesRef.current.splice(i, 1);
        }

        for (let i = floatersRef.current.length - 1; i >= 0; i--) {
          const f = floatersRef.current[i];
          f.y -= 45 * dt;
          f.life += dt;
          if (f.life >= f.maxLife) floatersRef.current.splice(i, 1);
        }
      }

      // Draw Drops
      for (const drop of dropsRef.current) {
        ctx.save();
        ctx.translate(drop.x, drop.y);
        ctx.rotate(drop.rot);

        const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, drop.size + 8);
        glow.addColorStop(0, drop.color + '40');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, drop.size + 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = drop.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, drop.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${drop.size * 0.9}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drop.icon, 0, 2);
        ctx.restore();

        ctx.save();
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillStyle = drop.color;
        ctx.textAlign = 'center';
        ctx.fillText(drop.name, drop.x, drop.y + drop.size + 13);
        ctx.restore();
      }

      // Draw Particles
      for (const pItem of particlesRef.current) {
        const alpha = Math.max(0, 1 - pItem.life / pItem.maxLife);
        ctx.save();
        ctx.fillStyle = pItem.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pItem.x, pItem.y, pItem.size * (1 - pItem.life / pItem.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Player Cart
      const plyr = playerRef.current;
      ctx.save();
      ctx.translate(plyr.x, plyr.y);
      ctx.scale(plyr.squashX, plyr.squashY);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 24, plyr.width * 0.55, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const cartGrad = ctx.createLinearGradient(0, -plyr.height / 2, 0, plyr.height / 2);
      cartGrad.addColorStop(0, '#1e3a8a');
      cartGrad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = cartGrad;
      ctx.beginPath();
      ctx.roundRect(-plyr.width / 2, -plyr.height / 2, plyr.width, plyr.height, 12);
      ctx.fill();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-plyr.width / 2 + 6, -plyr.height / 2 + 4, plyr.width - 12, 8, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', 0, 4);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-16, -2, 4, 0, Math.PI * 2);
      ctx.arc(16, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a2540';
      ctx.beginPath();
      ctx.arc(-16 + (keysRef.current.left ? -1 : keysRef.current.right ? 1 : 0), -2, 2, 0, Math.PI * 2);
      ctx.arc(16 + (keysRef.current.left ? -1 : keysRef.current.right ? 1 : 0), -2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-plyr.width / 2 + 14, plyr.height / 2 + 3, 6, 0, Math.PI * 2);
      ctx.arc(plyr.width / 2 - 14, plyr.height / 2 + 3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-plyr.width / 2 + 14, plyr.height / 2 + 3, 2, 0, Math.PI * 2);
      ctx.arc(plyr.width / 2 - 14, plyr.height / 2 + 3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw Floaters
      for (const f of floatersRef.current) {
        const alpha = Math.max(0, 1 - f.life / f.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillStyle = f.color;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      ctx.restore();
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, month, monthIncome, triggerMonthEnd]);

  const essentialsRatio = Math.min(100, Math.round((essentialsCaught / (targets.essentials || 1)) * 100));
  const savingsRatio = Math.min(100, Math.round((savingsCaught / (targets.savings || 1)) * 100));
  const investmentsRatio = Math.min(100, Math.round((investmentsCaught / (targets.investments || 1)) * 100));

  return (
    <div className="relative w-full h-screen max-h-screen overflow-hidden bg-slate-50 font-sans select-none flex flex-col">
      {/* 1. TOP MINIMALIST HUD */}
      <header className="relative z-20 bg-white/95 border-b border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1e3a8a] to-[#f59e0b] flex items-center justify-center text-white font-black text-sm shadow-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#0a2540] tracking-tight">RUPEE MASTER</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1e3a8a]/10 text-[#1e3a8a] border border-[#1e3a8a]/20">
                  Month {month} of 12
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#64748b] font-medium">
                <span>Net Worth: <strong className="text-[#0a2540] tabular-nums font-bold">{formatINR(netWorth)}</strong></span>
                {debtAccumulated > 0 && (
                  <span className="text-red-600 font-bold tabular-nums">• Debt: -{formatINR(debtAccumulated)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Center 50-30-20 Gauge Bars */}
          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-xl px-2">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-blue-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  50% Essentials
                </span>
                <span className="tabular-nums text-slate-600">{essentialsRatio}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${essentialsRatio}%` }} />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  20% Savings
                </span>
                <span className="tabular-nums text-slate-600">{savingsRatio}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${savingsRatio}%` }} />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-purple-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                  30% Invest
                </span>
                <span className="tabular-nums text-slate-600">{investmentsRatio}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-300" style={{ width: `${investmentsRatio}%` }} />
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowGuidanceModal(true);
                if (gameState === 'playing') setGameState('paused');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#425466] hover:text-[#0a2540] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span className="hidden md:inline">Money Rules</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>

            {gameState === 'playing' ? (
              <button
                onClick={togglePause}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : gameState === 'paused' ? (
              <button
                onClick={togglePause}
                className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : null}

            {onExitGame && (
              <button
                onClick={onExitGame}
                className="ml-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Exit Game
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#f59e0b] transition-all duration-200"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN CANVAS PLAYFIELD */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden cursor-ew-resize touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDownOrMove}
          onPointerMove={handlePointerDownOrMove}
          className="absolute inset-0 w-full h-full block"
        />

        {gameState === 'playing' && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-40 text-[11px] font-semibold text-slate-500">
            Swipe or Drag horizontally • Catch 50% Needs, 20% Savings, 30% Investments • Avoid Red Debt Traps!
          </div>
        )}

        {/* TITLE SCREEN */}
        {gameState === 'title' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-tr from-[#1e3a8a] via-[#f59e0b] to-[#00d4ff] rounded-full blur-2xl opacity-20 pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br from-[#f59e0b] to-[#f59e0b] rounded-full blur-2xl opacity-20 pointer-events-none" />

              <div className="flex justify-center mb-4">
                <svg width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="10" width="130" height="50" rx="16" fill="#0A2540" />
                  <rect x="7" y="12" width="126" height="46" rx="14" stroke="url(#paint0_linear)" strokeWidth="2" />
                  <circle cx="36" cy="35" r="16" fill="url(#paint1_linear)" />
                  <text x="36" y="42" fill="white" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="system-ui">₹</text>
                  <text x="64" y="32" fill="white" fontSize="13" fontWeight="900" letterSpacing="1" fontFamily="system-ui">RUPEE</text>
                  <text x="64" y="46" fill="#00D4FF" fontSize="11" fontWeight="800" letterSpacing="2" fontFamily="system-ui">MASTER</text>
                  <defs>
                    <linearGradient id="paint0_linear" x1="0" y1="0" x2="140" y2="70" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#635BFF" />
                      <stop offset="0.5" stopColor="#EC4899" />
                      <stop offset="1" stopColor="#00D4FF" />
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="20" y1="20" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#635BFF" />
                      <stop offset="1" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#0a2540] tracking-tight">
                The 50-30-20 Wealth Quest
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-[#425466] leading-relaxed max-w-sm mx-auto">
                Catch your essentials, build your emergency cushion, and invest for compounding returns. Survive 12 months without drowning in debt!
              </p>

              <div className="grid grid-cols-3 gap-2 my-5 text-left text-[11px]">
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100">
                  <div className="font-bold text-blue-800">50% Needs</div>
                  <div className="text-blue-600 text-[10px]">Rent & Groceries</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
                  <div className="font-bold text-emerald-800">20% Save</div>
                  <div className="text-emerald-600 text-[10px]">Emergency Fund</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100">
                  <div className="font-bold text-purple-800">30% Invest</div>
                  <div className="text-purple-600 text-[10px]">Nifty 50 Index</div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Choose Starting Salary Bracket
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'starter', label: '₹35,000', desc: 'Entry Level' },
                    { key: 'standard', label: '₹60,000', desc: 'Mid Level' },
                    { key: 'advanced', label: '₹1,20,000', desc: 'Senior' },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      onClick={() => setSelectedDifficulty(lvl.key as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDifficulty === lvl.key
                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-indigo-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>{lvl.label}</div>
                      <div className="text-[9px] font-medium opacity-80">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startGame()}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Wealth Quest (Space / Enter)</span>
              </button>

              <div className="mt-4 text-[11px] text-slate-400 font-medium">
                WASD / Arrow Keys Move • Space Dash • P / Esc Pause
              </div>
            </div>
          </div>
        )}

        {/* MONTH CHECKPOINT MODAL */}
        {gameState === 'milestone' && currentEvent && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1e3a8a] mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Month {month} Checkpoint Completed!</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0a2540]">
                {currentEvent.title}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-[#425466] leading-relaxed">
                {currentEvent.prompt}
              </p>

              <div className="mt-5 space-y-3">
                {currentEvent.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => continueToNextMonth(opt)}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-[#1e3a8a] bg-slate-50 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-[#0a2540] group-hover:text-[#1e3a8a]">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-xs text-[#64748b] leading-normal">
                          💡 <strong>Real Rule:</strong> {opt.financialLesson}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        opt.cashDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {opt.impact}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-[#64748b]">
                <span>Current Net Worth: <strong className="text-[#0a2540]">{formatINR(netWorth)}</strong></span>
                <button
                  onClick={() => {
                    setShowGuidanceModal(true);
                    setActiveGuideTab('easyjobs');
                    fetchPortalJobs();
                  }}
                  className="font-bold text-[#1e3a8a] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Need extra income? Find real jobs</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAUSE MODAL */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in duration-150">
              <h2 className="text-xl font-black text-[#0a2540] mb-2">Game Paused</h2>
              <p className="text-xs text-[#64748b] mb-6">
                Take a breath! Healthy budgeting is a marathon, not a sprint.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={togglePause}
                  className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-[#172554] cursor-pointer"
                >
                  Resume Playing (Esc / P)
                </button>

                <button
                  onClick={() => setShowGuidanceModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-[#0a2540] font-bold text-xs hover:bg-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>Review 50-30-20 & Investment Guide</span>
                </button>

                <button
                  onClick={() => startGame()}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Year 1</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY MODAL */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center my-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-3xl mb-3 shadow-inner">
                🏆
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                12-Month Financial Freedom Achieved!
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-[#0a2540] mt-3">
                You Are a Certified Rupee Master!
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-[#425466] leading-relaxed max-w-md mx-auto">
                By maintaining 50% on essentials, building a solid 20% emergency cushion, and investing 30% into index compounding, your finances are practically bulletproof!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 text-left">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Ending Net Worth</div>
                  <div className="text-lg font-black text-[#0a2540] tabular-nums">{formatINR(netWorth)}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">10-Year Compounding</div>
                  <div className="text-lg font-black text-emerald-600 tabular-nums">
                    {formatINR(Math.round(netWorth * 3.1))}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Debt Surcharge</div>
                  <div className="text-lg font-black text-red-600 tabular-nums">
                    {debtAccumulated === 0 ? '₹0 (Zero Debt!)' : `-${formatINR(debtAccumulated)}`}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setShowGuidanceModal(true);
                    setActiveGuideTab('easyjobs');
                    fetchPortalJobs();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Find Real Side Jobs via Google (Naukri, RemoteOK, Internshala)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => startGame()}
                    className="flex-1 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-[#172554] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Another Year</span>
                  </button>

                  {onExitGame && (
                    <button
                      onClick={onExitGame}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Return to Budget Tool
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. FINANCIAL WISDOM & REAL JOB PORTAL GUIDE MODAL */}
      {showGuidanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0a2540]">
                    Plain-Language Money Master Guide
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Actionable instructions for everyday Indians • No complicated jargon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuidanceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-white px-6">
              {[
                { id: 'essentials', label: '1. Essentials (50%)', icon: ShieldCheck },
                { id: 'savings', label: '2. Savings (20%)', icon: PiggyBank },
                { id: 'investing', label: '3. Investing (30%)', icon: TrendingUp },
                { id: 'easyjobs', label: '4. Extra Money & Jobs', icon: Briefcase },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeGuideTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveGuideTab(tab.id as any);
                      if (tab.id === 'easyjobs' && jobs.length === 0) fetchPortalJobs();
                    }}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      active ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-[#425466]">
              {activeGuideTab === 'essentials' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <h4 className="font-extrabold text-blue-900 text-sm mb-1">
                      Rule 1: Cap Your "Needs" at 50% of Your Take-Home Pay
                    </h4>
                    <p className="text-blue-800 text-xs leading-relaxed">
                      If you make ₹60,000 in-hand every month, your total bills (rent, food, electricity, recharge, transport, basic health) should stay within <strong>₹30,000</strong>.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">🏠 Rent & Housing: Maximum 25% to 30%</strong>
                      <p className="text-xs text-slate-600">
                        Never spend more than 30% of your earnings on rent. If living in Mumbai or Bengaluru, consider sharing a flat or moving 2 metro stations further to save ₹8,000 every single month.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">🛒 Food & Ration: Buy Monthly Staples in Bulk</strong>
                      <p className="text-xs text-slate-600">
                        Avoid ordering 10-minute instant delivery for staples (rice, atta, cooking oil, spices). Ordering monthly bulk from D-Mart or a local mandi saves 25% to 40% on groceries.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">⚡ Bills & Subscriptions: Audit Every 3 Months</strong>
                      <p className="text-xs text-slate-600">
                        Cancel unused OTT subscriptions and swap expensive post-paid plans to standard annual pre-paid packs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'savings' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <h4 className="font-extrabold text-emerald-900 text-sm mb-1">
                      Rule 2: Build a 3 to 6-Month Emergency Cushion First
                    </h4>
                    <p className="text-emerald-800 text-xs leading-relaxed">
                      Put 20% of your salary (e.g. ₹12,000 on ₹60,000 salary) aside until you have at least <strong>₹1.5 Lakhs to ₹2 Lakhs</strong> stored for medical emergencies or job transitions.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">🏦 Where to keep your emergency fund?</strong>
                      <p className="text-xs text-slate-600">
                        <strong>Auto-Sweep Savings Account or Liquid Mutual Fund:</strong> Gives ~6.5% to 7% returns with zero lock-in and instant ATM withdrawal within seconds when an emergency strikes.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">🛡️ Get Separate Health Insurance Early</strong>
                      <p className="text-xs text-slate-600">
                        A basic ₹10 Lakh to ₹15 Lakh family floater health policy costs only ~₹700/month. It protects your life savings from getting wiped out by a single hospital visit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'investing' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                    <h4 className="font-extrabold text-purple-900 text-sm mb-1">
                      Rule 3: Where Everyday People Should Invest (30%)
                    </h4>
                    <p className="text-purple-800 text-xs leading-relaxed">
                      You don't need to pick individual stocks or stare at charts all day. The smartest, proven way is automated monthly SIPs.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">1. Nifty 50 Index Mutual Fund (60% of Investment)</strong>
                      <p className="text-xs text-slate-600">
                        Invests in India's top 50 biggest companies (TCS, Reliance, HDFC Bank, Infosys). Historically generates <strong>12% to 14% annual returns</strong> over 10+ years.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">2. Public Provident Fund - PPF (20% of Investment)</strong>
                      <p className="text-xs text-slate-600">
                        Backed 100% by the Government of India. 7.1% guaranteed tax-free return with EEE status. Completely immune to market crashes.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <strong className="text-[#0a2540] block mb-0.5">3. Sovereign Gold Bonds or Gold ETF (20% of Investment)</strong>
                      <p className="text-xs text-slate-600">
                        Protects your money against currency inflation and global rupee depreciation.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      ⚡ <strong>Compounding Math:</strong> An SIP of just <strong>₹5,000/month</strong> in an index fund at 12% CAGR turns into <strong>₹50 Lakhs in 20 years</strong>!
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === 'easyjobs' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Google-Grounding Job Search from Specific Portals
                      </span>
                      <button
                        onClick={() => fetchPortalJobs()}
                        disabled={loadingJobs}
                        className="text-[11px] px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer"
                      >
                        {loadingJobs ? 'Searching Portals...' : 'Refresh Jobs'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300">
                      We search live listings directly across <strong>Naukri, LinkedIn, Internshala, RemoteOK, and Wellfound</strong> for high-flexibility side gigs that boost your monthly savings.
                    </p>
                  </div>

                  {loadingJobs && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      <div className="w-6 h-6 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Searching Google for verified jobs on specific portals...
                    </div>
                  )}

                  {!loadingJobs && jobs.length > 0 && (
                    <div className="space-y-2.5">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#1e3a8a] transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-[#0a2540] text-xs sm:text-sm">
                                {job.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748b]">
                                <span>{job.company}</span>
                                <span>•</span>
                                <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  {job.portalName}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-[#1e3a8a] block">
                                {job.payRate}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {job.commitment}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              +₹{job.estimatedMonthlyBoost?.toLocaleString('en-IN')}/mo extra
                            </span>
                            <a
                              href={job.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1e3a8a] hover:text-[#172554]"
                            >
                              <span>Apply on {job.portalName}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {jobSources.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                      <span className="font-bold text-slate-600 block mb-1">
                        Live Job Portal Citations via Google:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {jobSources.slice(0, 4).map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1e3a8a] hover:underline flex items-center gap-1"
                          >
                            <span>{src.title || 'Job Portal'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowGuidanceModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1e3a8a] text-white text-xs font-bold hover:bg-[#172554] cursor-pointer"
              >
                Back to Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
