import confetti from 'canvas-confetti';

// Helper to create emoji shapes safely if canvas-confetti supports shapeFromText
function createEmojiShape(char, scalar = 2.4) {
  try {
    if (typeof confetti.shapeFromText === 'function') {
      return confetti.shapeFromText({ text: char, scalar });
    }
  } catch (e) {
    console.error(e);
  }
  return 'circle';
}

const heartShape = createEmojiShape('❤️', 2.5);
const loveSparkleShape = createEmojiShape('💖', 2.5);
const starShape = createEmojiShape('⭐', 2.2);
const sparkleShape = createEmojiShape('✨', 2.2);
const fireworkShape = createEmojiShape('🎆', 2.6);
const roseShape = createEmojiShape('🌹', 2.3);
const kissShape = createEmojiShape('💋', 2.3);
const diamondShape = createEmojiShape('💎', 2.5);
const cupidShape = createEmojiShape('💘', 2.4);
const giftShape = createEmojiShape('🎁', 2.4);
const ringShape = createEmojiShape('💍', 2.4);

// 1. Romantic 3D Heart Explosion (Flying Ruby Hearts ❤️ & Shimmering 💖)
export function fireHeartExplosion() {
  const count = 80;
  // Center burst
  confetti({
    particleCount: count,
    spread: 100,
    startVelocity: 48,
    ticks: 200,
    origin: { y: 0.65 },
    shapes: [heartShape, loveSparkleShape, diamondShape],
    colors: ['#FF0055', '#FF4D6D', '#E8B4B8', '#D4AF37', '#FFF5C2']
  });

  // Follow-up sparkle dust
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 120,
      startVelocity: 30,
      ticks: 150,
      origin: { y: 0.6 },
      shapes: [sparkleShape, 'circle'],
      colors: ['#FFF5C2', '#D4AF37', '#FFD1DC']
    });
  }, 120);
}

// 2. Champagne Gold Star Shower (Flying Stars ⭐ & ✨)
export function fireGoldStarShower() {
  const duration = 2.2 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    confetti({
      particleCount: 20,
      startVelocity: 35,
      spread: 360,
      ticks: 100,
      origin: { x: Math.random(), y: Math.random() * 0.4 },
      shapes: [starShape, sparkleShape, diamondShape, 'circle'],
      colors: ['#FFF5C2', '#F7E7CE', '#D4AF37', '#E6C687', '#FFFFFF']
    });
  }, 180);
}

// 3. Side Fireworks Cannons (Fireworks 🎆 & 💥)
export function fireFireworksCannons() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 8,
      angle: 60,
      spread: 65,
      startVelocity: 70,
      origin: { x: 0, y: 0.7 },
      shapes: [fireworkShape, loveSparkleShape, starShape, diamondShape],
      colors: ['#FF0055', '#F7E7CE', '#E8B4B8', '#E63946', '#FBBF24']
    });
    confetti({
      particleCount: 8,
      angle: 120,
      spread: 65,
      startVelocity: 70,
      origin: { x: 1, y: 0.7 },
      shapes: [fireworkShape, heartShape, starShape, 'circle'],
      colors: ['#D4AF37', '#FFD1DC', '#9B525E', '#F7E7CE', '#FF4D6D']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

// 4. Gentle Love Rain (Roses 🌹 & Petals)
export function fireLoveRain() {
  confetti({
    particleCount: 75,
    spread: 160,
    startVelocity: 22,
    decay: 0.94,
    gravity: 0.45,
    ticks: 240,
    origin: { y: 0 },
    shapes: [roseShape, heartShape, loveSparkleShape, 'circle'],
    colors: ['#FFD1DC', '#E8B4B8', '#B76E79', '#E63946', '#FFF5C2']
  });
}

// 5. 360-degree Kisses & Love Ring (Kisses 💋 & ❤️)
export function fireGoldenRing() {
  confetti({
    particleCount: 90,
    spread: 360,
    startVelocity: 42,
    ticks: 200,
    origin: { y: 0.5 },
    shapes: [kissShape, heartShape, ringShape, diamondShape],
    colors: ['#E63946', '#B76E79', '#FFB6C1', '#D4AF37', '#FFFFFF']
  });
}

// 6. Silver & Diamond Sparkle Splash (Diamonds 💎 & ✨)
export function fireDiamondSplash() {
  confetti({
    particleCount: 90,
    spread: 110,
    startVelocity: 52,
    ticks: 220,
    origin: { y: 0.6 },
    shapes: [diamondShape, sparkleShape, ringShape, 'circle'],
    colors: ['#E2E8F0', '#F8FAFC', '#CBD5E1', '#D4AF37', '#FFD1DC', '#00E5FF']
  });
}

// 7. Cupid Upward Rocket Salvo (Cupid Bows 💘 & ❤️)
export function fireCupidArrow() {
  confetti({
    particleCount: 75,
    angle: 90,
    spread: 55,
    startVelocity: 68,
    ticks: 220,
    origin: { y: 1 },
    shapes: [cupidShape, heartShape, loveSparkleShape, starShape],
    colors: ['#E63946', '#B76E79', '#FFD1DC', '#F7E7CE', '#D4AF37']
  });
}

// 8. Champagne Pop Celebration (Gifts 🎁 & ⭐)
export function fireChampagnePop() {
  confetti({
    particleCount: 80,
    spread: 90,
    startVelocity: 48,
    ticks: 200,
    origin: { y: 0.7 },
    shapes: [giftShape, starShape, diamondShape, 'circle'],
    colors: ['#F7E7CE', '#E6C687', '#D4AF37', '#FFFFFF', '#B76E79', '#FF69B4']
  });
}

// SPECIAL: Full Royal Celebration (Multi-wave burst for scratch completion & milestone events)
export function fireRoyalCelebration() {
  fireHeartExplosion();
  setTimeout(() => {
    fireFireworksCannons();
  }, 250);
  setTimeout(() => {
    fireDiamondSplash();
  }, 600);
}

// SPECIAL: Birthday Full-Screen Fireworks (Feb 2)
export function fireBirthdayFireworks() {
  fireFireworksCannons();
  setTimeout(fireGoldStarShower, 500);
  setTimeout(fireDiamondSplash, 1000);
}

// SPECIAL: Valentine's Day Floating Heart Rain (Feb 14)
export function fireValentineHeartRain() {
  const duration = 3.5 * 1000;
  const end = Date.now() + duration;

  const interval = setInterval(function() {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      particleCount: 10,
      startVelocity: 16,
      spread: 180,
      ticks: 150,
      gravity: 0.35,
      origin: { x: Math.random(), y: -0.1 },
      shapes: [heartShape, loveSparkleShape, roseShape, diamondShape],
      colors: ['#FF4D6D', '#FF758F', '#FF8FA3', '#FFB3C1', '#D4AF37']
    });
  }, 200);
}

// Main Router: assigns a unique animation experience per day across 8 distinct emoji & particle modes!
export function fireDayAnimation(dayId) {
  const numericId = Number(dayId) || 1;
  const mode = numericId % 8;

  if (mode === 1) fireHeartExplosion();
  else if (mode === 2) fireGoldStarShower();
  else if (mode === 3) fireFireworksCannons();
  else if (mode === 4) fireLoveRain();
  else if (mode === 5) fireGoldenRing();
  else if (mode === 6) fireDiamondSplash();
  else if (mode === 7) fireCupidArrow();
  else fireChampagnePop();
}

export function fireHeartConfetti() {
  fireHeartExplosion();
}
