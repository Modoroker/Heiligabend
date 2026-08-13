import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, RotateCcw, Flame, Zap, Snowflake, Magnet, Volume2, VolumeX, Info } from 'lucide-react';

// ==========================================
// 1. GAME CONSTANTS & CONFIGURATION
// ==========================================
const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 600;
const HIGH_SCORE_KEY = 'heartcatch_highscore';
const SOUND_MUTED_KEY = 'heartcatch_sound_muted';

const GAME_CONFIG = {
  BASKET_WIDTH: 90,
  BASKET_HEIGHT: 48,
  BASKET_SPEED: 520,
  BASKET_LERP: 24,
  MAX_LIVES: 3,
  COMBO_2X_THRESHOLD: 5,
  COMBO_3X_THRESHOLD: 10,
  FEVER_DURATION: 7.0,
  MAGNET_DURATION: 6.0,
  FREEZE_DURATION: 4.5,
  MAGNET_INTERVAL_MIN: 14000,
  MAGNET_PITY_INTERVAL: 20000,
  MAGNET_SUCTION_FORCE: 5.2,
};

// Localized strings
const TEXTS = {
  TITLE: 'Herzen-Fangen Minispiel',
  POINTS: 'Punkte',
  HIGH_SCORE: 'Best',
  GAME_OVER: 'Spiel beendet',
  RETRY: 'Nochmal spielen',
  NEW_HIGH_SCORE: '✨ Neuer persönlicher Highscore! 👑',
  HINT: 'Fange bunte Herzen & meide gebrochene! 🎀',
  COMBO_2X: '🔥 2x COMBO!',
  COMBO_3X: '⚡ 3x FEVER MODE! 🌟',
  MAGNET_ACTIVE: '🧲 MAGNET AKTIV!',
  FREEZE_ACTIVE: '❄️ ZEITLUPE!',
};

// ==========================================
// 2. WEB AUDIO API SYNTHESIZER (100% Offline)
// ==========================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  }

  catchHeart() {
    this.playTone(523.25, 'sine', 0.12, 0.08); // C5
  }

  catchGold() {
    this.playTone(659.25, 'triangle', 0.18, 0.1); // E5
  }

  catchDiamond() {
    this.playTone(880.0, 'sine', 0.22, 0.12); // A5
    setTimeout(() => this.playTone(1046.5, 'sine', 0.2, 0.1), 60); // C6
  }

  catchLife() {
    this.playTone(587.33, 'triangle', 0.15, 0.1);
    setTimeout(() => this.playTone(880.0, 'triangle', 0.25, 0.12), 80);
  }

  powerUp() {
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.08), idx * 45);
    });
  }

  hitBroken() {
    this.playTone(130.81, 'sawtooth', 0.25, 0.15); // Low C3 thud
  }

  gameOver() {
    [392, 349.23, 329.63, 261.63].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.35, 0.1), idx * 100);
    });
  }
}

const sfx = new SoundEffects();

// ==========================================
// 3. CANVAS DRAWING HELPERS & POLYFILLS
// ==========================================

/**
 * Cross-browser rounded rectangle fallback (Safari < 16 polyfill)
 */
function drawRoundedRect(ctx, x, y, width, height, radii) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radii);
    return;
  }
  // Fallback implementation
  const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] || 0 : 4);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Reusable Aura Glow Disc
 */
function drawAura(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Crisp High-Contrast Vector Heart with Fallback Specular Highlight
 */
function drawVectorHeart(ctx, x, y, size, fillStyle, strokeColor = '#FFFFFF', lineWidth = 2.5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // Top left curve
  ctx.bezierCurveTo(-size / 2, -topCurveHeight, -size, size / 3, 0, size);
  // Top right curve
  ctx.bezierCurveTo(size, size / 3, size / 2, -topCurveHeight, 0, topCurveHeight);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  // Specular shine highlight (cross-browser without ctx.ellipse)
  ctx.save();
  ctx.translate(-size * 0.3, -size * 0.05);
  ctx.rotate(-Math.PI / 4);
  ctx.scale(1, 1.8);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Crisp Faceted Diamond Vector
 */
function drawVectorDiamond(ctx, x, y, size, fillStyle) {
  ctx.save();
  ctx.translate(x, y);
  const w = size * 0.9;
  const h = size * 0.85;

  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, 0);
  ctx.lineTo(0, h);
  ctx.lineTo(-w, 0);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner facets
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(0, h);
  ctx.moveTo(-w, 0);
  ctx.lineTo(w, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glint
  ctx.beginPath();
  ctx.arc(-w * 0.25, -h * 0.25, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

// Static function outside component to avoid recreation
function getGameOverLoveMessage(finalScore) {
  if (finalScore >= 350) return 'Unglaublich! Du hast mein ganzes Herz erobert! 👑❤️';
  if (finalScore >= 200) return 'Wundervoll gespielt! Du bist mein wertvollster Schatz. ✨💖';
  if (finalScore >= 100) return 'Toll gemacht, mein Schatz! Ich liebe dein Lächeln. 🌹';
  return 'Jeder Versuch ist wunderschön – genau wie du! ❤️';
}

// ==========================================
// 4. MAIN REACT COMPONENT
// ==========================================
export default function HeartCatchGame({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const highscoreTimeoutRef = useRef(null);

  // Safe localStorage reading
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [lives, setLives] = useState(GAME_CONFIG.MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [magnetActive, setMagnetActive] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [newHighScoreNotice, setNewHighScoreNotice] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Sync mute state with sound engine
  useEffect(() => {
    sfx.isMuted = isMuted;
    try {
      localStorage.setItem(SOUND_MUTED_KEY, String(isMuted));
    } catch {}
  }, [isMuted]);

  // Hide initial hint after 4 seconds
  useEffect(() => {
    if (isOpen) {
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Mutable Game State Ref for 60fps performance without unnecessary re-renders
  const gameStateRef = useRef({
    basketX: LOGICAL_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
    targetBasketX: LOGICAL_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
    basketWidth: GAME_CONFIG.BASKET_WIDTH,
    basketHeight: GAME_CONFIG.BASKET_HEIGHT,
    hearts: [],
    particles: [],
    popups: [],
    bgStars: [],
    lastSpawnTime: 0,
    lastMagnetSpawnTime: 0,
    keysPressed: { ArrowLeft: false, ArrowRight: false },
    score: 0,
    lives: GAME_CONFIG.MAX_LIVES,
    highScore: 0,
    combo: 0,
    feverTimeLeft: 0,
    magnetTimeLeft: 0,
    freezeTimeLeft: 0,
    isGameOver: false,
    isNewHighScore: false,
    gradientCache: null,
  });

  // Cached Background Stars
  const initBgStars = () => {
    const stars = [];
    for (let i = 0; i < 28; i++) {
      stars.push({
        x: Math.random() * LOGICAL_WIDTH,
        y: Math.random() * LOGICAL_HEIGHT,
        size: Math.random() * 1.6 + 1,
        speed: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    return stars;
  };

  // Reset Game
  const resetGame = useCallback(() => {
    let savedHighScore = 0;
    try {
      savedHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10) || 0;
    } catch {}

    const now = performance.now();
    gameStateRef.current = {
      basketX: LOGICAL_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
      targetBasketX: LOGICAL_WIDTH / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
      basketWidth: GAME_CONFIG.BASKET_WIDTH,
      basketHeight: GAME_CONFIG.BASKET_HEIGHT,
      hearts: [],
      particles: [],
      popups: [],
      bgStars: initBgStars(),
      lastSpawnTime: now,
      lastMagnetSpawnTime: now - 5000,
      keysPressed: { ArrowLeft: false, ArrowRight: false },
      score: 0,
      lives: GAME_CONFIG.MAX_LIVES,
      highScore: savedHighScore,
      combo: 0,
      feverTimeLeft: 0,
      magnetTimeLeft: 0,
      freezeTimeLeft: 0,
      isGameOver: false,
      isNewHighScore: false,
      gradientCache: null,
    };

    setScore(0);
    setLives(GAME_CONFIG.MAX_LIVES);
    setCombo(0);
    setIsFever(false);
    setMagnetActive(false);
    setFreezeActive(false);
    setIsGameOver(false);
    setNewHighScoreNotice(false);
    setHighScore(savedHighScore);
  }, []);

  // Update Score & Check Highscore with React State Throttling
  const updateScoreAndCheckHighscore = useCallback((addedPoints) => {
    const state = gameStateRef.current;
    let multiplier = 1;
    if (state.feverTimeLeft > 0 || state.combo >= GAME_CONFIG.COMBO_3X_THRESHOLD) {
      multiplier = 3;
    } else if (state.combo >= GAME_CONFIG.COMBO_2X_THRESHOLD) {
      multiplier = 2;
    }

    const finalPoints = addedPoints > 0 ? addedPoints * multiplier : addedPoints;
    state.score = Math.max(0, state.score + finalPoints);
    setScore(state.score);

    if (state.score > state.highScore) {
      state.highScore = state.score;
      setHighScore(state.score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(state.score));
      } catch {}

      if (!state.isNewHighScore) {
        state.isNewHighScore = true;
        setNewHighScoreNotice(true);
        if (highscoreTimeoutRef.current) clearTimeout(highscoreTimeoutRef.current);
        highscoreTimeoutRef.current = setTimeout(() => setNewHighScoreNotice(false), 2200);
      }
    }
  }, []);

  // Particles
  const createParticles = useCallback((x, y, color, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * 160 + 60;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 2,
        color,
        alpha: 1.0,
        life: Math.random() * 0.35 + 0.35,
      });
    }
  }, []);

  // Popups
  const addPopup = useCallback((text, x, y, color) => {
    gameStateRef.current.popups.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 0.8,
      scale: 1.0,
    });
  }, []);

  // Spawn Items Logic with Balanced Magnet Interval & Variety
  const spawnHeart = useCallback((nowTime) => {
    const state = gameStateRef.current;
    const currentScore = state.score;
    const isFrozen = state.freezeTimeLeft > 0;
    const isFeverNow = state.feverTimeLeft > 0;

    const baseInterval = isFeverNow ? 400 : Math.max(450, 1050 - Math.floor(currentScore / 100) * 45);
    const spawnInterval = isFrozen ? baseInterval * 1.4 : baseInterval;

    if (nowTime - state.lastSpawnTime < spawnInterval) return;
    state.lastSpawnTime = nowTime;

    const rand = Math.random();
    let type = 'classic';
    let size = 32;
    let speedMult = 1.0;
    let points = 10;

    // Magnet Spawn Pacing
    const timeSinceLastMagnet = nowTime - (state.lastMagnetSpawnTime || 0);
    const isMagnetActive = state.magnetTimeLeft > 0;
    const magnetPityTrigger = !isMagnetActive && timeSinceLastMagnet >= GAME_CONFIG.MAGNET_PITY_INTERVAL;
    const magnetCooldownPassed = !isMagnetActive && timeSinceLastMagnet >= GAME_CONFIG.MAGNET_INTERVAL_MIN;

    if (magnetPityTrigger || (magnetCooldownPassed && Math.random() < 0.08)) {
      type = 'magnet';
      size = 32;
      speedMult = 1.15;
      points = 15;
      state.lastMagnetSpawnTime = nowTime;
    } else if (isFeverNow && rand < 0.65) {
      type = rand < 0.35 ? 'diamond' : 'gold';
      size = 34;
      speedMult = 1.3;
      points = type === 'diamond' ? 50 : 25;
    } else if (rand < 0.60) {
      type = 'classic'; // 60%
      size = 32;
      speedMult = 1.0;
      points = 10;
    } else if (rand < 0.76) {
      type = 'gold'; // 16%
      size = 33;
      speedMult = 1.3;
      points = 25;
    } else if (rand < 0.84) {
      type = 'diamond'; // 8%
      size = 30;
      speedMult = 1.5;
      points = 50;
    } else if (rand < 0.92) {
      type = 'broken'; // 8%
      size = 34;
      speedMult = 0.95;
      points = -10;
    } else if (rand < 0.96) {
      type = 'freeze'; // 4%
      size = 30;
      speedMult = 1.1;
      points = 15;
    } else {
      type = 'emerald'; // 4%
      size = 28;
      speedMult = 1.6;
      points = 30;
    }

    const baseSpeed = Math.min(360, 170 + Math.floor(currentScore / 140) * 15);
    const finalSpeed = isFrozen ? baseSpeed * speedMult * 0.5 : baseSpeed * speedMult;
    const x = Math.random() * (LOGICAL_WIDTH - 70) + 35;

    state.hearts.push({
      id: Math.random(),
      type,
      x,
      y: -35,
      size,
      speed: finalSpeed,
      points,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2.0,
    });
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (!isOpen) return;

    resetGame();
    let animationFrameId;
    let lastFrameTime = performance.now();

    // Cache static gradients once on canvas context
    const getCachedGradients = (ctx) => {
      const state = gameStateRef.current;
      if (state.gradientCache) return state.gradientCache;

      const redGrad = ctx.createLinearGradient(0, -18, 0, 18);
      redGrad.addColorStop(0, '#FF4D6D');
      redGrad.addColorStop(0.5, '#FF0055');
      redGrad.addColorStop(1, '#C90038');

      const goldGrad = ctx.createLinearGradient(0, -18, 0, 18);
      goldGrad.addColorStop(0, '#FFF9A6');
      goldGrad.addColorStop(0.4, '#FFD700');
      goldGrad.addColorStop(1, '#F59E0B');

      const greenGrad = ctx.createLinearGradient(0, -16, 0, 16);
      greenGrad.addColorStop(0, '#B9F6CA');
      greenGrad.addColorStop(0.5, '#00E676');
      greenGrad.addColorStop(1, '#00C853');

      const diamondGrad = ctx.createLinearGradient(0, -18, 0, 18);
      diamondGrad.addColorStop(0, '#FFFFFF');
      diamondGrad.addColorStop(0.3, '#A5F3FC');
      diamondGrad.addColorStop(0.7, '#00E5FF');
      diamondGrad.addColorStop(1, '#0284C7');

      const bgGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      bgGrad.addColorStop(0, '#060A17');
      bgGrad.addColorStop(0.5, '#0B132B');
      bgGrad.addColorStop(1, '#111827');

      state.gradientCache = { redGrad, goldGrad, greenGrad, diamondGrad, bgGrad };
      return state.gradientCache;
    };

    const updateAndRender = (currentTime) => {
      const dt = Math.min(0.064, (currentTime - lastFrameTime) / 1000);
      lastFrameTime = currentTime;

      const state = gameStateRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crisp High-DPI Resolution Scaling
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const displayW = Math.floor(rect.width || LOGICAL_WIDTH);
      const displayH = Math.floor(rect.height || LOGICAL_HEIGHT);

      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        state.gradientCache = null; // Recreate gradients if canvas dimensions resize
      }

      if (state.isGameOver) return;

      // 1. Update Timers & Power-Ups
      if (state.feverTimeLeft > 0) {
        state.feverTimeLeft -= dt;
        if (state.feverTimeLeft <= 0) {
          state.feverTimeLeft = 0;
          setIsFever(false);
        }
      }
      if (state.magnetTimeLeft > 0) {
        state.magnetTimeLeft -= dt;
        if (state.magnetTimeLeft <= 0) {
          state.magnetTimeLeft = 0;
          setMagnetActive(false);
        }
      }
      if (state.freezeTimeLeft > 0) {
        state.freezeTimeLeft -= dt;
        if (state.freezeTimeLeft <= 0) {
          state.freezeTimeLeft = 0;
          setFreezeActive(false);
        }
      }

      // 2. Update Basket Movement
      if (state.keysPressed.ArrowLeft) {
        state.basketX = Math.max(0, state.basketX - GAME_CONFIG.BASKET_SPEED * dt);
        state.targetBasketX = state.basketX;
      } else if (state.keysPressed.ArrowRight) {
        state.basketX = Math.min(LOGICAL_WIDTH - state.basketWidth, state.basketX + GAME_CONFIG.BASKET_SPEED * dt);
        state.targetBasketX = state.basketX;
      } else {
        const clampedTarget = Math.max(0, Math.min(LOGICAL_WIDTH - state.basketWidth, state.targetBasketX));
        state.basketX += (clampedTarget - state.basketX) * Math.min(1.0, GAME_CONFIG.BASKET_LERP * dt);
      }

      // 3. Spawn Items
      spawnHeart(currentTime);

      // 4. Update Hearts & Collision
      const basketCenterX = state.basketX + state.basketWidth / 2;
      const basketTop = LOGICAL_HEIGHT - 56;
      const basketBottom = LOGICAL_HEIGHT - 10;

      for (let i = state.hearts.length - 1; i >= 0; i--) {
        const item = state.hearts[i];

        // Magnet Power-Up Attraction
        if (state.magnetTimeLeft > 0 && item.type !== 'broken' && item.y > 80) {
          const dx = basketCenterX - item.x;
          item.x += dx * GAME_CONFIG.MAGNET_SUCTION_FORCE * dt;
        }

        const currentSpeed = state.freezeTimeLeft > 0 ? item.speed * 0.5 : item.speed;
        item.y += currentSpeed * dt;
        item.rotation += item.rotationSpeed * dt;

        // Catch Collision
        const inHorizontalRange = item.x >= state.basketX - 12 && item.x <= state.basketX + state.basketWidth + 12;
        const inVerticalRange = item.y >= basketTop - 12 && item.y <= basketBottom;

        if (inHorizontalRange && inVerticalRange) {
          state.hearts.splice(i, 1);

          if (item.type === 'broken') {
            sfx.hitBroken();
            state.combo = 0;
            state.feverTimeLeft = 0;
            setCombo(0);
            setIsFever(false);

            updateScoreAndCheckHighscore(item.points);
            state.lives -= 1;
            setLives(state.lives);

            addPopup('-10 💔', item.x, item.y, '#FF3333');
            createParticles(item.x, item.y, '#FF0033', 18);

            if (state.lives <= 0) {
              sfx.gameOver();
              state.isGameOver = true;
              setIsGameOver(true);
            }
          } else {
            state.combo += 1;
            setCombo(state.combo);

            if (state.combo === GAME_CONFIG.COMBO_2X_THRESHOLD) {
              sfx.powerUp();
              addPopup(TEXTS.COMBO_2X, basketCenterX, basketTop - 40, '#FFB703');
              createParticles(basketCenterX, basketTop, '#FFB703', 20);
            } else if (state.combo >= GAME_CONFIG.COMBO_3X_THRESHOLD && state.feverTimeLeft <= 0) {
              sfx.powerUp();
              state.feverTimeLeft = GAME_CONFIG.FEVER_DURATION;
              setIsFever(true);
              addPopup(TEXTS.COMBO_3X, basketCenterX, basketTop - 40, '#FF0055');
              createParticles(basketCenterX, basketTop, '#FFD700', 32);
            }

            if (item.type === 'classic') {
              sfx.catchHeart();
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points}`, item.x, item.y, '#FF0055');
              createParticles(item.x, item.y, '#FF0055', 14);
            } else if (item.type === 'gold') {
              sfx.catchGold();
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points} ⭐`, item.x, item.y, '#FFD700');
              createParticles(item.x, item.y, '#FFD700', 16);
            } else if (item.type === 'diamond') {
              sfx.catchDiamond();
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points} 💎`, item.x, item.y, '#00E5FF');
              createParticles(item.x, item.y, '#00E5FF', 24);
            } else if (item.type === 'emerald') {
              sfx.catchLife();
              updateScoreAndCheckHighscore(item.points);
              const nextLives = Math.min(GAME_CONFIG.MAX_LIVES, state.lives + 1);
              state.lives = nextLives;
              setLives(nextLives);
              addPopup('+1 ❤️', item.x, item.y, '#00FF66');
              createParticles(item.x, item.y, '#00FF66', 18);
            } else if (item.type === 'magnet') {
              sfx.powerUp();
              state.magnetTimeLeft = GAME_CONFIG.MAGNET_DURATION;
              state.lastMagnetSpawnTime = performance.now();
              setMagnetActive(true);
              updateScoreAndCheckHighscore(item.points);
              addPopup(TEXTS.MAGNET_ACTIVE, item.x, item.y, '#C084FC');
              createParticles(item.x, item.y, '#C084FC', 22);
            } else if (item.type === 'freeze') {
              sfx.powerUp();
              state.freezeTimeLeft = GAME_CONFIG.FREEZE_DURATION;
              setFreezeActive(true);
              updateScoreAndCheckHighscore(item.points);
              addPopup(TEXTS.FREEZE_ACTIVE, item.x, item.y, '#38BDF8');
              createParticles(item.x, item.y, '#38BDF8', 20);
            }
          }
          continue;
        }

        // Missed item logic - all missed good items reset combo!
        if (item.y > LOGICAL_HEIGHT + 25) {
          state.hearts.splice(i, 1);

          if (item.type === 'classic') {
            state.combo = 0;
            setCombo(0);
            state.lives -= 1;
            setLives(state.lives);

            if (state.lives <= 0) {
              sfx.gameOver();
              state.isGameOver = true;
              setIsGameOver(true);
            }
          } else if (item.type === 'gold' || item.type === 'diamond') {
            // Missing rare items breaks combo to prevent skipping normal hearts
            state.combo = 0;
            setCombo(0);
          }
        }
      }

      // 5. Update Particles & Popups
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt / p.life;
        if (p.alpha <= 0) state.particles.splice(i, 1);
      }

      for (let i = state.popups.length - 1; i >= 0; i--) {
        const pop = state.popups[i];
        pop.y -= 45 * dt;
        pop.alpha -= dt / pop.life;
        pop.scale += 0.25 * dt;
        if (pop.alpha <= 0) state.popups.splice(i, 1);
      }

      // Background stars
      state.bgStars.forEach((star) => {
        star.y += star.speed * 18 * dt;
        if (star.y > LOGICAL_HEIGHT) star.y = 0;
      });

      // 6. RENDER CANVAS
      ctx.save();
      ctx.scale((displayW / LOGICAL_WIDTH) * dpr, (displayH / LOGICAL_HEIGHT) * dpr);

      const grads = getCachedGradients(ctx);

      // Background
      ctx.fillStyle = grads.bgGrad;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Stars
      state.bgStars.forEach((star) => {
        const pulse = Math.sin((currentTime / 1000) * star.twinkleSpeed) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 240, 200, ${star.opacity * pulse})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Icy Frame on Freeze
      if (state.freezeTimeLeft > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, LOGICAL_WIDTH - 6, LOGICAL_HEIGHT - 6);
      }

      // Render Falling Items
      state.hearts.forEach((h) => {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);

        if (h.type === 'classic') {
          drawAura(ctx, 0, 0, 22, 'rgba(255, 0, 85, 0.25)');
          drawVectorHeart(ctx, 0, -10, 20, grads.redGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'gold') {
          drawAura(ctx, 0, 0, 24, 'rgba(255, 215, 0, 0.3)');
          drawVectorHeart(ctx, 0, -10, 21, grads.goldGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'diamond') {
          drawAura(ctx, 0, 0, 24, 'rgba(0, 229, 255, 0.35)');
          drawVectorDiamond(ctx, 0, 0, 20, grads.diamondGrad);
        } else if (h.type === 'broken') {
          drawAura(ctx, 0, 0, 22, 'rgba(239, 68, 68, 0.3)');
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 19, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💔', 0, 0);
        } else if (h.type === 'emerald') {
          drawAura(ctx, 0, 0, 22, 'rgba(0, 255, 102, 0.35)');
          drawVectorHeart(ctx, 0, -8, 17, grads.greenGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'magnet') {
          drawAura(ctx, 0, 0, 22, 'rgba(192, 132, 252, 0.35)');
          ctx.fillStyle = '#7C3AED';
          ctx.strokeStyle = '#F3E8FF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', 0, 1);
        } else if (h.type === 'freeze') {
          drawAura(ctx, 0, 0, 22, 'rgba(56, 189, 248, 0.35)');
          ctx.fillStyle = '#0284C7';
          ctx.strokeStyle = '#E0F2FE';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❄️', 0, 1);
        }

        ctx.restore();
      });

      // Render Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Popups
      state.popups.forEach((pop) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.alpha);
        ctx.fillStyle = pop.color;
        ctx.font = `bold ${Math.round(18 * pop.scale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#050814';
        ctx.lineWidth = 3.5;
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      // Render Basket
      const bX = state.basketX;
      const bY = LOGICAL_HEIGHT - 54;
      const bW = state.basketWidth;
      const bH = state.basketHeight;

      const basketGrad = ctx.createLinearGradient(bX, bY, bX, bY + bH);
      basketGrad.addColorStop(0, '#FCE7F3');
      basketGrad.addColorStop(0.3, '#E8B4B8');
      basketGrad.addColorStop(0.7, '#D4AF37');
      basketGrad.addColorStop(1, '#831843');

      ctx.fillStyle = basketGrad;
      ctx.strokeStyle = state.feverTimeLeft > 0 ? '#FFD700' : state.magnetTimeLeft > 0 ? '#C084FC' : '#FFFBEB';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, bX, bY, bW, bH, [4, 4, 18, 18]);
      ctx.fill();
      ctx.stroke();

      // Golden Top Lip
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bX - 3, bY, bW + 6, 6);

      // Center Icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      if (state.magnetTimeLeft > 0) {
        ctx.fillText('🧲', bX + bW / 2, bY + bH / 2 + 8);
      } else if (state.feverTimeLeft > 0) {
        ctx.fillText('🔥', bX + bW / 2, bY + bH / 2 + 8);
      } else if (state.freezeTimeLeft > 0) {
        ctx.fillText('❄️', bX + bW / 2, bY + bH / 2 + 8);
      } else {
        ctx.fillText('🎀', bX + bW / 2, bY + bH / 2 + 8);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (highscoreTimeoutRef.current) clearTimeout(highscoreTimeoutRef.current);
    };
  }, [isOpen, resetGame, spawnHeart, updateScoreAndCheckHighscore, createParticles, addPopup]);

  // Tab visibility change & Window Blur listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        gameStateRef.current.keysPressed.ArrowLeft = false;
        gameStateRef.current.keysPressed.ArrowRight = false;
      }
    };

    const handleBlur = () => {
      gameStateRef.current.keysPressed.ArrowLeft = false;
      gameStateRef.current.keysPressed.ArrowRight = false;
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        gameStateRef.current.keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        gameStateRef.current.keysPressed[e.key] = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={TEXTS.TITLE}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-midnight-950/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-sm aspect-[400/600] rounded-3xl overflow-hidden shadow-2xl border-2 border-rosegold-400/50 bg-midnight-900 flex flex-col justify-between select-none"
        >
          {/* Screenreader Accessible Game Live Region */}
          <div className="sr-only" aria-live="polite">
            {isGameOver
              ? `Spiel beendet! Punktzahl: ${score}, Bester Highscore: ${highScore}`
              : `Punkte: ${score}, Leben: ${lives}, Serie: ${combo}`}
          </div>

          {/* Header HUD Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-midnight-900/95 border-b border-rosegold-500/30">
            {/* Left Actions: Lives & In-Game Reset Button */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-midnight-800 px-2 py-1 rounded-full text-xs font-bold border border-slate-700">
                {[1, 2, 3].map((heartNum) => (
                  <span key={heartNum} className="text-sm">
                    {heartNum <= lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>

              <button
                onClick={resetGame}
                aria-label="Spiel neu starten"
                className="p-1.5 rounded-full bg-midnight-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Neu starten"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Ton einschalten' : 'Ton stummschalten'}
                className={`p-1.5 rounded-full border transition-colors ${
                  isMuted
                    ? 'bg-midnight-800 text-slate-500 border-slate-700'
                    : 'bg-rosegold-500/20 text-rosegold-300 border-rosegold-500/40'
                }`}
                title={isMuted ? 'Ton an' : 'Stumm'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Power-up / Combo Status Badges */}
            <div className="flex items-center gap-1">
              {isFever && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                  <Flame className="w-3 h-3 text-amber-400" /> 3x Fever
                </span>
              )}
              {combo >= GAME_CONFIG.COMBO_2X_THRESHOLD && !isFever && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                  <Zap className="w-3 h-3 text-rose-400" /> {combo}x
                </span>
              )}
              {magnetActive && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 animate-pulse">
                  <Magnet className="w-3 h-3 text-purple-400" />
                </span>
              )}
              {freezeActive && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse">
                  <Snowflake className="w-3 h-3 text-cyan-400" />
                </span>
              )}
            </div>

            {/* Right: Score & Close */}
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-bold text-champagne-300 tracking-tight">
                  {TEXTS.POINTS}: {score}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {TEXTS.HIGH_SCORE}: {highScore}
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Spiel schließen"
                className="p-1.5 rounded-full bg-midnight-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Spiel schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Initial Quick Hint Banner */}
          {showHint && !isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 inset-x-6 z-20 bg-midnight-800/90 border border-rosegold-500/40 text-rosegold-200 text-center py-1.5 px-3 rounded-2xl shadow-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-champagne-300" /> {TEXTS.HINT}
            </motion.div>
          )}

          {/* New Highscore Banner */}
          {newHighScoreNotice && (
            <div className="absolute top-16 inset-x-6 z-20 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-center py-1.5 rounded-2xl shadow-lg animate-bounce text-xs">
              {TEXTS.NEW_HIGH_SCORE}
            </div>
          )}

          {/* Main Game Canvas Container */}
          <div
            ref={containerRef}
            className="w-full h-full relative cursor-none touch-none"
            onMouseMove={(e) => {
              const container = containerRef.current;
              if (!container) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.targetBasketX = (e.clientX - rect.left) * scaleX - GAME_CONFIG.BASKET_WIDTH / 2;
            }}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - GAME_CONFIG.BASKET_WIDTH / 2;
            }}
            onTouchStart={(e) => {
              if (e.cancelable) e.preventDefault();
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - GAME_CONFIG.BASKET_WIDTH / 2;
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* Luxury Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-30 bg-midnight-950/95 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-5xl mb-2 animate-bounce">💖</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-champagne-300 mb-1">
                {TEXTS.GAME_OVER}
              </h2>
              <p className="text-xs text-rosegold-200 mb-5 font-medium max-w-xs px-2 italic">
                "{getGameOverLoveMessage(score)}"
              </p>

              {/* Stats Card */}
              <div className="bg-midnight-900 rounded-2xl p-4 w-full max-w-xs border border-rosegold-500/40 shadow-xl space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span>Deine {TEXTS.POINTS}:</span>
                  <span className="text-base font-bold font-mono text-champagne-300">{score}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 border-t border-slate-800 pt-2">
                  <span>{TEXTS.HIGH_SCORE}:</span>
                  <span className="text-base font-bold font-mono text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {highScore}
                  </span>
                </div>
              </div>

              {/* Retry Button */}
              <button
                onClick={resetGame}
                className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-900 font-bold shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> {TEXTS.RETRY}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
