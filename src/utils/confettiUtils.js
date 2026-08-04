import confetti from 'canvas-confetti';

// Helper to create emoji shapes safely if canvas-confetti supports shapeFromText
function createEmojiShape(char) {
  try {
    if (typeof confetti.shapeFromText === 'function') {
      return confetti.shapeFromText({ text: char, scalar: 2.2 });
    }
  } catch (e) {
    console.error(e);
  }
  return 'circle';
}

const heartShape = createEmojiShape('❤️');
const loveSparkleShape = createEmojiShape('💖');
const starShape = createEmojiShape('⭐');
const sparkleShape = createEmojiShape('✨');
const fireworkShape = createEmojiShape('🎆');
const roseShape = createEmojiShape('🌹');
const kissShape = createEmojiShape('💋');
const diamondShape = createEmojiShape('💎');
const cupidShape = createEmojiShape('💘');
const giftShape = createEmojiShape('🎁');

// 1. Romantic Heart Explosion (Flying Hearts ❤️ & 💖)
export function fireHeartExplosion() {
  const count = 70;
  confetti({
    particleCount: count,
    spread: 90,
    startVelocity: 45,
    origin: { y: 0.65 },
    shapes: [heartShape, loveSparkleShape, 'circle'],
    colors: ['#B76E79', '#E8B4B8', '#FFD1DC', '#FFB6C1', '#E63946']
  });
}

// 2. Champagne Gold Star Shower (Flying Stars ⭐ & ✨)
export function fireGoldStarShower() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    confetti({
      particleCount: 15,
      startVelocity: 30,
      spread: 360,
      ticks: 80,
      origin: { x: Math.random(), y: Math.random() * 0.4 },
      shapes: [starShape, sparkleShape, 'circle'],
      colors: ['#F7E7CE', '#D4AF37', '#E6C687', '#FFFFFF']
    });
  }, 200);
}

// 3. Side Fireworks Cannons (Fireworks 🎆 & 💥)
export function fireFireworksCannons() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 60,
      startVelocity: 65,
      origin: { x: 0, y: 0.7 },
      shapes: [fireworkShape, loveSparkleShape, starShape],
      colors: ['#B76E79', '#F7E7CE', '#E8B4B8', '#E63946', '#FBBF24']
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 60,
      startVelocity: 65,
      origin: { x: 1, y: 0.7 },
      shapes: [fireworkShape, starShape, 'circle'],
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
    particleCount: 60,
    spread: 160,
    startVelocity: 20,
    decay: 0.94,
    gravity: 0.5,
    origin: { y: 0 },
    shapes: [roseShape, heartShape, 'circle'],
    colors: ['#FFD1DC', '#E8B4B8', '#B76E79', '#E63946']
  });
}

// 5. 360-degree Kisses & Love Ring (Kisses 💋 & ❤️)
export function fireGoldenRing() {
  confetti({
    particleCount: 80,
    spread: 360,
    startVelocity: 40,
    origin: { y: 0.5 },
    shapes: [kissShape, heartShape, 'circle'],
    colors: ['#E63946', '#B76E79', '#FFB6C1', '#FFFFFF']
  });
}

// 6. Silver & Diamond Sparkle Splash (Diamonds 💎 & ✨)
export function fireDiamondSplash() {
  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 50,
    origin: { y: 0.6 },
    shapes: [diamondShape, sparkleShape, 'circle'],
    colors: ['#E2E8F0', '#F8FAFC', '#CBD5E1', '#D4AF37', '#FFD1DC']
  });
}

// 7. Cupid Upward Rocket Salvo (Cupid Bows 💘 & ❤️)
export function fireCupidArrow() {
  confetti({
    particleCount: 65,
    angle: 90,
    spread: 50,
    startVelocity: 65,
    origin: { y: 1 },
    shapes: [cupidShape, heartShape, 'star'],
    colors: ['#E63946', '#B76E79', '#FFD1DC', '#F7E7CE']
  });
}

// 8. Champagne Pop Celebration (Gifts 🎁 & ⭐)
export function fireChampagnePop() {
  confetti({
    particleCount: 70,
    spread: 80,
    startVelocity: 45,
    ticks: 180,
    origin: { y: 0.7 },
    shapes: [giftShape, starShape, 'circle'],
    colors: ['#F7E7CE', '#E6C687', '#D4AF37', '#FFFFFF', '#B76E79']
  });
}

// SPECIAL: Birthday Full-Screen Fireworks (Feb 2)
export function fireBirthdayFireworks() {
  fireFireworksCannons();
  setTimeout(fireGoldStarShower, 600);
}

// SPECIAL: Valentine's Day Floating Heart Rain (Feb 14)
export function fireValentineHeartRain() {
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  const interval = setInterval(function() {
    if (Date.now() > end) return clearInterval(interval);
    confetti({
      particleCount: 8,
      startVelocity: 15,
      spread: 180,
      ticks: 120,
      gravity: 0.4,
      origin: { x: Math.random(), y: -0.1 },
      shapes: [heartShape, loveSparkleShape],
      colors: ['#FF4D6D', '#FF758F', '#FF8FA3', '#FFB3C1']
    });
  }, 250);
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
