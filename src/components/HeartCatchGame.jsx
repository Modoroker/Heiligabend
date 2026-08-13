import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trophy, RotateCcw, Sparkles, Flame, Zap, Snowflake, Magnet } from 'lucide-react';

const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 600;
const HIGH_SCORE_KEY = 'heartcatch_highscore';

// Helper to draw a crisp vector heart
function drawVectorHeart(ctx, x, y, size, fillGrad, strokeColor, lineWidth = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // Top left curve
  ctx.bezierCurveTo(
    -size / 2, -topCurveHeight,
    -size, size / 3,
    0, size
  );
  // Top right curve
  ctx.bezierCurveTo(
    size, size / 3,
    size / 2, -topCurveHeight,
    0, topCurveHeight
  );
  ctx.closePath();
  ctx.fillStyle = fillGrad;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  // Specular white shine highlight
  ctx.beginPath();
  ctx.ellipse(-size * 0.32, 0, size * 0.14, size * 0.26, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  ctx.restore();
}

// Helper to draw a crisp faceted diamond
function drawVectorDiamond(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const w = size * 0.9;
  const h = size * 0.85;

  // Outer Diamond Shape
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, 0);
  ctx.lineTo(0, h);
  ctx.lineTo(-w, 0);
  ctx.closePath();

  const diamondGrad = ctx.createLinearGradient(0, -h, 0, h);
  diamondGrad.addColorStop(0, '#FFFFFF');
  diamondGrad.addColorStop(0.3, '#A5F3FC');
  diamondGrad.addColorStop(0.7, '#00E5FF');
  diamondGrad.addColorStop(1, '#0284C7');
  ctx.fillStyle = diamondGrad;
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Sparkling Glint
  ctx.beginPath();
  ctx.arc(-w * 0.25, -h * 0.25, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

export default function HeartCatchGame({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [magnetActive, setMagnetActive] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [newHighScoreNotice, setNewHighScoreNotice] = useState(false);

  // Mutable Game State Ref for smooth 60fps canvas loop
  const gameStateRef = useRef({
    basketX: LOGICAL_WIDTH / 2 - 45,
    targetBasketX: LOGICAL_WIDTH / 2 - 45,
    basketWidth: 90,
    basketHeight: 48,
    hearts: [],
    particles: [],
    popups: [],
    bgStars: [],
    lastSpawnTime: 0,
    lastMagnetSpawnTime: 0,
    keysPressed: { ArrowLeft: false, ArrowRight: false },
    score: 0,
    lives: 3,
    highScore: 0,
    combo: 0,
    feverTimeLeft: 0,
    magnetTimeLeft: 0,
    freezeTimeLeft: 0,
    isGameOver: false,
    isNewHighScore: false,
    inputMode: 'none',
  });

  // Generate background ambient stars
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
    const savedHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    const now = performance.now();
    gameStateRef.current = {
      basketX: LOGICAL_WIDTH / 2 - 45,
      targetBasketX: LOGICAL_WIDTH / 2 - 45,
      basketWidth: 90,
      basketHeight: 48,
      hearts: [],
      particles: [],
      popups: [],
      bgStars: initBgStars(),
      lastSpawnTime: now,
      lastMagnetSpawnTime: now - 5000, // First magnet can appear after ~15s
      keysPressed: { ArrowLeft: false, ArrowRight: false },
      score: 0,
      lives: 3,
      highScore: savedHighScore,
      combo: 0,
      feverTimeLeft: 0,
      magnetTimeLeft: 0,
      freezeTimeLeft: 0,
      isGameOver: false,
      isNewHighScore: false,
      inputMode: 'none',
    };
    setScore(0);
    setLives(3);
    setCombo(0);
    setIsFever(false);
    setMagnetActive(false);
    setFreezeActive(false);
    setIsGameOver(false);
    setNewHighScoreNotice(false);
    setHighScore(savedHighScore);
  }, []);

  // Update Score & Check Highscore
  const updateScoreAndCheckHighscore = useCallback((addedPoints) => {
    const state = gameStateRef.current;
    
    // Multipliers: Combo x2 at 5+, Fever x3 at 10+
    let multiplier = 1;
    if (state.feverTimeLeft > 0 || state.combo >= 10) {
      multiplier = 3;
    } else if (state.combo >= 5) {
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
      } catch (e) {
        console.error(e);
      }
      if (!state.isNewHighScore) {
        state.isNewHighScore = true;
        setNewHighScoreNotice(true);
        setTimeout(() => setNewHighScoreNotice(false), 2200);
      }
    }
  }, []);

  // Particle Explosions
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

  // Add Score or Text Popup
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

  // Spawn Items with Balanced Magnet Pacing & Variety
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

    // --- Magnet Spawn Control (15-20s Pacing, No Duplicates) ---
    const timeSinceLastMagnet = nowTime - (state.lastMagnetSpawnTime || 0);
    const isMagnetActive = state.magnetTimeLeft > 0;
    const magnetPityTrigger = !isMagnetActive && timeSinceLastMagnet >= 20000;
    const magnetCooldownPassed = !isMagnetActive && timeSinceLastMagnet >= 14000;

    if (magnetPityTrigger || (magnetCooldownPassed && Math.random() < 0.08)) {
      type = 'magnet'; // Guaranteed regular magnet drop every 15-20s!
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
      type = 'classic'; // 60% Ultra-Vivid Red Heart
      size = 32;
      speedMult = 1.0;
      points = 10;
    } else if (rand < 0.76) {
      type = 'gold'; // 16% Radiant Gold Heart
      size = 33;
      speedMult = 1.3;
      points = 25;
    } else if (rand < 0.84) {
      type = 'diamond'; // 8% Brilliant Diamond
      size = 30;
      speedMult = 1.5;
      points = 50;
    } else if (rand < 0.92) {
      type = 'broken'; // 8% Danger Dark Broken Heart
      size = 34;
      speedMult = 0.95;
      points = -10;
    } else if (rand < 0.96) {
      type = 'freeze'; // 4% Ice Crystal ❄️
      size = 30;
      speedMult = 1.1;
      points = 15;
    } else {
      type = 'emerald'; // 4% Emerald Life Bonus Heart 💚
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
      }

      if (state.isGameOver) return;

      // --- 1. UPDATE TIMERS & POWER-UPS ---
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

      // --- 2. UPDATE BASKET POSITION ---
      if (state.keysPressed.ArrowLeft) {
        state.basketX = Math.max(0, state.basketX - 520 * dt);
        state.targetBasketX = state.basketX;
      } else if (state.keysPressed.ArrowRight) {
        state.basketX = Math.min(LOGICAL_WIDTH - state.basketWidth, state.basketX + 520 * dt);
        state.targetBasketX = state.basketX;
      } else {
        const clampedTarget = Math.max(0, Math.min(LOGICAL_WIDTH - state.basketWidth, state.targetBasketX));
        state.basketX += (clampedTarget - state.basketX) * Math.min(1.0, 24 * dt);
      }

      // --- 3. SPAWN ITEMS ---
      spawnHeart(currentTime);

      // --- 4. UPDATE HEARTS & COLLISION DETECTION ---
      const basketCenterX = state.basketX + state.basketWidth / 2;
      const basketTop = LOGICAL_HEIGHT - 56;
      const basketBottom = LOGICAL_HEIGHT - 10;

      for (let i = state.hearts.length - 1; i >= 0; i--) {
        const item = state.hearts[i];
          // Magnet Power-Up: Pulls good items straight into basket
        if (state.magnetTimeLeft > 0 && item.type !== 'broken' && item.y > 80) {
          const dx = basketCenterX - item.x;
          item.x += dx * 5.2 * dt;
        }

        // Apply movement
        const currentSpeed = state.freezeTimeLeft > 0 ? item.speed * 0.5 : item.speed;
        item.y += currentSpeed * dt;
        item.rotation += item.rotationSpeed * dt;

        // Collision Check with Basket
        const inHorizontalRange = item.x >= state.basketX - 12 && item.x <= state.basketX + state.basketWidth + 12;
        const inVerticalRange = item.y >= basketTop - 12 && item.y <= basketBottom;

        if (inHorizontalRange && inVerticalRange) {
          state.hearts.splice(i, 1);

          if (item.type === 'broken') {
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
              state.isGameOver = true;
              setIsGameOver(true);
            }
          } else {
            state.combo += 1;
            setCombo(state.combo);

            if (state.combo === 5) {
              addPopup('🔥 2x COMBO!', basketCenterX, basketTop - 40, '#FFB703');
              createParticles(basketCenterX, basketTop, '#FFB703', 20);
            } else if (state.combo >= 10 && state.feverTimeLeft <= 0) {
              state.feverTimeLeft = 6.0;
              setIsFever(true);
              addPopup('⚡ 3x FEVER MODE! 🌟', basketCenterX, basketTop - 40, '#FF0055');
              createParticles(basketCenterX, basketTop, '#FFD700', 32);
            }

            if (item.type === 'classic') {
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points}`, item.x, item.y, '#FF0055');
              createParticles(item.x, item.y, '#FF0055', 14);
            } else if (item.type === 'gold') {
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points} ⭐`, item.x, item.y, '#FFD700');
              createParticles(item.x, item.y, '#FFD700', 16);
            } else if (item.type === 'diamond') {
              updateScoreAndCheckHighscore(item.points);
              addPopup(`+${item.points} 💎`, item.x, item.y, '#00E5FF');
              createParticles(item.x, item.y, '#00E5FF', 24);
            } else if (item.type === 'emerald') {
              updateScoreAndCheckHighscore(item.points);
              const nextLives = Math.min(3, state.lives + 1);
              state.lives = nextLives;
              setLives(nextLives);
              addPopup('+1 ❤️', item.x, item.y, '#00FF66');
              createParticles(item.x, item.y, '#00FF66', 18);
            } else if (item.type === 'magnet') {
              state.magnetTimeLeft = 6.0;
              state.lastMagnetSpawnTime = performance.now();
              setMagnetActive(true);
              updateScoreAndCheckHighscore(item.points);
              addPopup('🧲 MAGNET AKTIV!', item.x, item.y, '#C084FC');
              createParticles(item.x, item.y, '#C084FC', 22);
            } else if (item.type === 'freeze') {
              state.freezeTimeLeft = 4.0;
              setFreezeActive(true);
              updateScoreAndCheckHighscore(item.points);
              addPopup('❄️ ZEITLUPE!', item.x, item.y, '#38BDF8');
              createParticles(item.x, item.y, '#38BDF8', 20);
            }
          }
          continue;
        }

        // Missed item
        if (item.y > LOGICAL_HEIGHT + 25) {
          state.hearts.splice(i, 1);

          if (item.type === 'classic') {
            state.combo = 0;
            setCombo(0);
            state.lives -= 1;
            setLives(state.lives);

            if (state.lives <= 0) {
              state.isGameOver = true;
              setIsGameOver(true);
            }
          }
        }
      }

      // --- 5. UPDATE PARTICLES & POPUPS ---
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

      // Background stars animation
      state.bgStars.forEach((star) => {
        star.y += star.speed * 18 * dt;
        if (star.y > LOGICAL_HEIGHT) star.y = 0;
      });

      // --- 6. RENDER CANVAS (Ultra-Vivid, Maximum Contrast & Crystal Sharp) ---
      ctx.save();
      ctx.scale((displayW / LOGICAL_WIDTH) * dpr, (displayH / LOGICAL_HEIGHT) * dpr);

      // Crisp Midnight Blue Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      bgGrad.addColorStop(0, '#060A17');
      bgGrad.addColorStop(0.5, '#0B132B');
      bgGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Render Crisp Twinkling Stars
      state.bgStars.forEach((star) => {
        const pulse = Math.sin(currentTime / 1000 * star.twinkleSpeed) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 240, 200, ${star.opacity * pulse})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Icy Crisp Frame on Freeze Mode (NO dark wash over playfield!)
      if (state.freezeTimeLeft > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, LOGICAL_WIDTH - 6, LOGICAL_HEIGHT - 6);
      }

      // --- 7. RENDER ULTRA-VIVID FALLING ITEMS ---
      state.hearts.forEach((h) => {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);

        if (h.type === 'classic') {
          // ❤️ ULTRA-VIVID RUBY RED HEART (Bright vector with radiant outline)
          // Radiant aura underlay
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
          ctx.fill();

          const redGrad = ctx.createLinearGradient(0, -18, 0, 18);
          redGrad.addColorStop(0, '#FF4D6D');
          redGrad.addColorStop(0.5, '#FF0055');
          redGrad.addColorStop(1, '#C90038');
          drawVectorHeart(ctx, 0, -10, 20, redGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'gold') {
          // 💛 RADIANT GOLDEN STAR HEART (Bright sunny gold)
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fill();

          const goldGrad = ctx.createLinearGradient(0, -18, 0, 18);
          goldGrad.addColorStop(0, '#FFF9A6');
          goldGrad.addColorStop(0.4, '#FFD700');
          goldGrad.addColorStop(1, '#F59E0B');
          drawVectorHeart(ctx, 0, -10, 21, goldGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'diamond') {
          // 💎 BRILLIANT ELECTRIC CYAN DIAMOND
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.fill();

          drawVectorDiamond(ctx, 0, 0, 20);
        } else if (h.type === 'broken') {
          // 💔 DANGER BROKEN HEART (Dark core + intense bright red warning border)
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fill();

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
          // 💚 BRIGHT EMERALD GREEN LIFE HEART
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 255, 102, 0.35)';
          ctx.fill();

          const greenGrad = ctx.createLinearGradient(0, -16, 0, 16);
          greenGrad.addColorStop(0, '#B9F6CA');
          greenGrad.addColorStop(0.5, '#00E676');
          greenGrad.addColorStop(1, '#00C853');
          drawVectorHeart(ctx, 0, -8, 17, greenGrad, '#FFFFFF', 2.5);
        } else if (h.type === 'magnet') {
          // 🌟 MAGNET STAR POWER-UP
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
          ctx.fill();

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
          // ❄️ ICE CRYSTAL POWER-UP
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fill();

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

      // Render Floating Popups
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

      // --- 8. RENDER BASKET ---
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
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, [4, 4, 18, 18]);
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
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, resetGame, spawnHeart, updateScoreAndCheckHighscore, createParticles, addPopup]);

  // Input Listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        gameStateRef.current.inputMode = 'keyboard';
        gameStateRef.current.keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        gameStateRef.current.keysPressed[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getGameOverLoveMessage = (finalScore) => {
    if (finalScore >= 350) return 'Unglaublich! Du hast mein ganzes Herz erobert! 👑❤️';
    if (finalScore >= 200) return 'Wundervoll gespielt! Du bist mein wertvollster Schatz. ✨💖';
    if (finalScore >= 100) return 'Toll gemacht, mein Schatz! Ich liebe dein Lächeln. 🌹';
    return 'Jeder Versuch ist wunderschön – genau wie du! ❤️';
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Herzen-Fangen Minispiel"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-midnight-950/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-sm aspect-[400/600] rounded-3xl overflow-hidden shadow-2xl border-2 border-rosegold-400/50 bg-midnight-900 flex flex-col justify-between select-none"
        >
          {/* Header HUD Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-midnight-900/95 border-b border-rosegold-500/30">
            {/* Lives Display */}
            <div className="flex items-center gap-1 bg-midnight-800 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-700">
              {[1, 2, 3].map((heartNum) => (
                <span key={heartNum} className="text-sm">
                  {heartNum <= lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>

            {/* Power-up / Combo Status Badges */}
            <div className="flex items-center gap-1.5">
              {isFever && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                  <Flame className="w-3 h-3 text-amber-400" /> 3x Fever
                </span>
              )}
              {combo >= 5 && !isFever && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
                  <Zap className="w-3 h-3 text-rose-400" /> {combo}x Combo
                </span>
              )}
              {magnetActive && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 animate-pulse">
                  <Magnet className="w-3 h-3 text-purple-400" /> Magnet
                </span>
              )}
              {freezeActive && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse">
                  <Snowflake className="w-3 h-3 text-cyan-400" /> Zeitlupe
                </span>
              )}
            </div>

            {/* Score & Highscore & Close */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-champagne-300 tracking-tight">
                  Punkte: {score}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Best: {highScore}
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

          {/* New Highscore Banner */}
          {newHighScoreNotice && (
            <div className="absolute top-16 inset-x-6 z-20 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-center py-1.5 rounded-2xl shadow-lg animate-bounce text-xs">
              ✨ Neuer persönlicher Highscore! 👑
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
              gameStateRef.current.inputMode = 'mouse';
              gameStateRef.current.targetBasketX = (e.clientX - rect.left) * scaleX - 45;
            }}
            onTouchMove={(e) => {
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.inputMode = 'touch';
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - 45;
            }}
            onTouchStart={(e) => {
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.inputMode = 'touch';
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - 45;
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
            />
          </div>

          {/* Luxury Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-30 bg-midnight-950/95 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-5xl mb-2 animate-bounce">💖</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-champagne-300 mb-1">
                Spiel beendet
              </h2>
              <p className="text-xs text-rosegold-200 mb-5 font-medium max-w-xs px-2 italic">
                "{getGameOverLoveMessage(score)}"
              </p>

              {/* Stats Card */}
              <div className="bg-midnight-900 rounded-2xl p-4 w-full max-w-xs border border-rosegold-500/40 shadow-xl space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span>Deine Punkte:</span>
                  <span className="text-base font-bold font-mono text-champagne-300">{score}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 border-t border-slate-800 pt-2">
                  <span>Rekord:</span>
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
                <RotateCcw className="w-4 h-4" /> Nochmal spielen
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
