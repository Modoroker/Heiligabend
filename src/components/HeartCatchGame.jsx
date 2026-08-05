import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trophy, RotateCcw, Sparkles } from 'lucide-react';

const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 600;
const HIGH_SCORE_KEY = 'heartcatch_highscore';

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
  const [isGameOver, setIsGameOver] = useState(false);
  const [newHighScoreNotice, setNewHighScoreNotice] = useState(false);

  // Game Loop State refs (mutable for 60fps performance)
  const gameStateRef = useRef({
    basketX: LOGICAL_WIDTH / 2 - 40,
    targetBasketX: LOGICAL_WIDTH / 2 - 40,
    basketWidth: 80,
    basketHeight: 50,
    hearts: [],
    particles: [],
    popups: [],
    lastSpawnTime: 0,
    keysPressed: { ArrowLeft: false, ArrowRight: false },
    score: 0,
    lives: 3,
    highScore: 0,
    isGameOver: false,
    isNewHighScore: false,
    inputMode: 'none', // 'mouse', 'touch', 'keyboard'
  });

  // Initialize or Reset Game
  const resetGame = useCallback(() => {
    const savedHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    gameStateRef.current = {
      basketX: LOGICAL_WIDTH / 2 - 40,
      targetBasketX: LOGICAL_WIDTH / 2 - 40,
      basketWidth: 80,
      basketHeight: 50,
      hearts: [],
      particles: [],
      popups: [],
      lastSpawnTime: performance.now(),
      keysPressed: { ArrowLeft: false, ArrowRight: false },
      score: 0,
      lives: 3,
      highScore: savedHighScore,
      isGameOver: false,
      isNewHighScore: false,
      inputMode: 'none',
    };
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setNewHighScoreNotice(false);
    setHighScore(savedHighScore);
  }, []);

  // Update Highscore helper
  const updateScoreAndCheckHighscore = useCallback((newScore) => {
    gameStateRef.current.score = Math.max(0, newScore);
    setScore(gameStateRef.current.score);

    if (gameStateRef.current.score > gameStateRef.current.highScore) {
      gameStateRef.current.highScore = gameStateRef.current.score;
      setHighScore(gameStateRef.current.score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(gameStateRef.current.score));
      } catch (e) {
        console.error('Highscore save error', e);
      }
      if (!gameStateRef.current.isNewHighScore) {
        gameStateRef.current.isNewHighScore = true;
        setNewHighScoreNotice(true);
        setTimeout(() => setNewHighScoreNotice(false), 2000);
      }
    }
  }, []);

  // Spawn Heart logic based on weights & dynamic speed
  const spawnHeart = useCallback((nowTime) => {
    const currentScore = gameStateRef.current.score;

    // Dynamic difficulty: faster spawn rate as score increases
    const spawnInterval = Math.max(600, 1200 - Math.floor(currentScore / 100) * 50);

    if (nowTime - gameStateRef.current.lastSpawnTime < spawnInterval) return;
    gameStateRef.current.lastSpawnTime = nowTime;

    // Random type selection
    const rand = Math.random();
    let type = 'classic';
    let size = 30;
    let speedMult = 1.0;
    let points = 10;

    if (rand < 0.75) {
      type = 'classic'; // 75%
      size = 30;
      speedMult = 1.0;
      points = 10;
    } else if (rand < 0.85) {
      type = 'gold'; // 10%
      size = 32;
      speedMult = 1.4;
      points = 25;
    } else if (rand < 0.95) {
      type = 'broken'; // 10%
      size = 34; // Slightly larger dark broken heart
      speedMult = 1.0;
      points = -10;
    } else {
      type = 'mini_bonus'; // 5% Extra tiny (18px) Neon Green +1 Life bonus heart
      size = 18;
      speedMult = 1.6;
      points = 30;
    }

    // Dynamic base fall speed increases with score
    const baseSpeed = Math.min(350, 160 + Math.floor(currentScore / 150) * 15);
    const finalSpeed = baseSpeed * speedMult;

    const x = Math.random() * (LOGICAL_WIDTH - 60) + 30;

    gameStateRef.current.hearts.push({
      id: Math.random(),
      type,
      x,
      y: -30,
      size,
      speed: finalSpeed,
      points,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 3.0,
    });
  }, []);

  // Particle Explosions
  const createParticles = useCallback((x, y, color, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 40;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        life: 0.5, // seconds
      });
    }
  }, []);

  // Floating Score Popup (+10, +25, +30, -10)
  const addPopup = useCallback((text, x, y, color) => {
    gameStateRef.current.popups.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.0,
      life: 0.6,
    });
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    if (!isOpen) return;

    resetGame();
    let animationFrameId;
    let lastTime = performance.now();

    const updateAndRender = (currentTime) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000); // delta time in seconds
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = gameStateRef.current;

      if (!state.isGameOver) {
        // --- 1. UPDATE BASKET POSITION ---
        if (state.inputMode === 'keyboard') {
          const moveDist = 250 * dt;
          if (state.keysPressed.ArrowLeft) {
            state.basketX = Math.max(0, state.basketX - moveDist);
          }
          if (state.keysPressed.ArrowRight) {
            state.basketX = Math.min(LOGICAL_WIDTH - state.basketWidth, state.basketX + moveDist);
          }
        } else if (state.inputMode === 'mouse') {
          // Smooth Lerp Damping (0.2)
          state.basketX += (state.targetBasketX - state.basketX) * 0.2;
          state.basketX = Math.max(0, Math.min(LOGICAL_WIDTH - state.basketWidth, state.basketX));
        } else if (state.inputMode === 'touch') {
          // Direct tracking
          state.basketX = Math.max(0, Math.min(LOGICAL_WIDTH - state.basketWidth, state.targetBasketX));
        }

        // --- 2. SPAWN HEARTS ---
        spawnHeart(currentTime);

        // --- 3. UPDATE HEARTS & COLLISIONS ---
        const basketCenter = state.basketX + state.basketWidth / 2;
        const basketY = LOGICAL_HEIGHT - 45;
        const catchRadius = 35;

        for (let i = state.hearts.length - 1; i >= 0; i--) {
          const heart = state.hearts[i];
          heart.y += heart.speed * dt;
          heart.rotation += heart.rotationSpeed * dt;

          // Check Collision with Basket
          const dx = heart.x - basketCenter;
          const dy = heart.y - basketY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < catchRadius + heart.size / 2) {
            // CAUGHT!
            state.hearts.splice(i, 1);

            if (heart.type === 'classic') {
              updateScoreAndCheckHighscore(state.score + 10);
              addPopup('+10', heart.x, heart.y, '#FF0054');
              createParticles(heart.x, heart.y, '#FF0054', 6);
            } else if (heart.type === 'gold') {
              updateScoreAndCheckHighscore(state.score + 25);
              addPopup('+25', heart.x, heart.y, '#FBBF24');
              createParticles(heart.x, heart.y, '#FBBF24', 10);
            } else if (heart.type === 'broken') {
              updateScoreAndCheckHighscore(state.score - 10);
              addPopup('-10', heart.x, heart.y, '#991B1B');
              addPopup('-1 ❤️', heart.x, heart.y - 20, '#EF4444');
              createParticles(heart.x, heart.y, '#1F2937', 8);

              state.lives -= 1;
              setLives(state.lives);

              if (state.lives <= 0) {
                state.isGameOver = true;
                setIsGameOver(true);
              }
            } else if (heart.type === 'mini_bonus') {
              // Extra +1 Life Mini-Bonus Green Heart!
              updateScoreAndCheckHighscore(state.score + 30);
              const nextLives = Math.min(3, state.lives + 1);
              state.lives = nextLives;
              setLives(nextLives);

              addPopup('+30', heart.x, heart.y, '#00E676');
              addPopup('+1 ❤️', heart.x, heart.y - 20, '#00E676');
              createParticles(heart.x, heart.y, '#00E676', 12);
            }
            continue;
          }

          // Check Missed (flew past bottom)
          if (heart.y > LOGICAL_HEIGHT + 20) {
            state.hearts.splice(i, 1);

            // Missed classic red heart deducts 1 life
            if (heart.type === 'classic') {
              state.lives -= 1;
              setLives(state.lives);

              if (state.lives <= 0) {
                state.isGameOver = true;
                setIsGameOver(true);
              }
            }
          }
        }
      }

      // --- 4. UPDATE PARTICLES & POPUPS ---
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt / p.life;
        if (p.alpha <= 0) state.particles.splice(i, 1);
      }

      for (let i = state.popups.length - 1; i >= 0; i--) {
        const pop = state.popups[i];
        pop.y -= 50 * dt;
        pop.alpha -= dt / pop.life;
        pop.scale += 0.3 * dt;
        if (pop.alpha <= 0) state.popups.splice(i, 1);
      }

      // --- 5. RENDER CANVAS (Cute Pastell Design) ---
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Background Gradient (#FFF0F5 to #FFE4E1)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      bgGrad.addColorStop(0, '#FFF0F5');
      bgGrad.addColorStop(1, '#FFE4E1');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Subtle Background floating heart outlines
      ctx.fillStyle = 'rgba(248, 165, 194, 0.15)';
      ctx.font = '36px sans-serif';
      ctx.fillText('♥', 50, 150 + Math.sin(currentTime / 1000) * 10);
      ctx.fillText('♥', 320, 280 + Math.cos(currentTime / 1200) * 10);
      ctx.fillText('♥', 180, 420 + Math.sin(currentTime / 800) * 8);

      // Render Falling Hearts with highly distinct visuals & glowing auras
      state.hearts.forEach((h) => {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);

        if (h.type === 'classic') {
          // Classic Red Heart ❤️
          ctx.fillStyle = '#FF0054';
          ctx.shadowColor = 'rgba(255, 0, 84, 0.4)';
          ctx.shadowBlur = 8;
          ctx.font = '30px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❤️', 0, 0);
        } else if (h.type === 'gold') {
          // Golden Sparkle Heart 💛
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = 14;
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💛', 0, 0);
        } else if (h.type === 'broken') {
          // Dark Broken Heart 💔 with Dark Charcoal Aura & Red Edge
          ctx.shadowColor = '#1F2937';
          ctx.shadowBlur = 16;
          
          // Render dark aura circle behind broken heart for instant visual danger
          ctx.fillStyle = 'rgba(31, 41, 55, 0.85)';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.font = '30px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💔', 0, 0);
        } else if (h.type === 'mini_bonus') {
          // Extra Tiny Neon Emerald Green Bonus Heart 💚 (+1 Life)
          ctx.shadowColor = '#00E676';
          ctx.shadowBlur = 16;

          // Render glowing neon green circle background behind mini bonus heart
          ctx.fillStyle = 'rgba(0, 230, 118, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💚', 0, 0);
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

      // Render Score Popups (+10, +25, +30, -10)
      state.popups.forEach((pop) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.alpha);
        ctx.fillStyle = pop.color;
        ctx.font = `bold ${Math.round(18 * pop.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      // Render Basket at Bottom
      ctx.save();
      const bX = state.basketX;
      const bY = LOGICAL_HEIGHT - 50;
      const bW = state.basketWidth;
      const bH = state.basketHeight;

      // Basket body (semi-round pastel basket #F8A5C2)
      ctx.fillStyle = '#F8A5C2';
      ctx.strokeStyle = '#E87DA0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, [0, 0, 24, 24]);
      ctx.fill();
      ctx.stroke();

      // Inner basket rim line
      ctx.fillStyle = '#E87DA0';
      ctx.fillRect(bX - 4, bY, bW + 8, 8);

      // Cute Bow in center of basket
      ctx.fillStyle = '#FF4D6D';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎀', bX + bW / 2, bY + bH / 2 + 6);

      ctx.restore();

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, resetGame, spawnHeart, updateScoreAndCheckHighscore, createParticles, addPopup]);

  // Input Listeners (Mouse, Touch, Keyboard)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        gameStateRef.current.inputMode = 'keyboard';
        gameStateRef.current.keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        gameStateRef.current.keysPressed[e.key] = false;
      }
    };

    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scaleX = LOGICAL_WIDTH / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      gameStateRef.current.inputMode = 'mouse';
      gameStateRef.current.targetBasketX = mouseX - gameStateRef.current.basketWidth / 2;
    };

    const handleTouchMove = (e) => {
      const container = containerRef.current;
      if (!container || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const scaleX = LOGICAL_WIDTH / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      gameStateRef.current.inputMode = 'touch';
      gameStateRef.current.targetBasketX = touchX - gameStateRef.current.basketWidth / 2;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-midnight-950/85 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          className="relative w-full max-w-sm aspect-[400/600] rounded-3xl overflow-hidden shadow-2xl border-2 border-pink-300/40 flex flex-col justify-between select-none"
        >
          {/* Header Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-white/40 backdrop-blur-md border-b border-pink-200/50">
            {/* Lives Display */}
            <div className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm">
              {[1, 2, 3].map((heartNum) => (
                <span key={heartNum} className="text-base">
                  {heartNum <= lives ? '❤️' : '🤍'}
                </span>
              ))}
            </div>

            {/* Score & Highscore */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-pink-700 tracking-tight">Punkte: {score}</div>
                <div className="text-[10px] text-pink-500 font-medium">Best: {highScore}</div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-pink-100/80 text-pink-600 hover:bg-pink-200 transition-colors"
                title="Spiel schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Highscore Banner */}
          {newHighScoreNotice && (
            <div className="absolute top-16 inset-x-4 z-20 bg-gradient-to-r from-amber-400 to-pink-500 text-white font-bold text-center py-1.5 rounded-xl shadow-lg animate-bounce text-xs">
              ✨ Neuer Highscore! ✨
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
              gameStateRef.current.targetBasketX = (e.clientX - rect.left) * scaleX - 40;
            }}
            onTouchMove={(e) => {
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.inputMode = 'touch';
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - 40;
            }}
            onTouchStart={(e) => {
              const container = containerRef.current;
              if (!container || !e.touches[0]) return;
              const rect = container.getBoundingClientRect();
              const scaleX = LOGICAL_WIDTH / rect.width;
              gameStateRef.current.inputMode = 'touch';
              gameStateRef.current.targetBasketX = (e.touches[0].clientX - rect.left) * scaleX - 40;
            }}
          >
            <canvas
              ref={canvasRef}
              width={LOGICAL_WIDTH}
              height={LOGICAL_HEIGHT}
              className="w-full h-full block"
            />
          </div>

          {/* Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-30 bg-pink-100/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <span className="text-5xl mb-2 animate-bounce">💔</span>
              <h2 className="text-3xl font-serif font-bold text-pink-700 mb-1">Game Over</h2>
              <p className="text-sm text-pink-600/80 mb-6 font-medium">Alle Herzen verpasst!</p>

              <div className="bg-white/80 rounded-2xl p-4 w-full max-w-xs border border-pink-200 shadow-md space-y-2 mb-6">
                <div className="flex justify-between items-center text-sm font-semibold text-pink-800">
                  <span>Punkte:</span>
                  <span className="text-lg font-bold text-pink-600">{score}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-pink-800 border-t border-pink-100 pt-2">
                  <span>Highscore:</span>
                  <span className="text-lg font-bold text-amber-500 flex items-center gap-1">
                    <Trophy className="w-4 h-4" /> {highScore}
                  </span>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> Nochmal spielen
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
