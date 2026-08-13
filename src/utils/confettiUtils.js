import confetti from 'canvas-confetti';

// Helper to create emoji shapes safely
function createEmojiShape(char, scalar = 2.2) {
  try {
    if (typeof confetti.shapeFromText === 'function') {
      return confetti.shapeFromText({ text: char, scalar });
    }
  } catch (e) {
    console.error(e);
  }
  return 'circle';
}

const heartShape = createEmojiShape('❤️', 2.4);
const loveSparkleShape = createEmojiShape('💖', 2.4);
const starShape = createEmojiShape('⭐', 2.0);
const sparkleShape = createEmojiShape('✨', 2.2);
const roseShape = createEmojiShape('🌹', 2.3);
const kissShape = createEmojiShape('💋', 2.3);
const diamondShape = createEmojiShape('💎', 2.4);
const cupidShape = createEmojiShape('💘', 2.3);
const giftShape = createEmojiShape('🎁', 2.2);
const ringShape = createEmojiShape('💍', 2.2);
const butterflyShape = createEmojiShape('🦋', 2.3);
const champagneShape = createEmojiShape('🥂', 2.2);
const fireworkShape = createEmojiShape('🎆', 2.5);

// =========================================================================
// 12 DISTINCT, UNIQUE ANIMATION PATTERNS WITH DIFFERENT TRAJECTORIES & PHYSICS
// =========================================================================

// 1. Center Nova Heart Eruption (Explodes 360° outward from center of screen)
export function fireHeartNova() {
  confetti({
    particleCount: 40,
    spread: 360,
    startVelocity: 35,
    ticks: 120,
    gravity: 0.7,
    origin: { x: 0.5, y: 0.5 },
    shapes: [heartShape, loveSparkleShape],
    colors: ['#FF0055', '#FF4D6D', '#FF8FA3', '#FFF5C2']
  });
}

// 2. Dual Side Golden Cannons (Cross-firing fireworks from bottom left & right)
export function fireDualGoldCannons() {
  // Left cannon
  confetti({
    particleCount: 22,
    angle: 55,
    spread: 50,
    startVelocity: 48,
    ticks: 110,
    origin: { x: 0.05, y: 0.85 },
    shapes: [starShape, sparkleShape],
    colors: ['#D4AF37', '#FFF5C2', '#F7E7CE']
  });
  // Right cannon
  confetti({
    particleCount: 22,
    angle: 125,
    spread: 50,
    startVelocity: 48,
    ticks: 110,
    origin: { x: 0.95, y: 0.85 },
    shapes: [starShape, sparkleShape],
    colors: ['#D4AF37', '#FFF5C2', '#F7E7CE']
  });
}

// 3. Shimmering Diamond Waterfall (Slow, majestic diamond crystal drizzle from top)
export function fireDiamondWaterfall() {
  confetti({
    particleCount: 35,
    spread: 140,
    startVelocity: 15,
    gravity: 0.4,
    drift: 0.2,
    ticks: 160,
    origin: { x: 0.5, y: -0.05 },
    shapes: [diamondShape, sparkleShape],
    colors: ['#00E5FF', '#E2E8F0', '#FFFFFF', '#CBD5E1']
  });
}

// 4. Romantic Rose Petal Gentle Breeze (Floating petals swaying gently from left to right)
export function fireRosePetalBreeze() {
  confetti({
    particleCount: 30,
    spread: 120,
    startVelocity: 18,
    decay: 0.93,
    gravity: 0.35,
    drift: 0.5, // Wind blowing right!
    ticks: 180,
    origin: { x: 0.1, y: 0.1 },
    shapes: [roseShape, heartShape],
    colors: ['#E11D48', '#FF4D6D', '#FDA4AF', '#B76E79']
  });
}

// 5. Cupid Shooting Arrow (Fast diagonal streak from bottom-left to top-right)
export function fireCupidStreak() {
  confetti({
    particleCount: 35,
    angle: 45,
    spread: 30,
    startVelocity: 60,
    gravity: 0.6,
    ticks: 120,
    origin: { x: 0.1, y: 0.9 },
    shapes: [cupidShape, loveSparkleShape, starShape],
    colors: ['#FF0055', '#D4AF37', '#FFD1DC', '#F7E7CE']
  });
}

// 6. Floating Kiss Cloud (Bouncing upward kiss emojis with near-zero gravity)
export function fireKissCloud() {
  confetti({
    particleCount: 28,
    angle: 90,
    spread: 80,
    startVelocity: 28,
    gravity: 0.2, // Floats like a balloon!
    ticks: 170,
    origin: { x: 0.5, y: 0.75 },
    shapes: [kissShape, loveSparkleShape],
    colors: ['#E63946', '#FF4D6D', '#FFB6C1', '#FFF5C2']
  });
}

// 7. Golden Wedding Ring Halo (Expanding circular ring of diamonds and wedding rings)
export function fireRingHalo() {
  confetti({
    particleCount: 32,
    spread: 360,
    startVelocity: 30,
    decay: 0.92,
    gravity: 0.5,
    origin: { x: 0.5, y: 0.45 },
    shapes: [ringShape, diamondShape, sparkleShape],
    colors: ['#D4AF37', '#F7E7CE', '#FFFFFF', '#FFD700']
  });
}

// 8. Surprise Gift Pop (Popping upward with gift boxes and festive sparkles)
export function fireGiftPop() {
  confetti({
    particleCount: 30,
    spread: 70,
    startVelocity: 42,
    ticks: 120,
    origin: { x: 0.5, y: 0.7 },
    shapes: [giftShape, starShape, sparkleShape],
    colors: ['#F7E7CE', '#D4AF37', '#FF69B4', '#FFFFFF']
  });
}

// 9. Butterfly Flight (Whimsical fluttering butterflies swirling gently across the view)
export function fireButterflyFlight() {
  confetti({
    particleCount: 28,
    spread: 100,
    startVelocity: 24,
    gravity: 0.3,
    drift: -0.4, // Drifts to the left!
    ticks: 180,
    origin: { x: 0.8, y: 0.2 },
    shapes: [butterflyShape, sparkleShape],
    colors: ['#BAE6FD', '#FCE7F3', '#D4AF37', '#FFD1DC']
  });
}

// 10. Sparkler Roman Candle (Snappy vertical golden sparkles bursting high into the sky)
export function fireSparklerCandle() {
  confetti({
    particleCount: 36,
    angle: 90,
    spread: 35,
    startVelocity: 54,
    ticks: 110,
    origin: { x: 0.5, y: 0.95 },
    shapes: [sparkleShape, starShape],
    colors: ['#FFF5C2', '#FDE047', '#D4AF37', '#FFFFFF']
  });
}

// 11. Champagne Celebration Bubbles (Bubbly rising champagne glints and diamonds)
export function fireChampagneBubbles() {
  confetti({
    particleCount: 30,
    angle: 90,
    spread: 60,
    startVelocity: 36,
    gravity: 0.3,
    ticks: 140,
    origin: { x: 0.5, y: 0.8 },
    shapes: [champagneShape, diamondShape, sparkleShape],
    colors: ['#F7E7CE', '#D4AF37', '#FFFFFF', '#FFF5C2']
  });
}

// 12. Midnight Fireworks Finale (Vibrant multi-colored firework rockets)
export function fireMidnightFireworks() {
  confetti({
    particleCount: 38,
    spread: 120,
    startVelocity: 44,
    ticks: 130,
    origin: { x: 0.5, y: 0.6 },
    shapes: [fireworkShape, starShape, heartShape],
    colors: ['#FF0055', '#D4AF37', '#00FFFF', '#FF69B4', '#FFFFFF']
  });
}

// =========================================================================
// SPECIAL OCCASIONS & MILESTONES
// =========================================================================

// Snappy Royal Celebration (Triggered on Scratch completion)
export function fireRoyalCelebration() {
  confetti({
    particleCount: 38,
    spread: 85,
    startVelocity: 38,
    ticks: 110,
    origin: { x: 0.5, y: 0.6 },
    shapes: [heartShape, diamondShape, loveSparkleShape],
    colors: ['#FF0055', '#D4AF37', '#FFF5C2', '#FFD1DC']
  });
}

// Birthday Celebration (Feb 2)
export function fireBirthdayFireworks() {
  confetti({
    particleCount: 45,
    spread: 110,
    startVelocity: 44,
    ticks: 130,
    origin: { x: 0.5, y: 0.6 },
    shapes: [fireworkShape, starShape, diamondShape],
    colors: ['#FFD700', '#FF69B4', '#FF4500', '#00FFFF']
  });
}

// Valentine Heart Rain (Feb 14)
export function fireValentineHeartRain() {
  confetti({
    particleCount: 42,
    spread: 120,
    startVelocity: 30,
    gravity: 0.35,
    ticks: 150,
    origin: { x: 0.5, y: 0.1 },
    shapes: [heartShape, loveSparkleShape, roseShape],
    colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FF0055']
  });
}

export function fireHeartExplosion() {
  fireHeartNova();
}

export function fireGoldStarShower() {
  fireDualGoldCannons();
}

export function fireDiamondSplash() {
  fireDiamondWaterfall();
}

export function fireLoveRain() {
  fireRosePetalBreeze();
}

export function fireGoldenRing() {
  fireRingHalo();
}

export function fireFireworksCannons() {
  fireSparklerCandle();
}

export function fireHeartConfetti() {
  fireHeartNova();
}

// Main Day Router: 12 distinctly choreographed physical patterns that cycle through the year!
export function fireDayAnimation(dayId) {
  const numericId = Number(dayId) || 1;
  const mode = numericId % 12;

  switch (mode) {
    case 1: fireHeartNova(); break;          // Center 360° Nova
    case 2: fireDualGoldCannons(); break;      // Dual Side Corner Cannons
    case 3: fireDiamondWaterfall(); break;     // Top Diamond Drizzle
    case 4: fireRosePetalBreeze(); break;      // Wind-Blown Rose Petals
    case 5: fireCupidStreak(); break;          // Diagonal Shooting Arrow
    case 6: fireKissCloud(); break;            // Anti-gravity Floating Kiss Bubbles
    case 7: fireRingHalo(); break;             // Expanding Ring Halo
    case 8: fireGiftPop(); break;              // Upward Gift Box Poppers
    case 9: fireButterflyFlight(); break;      // Drifting Butterfly Flight
    case 10: fireSparklerCandle(); break;      // Vertical High Sparkler Candle
    case 11: fireChampagneBubbles(); break;    // Rising Champagne Bubbles
    default: fireMidnightFireworks(); break;   // Multi-Color Midnight Fireworks
  }
}
