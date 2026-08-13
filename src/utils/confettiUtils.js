import confetti from 'canvas-confetti';

// Helper to create emoji shapes safely if canvas-confetti supports shapeFromText
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

const heartShape = createEmojiShape('❤️', 2.3);
const loveSparkleShape = createEmojiShape('💖', 2.3);
const starShape = createEmojiShape('⭐', 2.0);
const sparkleShape = createEmojiShape('✨', 2.0);
const roseShape = createEmojiShape('🌹', 2.2);
const kissShape = createEmojiShape('💋', 2.2);
const diamondShape = createEmojiShape('💎', 2.3);
const cupidShape = createEmojiShape('💘', 2.2);
const giftShape = createEmojiShape('🎁', 2.2);
const ringShape = createEmojiShape('💍', 2.2);
const butterflyShape = createEmojiShape('🦋', 2.2);
const champagneShape = createEmojiShape('🥂', 2.2);

// 1. Romantic Heart Swirl (Hearts ❤️ & 💖)
export function fireHeartExplosion() {
  confetti({
    particleCount: 35,
    spread: 75,
    startVelocity: 36,
    ticks: 120,
    origin: { y: 0.65 },
    shapes: [heartShape, loveSparkleShape],
    colors: ['#FF0055', '#FF4D6D', '#E8B4B8', '#FFF5C2']
  });
}

// 2. Champagne Gold Star Dust (Stars ⭐ & ✨)
export function fireGoldStarShower() {
  confetti({
    particleCount: 30,
    spread: 90,
    startVelocity: 34,
    ticks: 110,
    origin: { y: 0.6 },
    shapes: [starShape, sparkleShape],
    colors: ['#FFF5C2', '#F7E7CE', '#D4AF37', '#FFFFFF']
  });
}

// 3. Shimmering Diamond Splash (Diamonds 💎 & ✨)
export function fireDiamondSplash() {
  confetti({
    particleCount: 32,
    spread: 80,
    startVelocity: 38,
    ticks: 110,
    origin: { y: 0.6 },
    shapes: [diamondShape, sparkleShape],
    colors: ['#E2E8F0', '#F8FAFC', '#D4AF37', '#00E5FF']
  });
}

// 4. Velvet Rose Petal Fall (Roses 🌹 & Petals)
export function fireLoveRain() {
  confetti({
    particleCount: 30,
    spread: 120,
    startVelocity: 22,
    decay: 0.94,
    gravity: 0.5,
    ticks: 140,
    origin: { y: 0.2 },
    shapes: [roseShape, heartShape],
    colors: ['#FFD1DC', '#E8B4B8', '#B76E79', '#E63946']
  });
}

// 5. Golden Wedding Ring Glitter (Rings 💍 & ⭐)
export function fireGoldenRing() {
  confetti({
    particleCount: 30,
    spread: 85,
    startVelocity: 35,
    ticks: 110,
    origin: { y: 0.6 },
    shapes: [ringShape, sparkleShape, starShape],
    colors: ['#D4AF37', '#F7E7CE', '#FFFFFF', '#FFD1DC']
  });
}

// 6. Flying Kisses (Kisses 💋 & ❤️)
export function fireKissBurst() {
  confetti({
    particleCount: 32,
    spread: 70,
    startVelocity: 38,
    ticks: 120,
    origin: { y: 0.65 },
    shapes: [kissShape, heartShape],
    colors: ['#E63946', '#FF4D6D', '#FFB6C1', '#FFF5C2']
  });
}

// 7. Cupid Bow & Arrow (Cupid 💘 & 💖)
export function fireCupidArrow() {
  confetti({
    particleCount: 32,
    spread: 60,
    startVelocity: 42,
    ticks: 120,
    origin: { y: 0.7 },
    shapes: [cupidShape, loveSparkleShape],
    colors: ['#E63946', '#FFD1DC', '#F7E7CE', '#D4AF37']
  });
}

// 8. Surprise Gift Pop (Gifts 🎁 & ✨)
export function fireGiftPop() {
  confetti({
    particleCount: 32,
    spread: 80,
    startVelocity: 36,
    ticks: 120,
    origin: { y: 0.65 },
    shapes: [giftShape, starShape, sparkleShape],
    colors: ['#F7E7CE', '#D4AF37', '#FF69B4', '#FFFFFF']
  });
}

// 9. Butterfly Romance (Butterflies 🦋 & 💖)
export function fireButterflyFlutter() {
  confetti({
    particleCount: 30,
    spread: 90,
    startVelocity: 30,
    gravity: 0.4,
    ticks: 140,
    origin: { y: 0.55 },
    shapes: [butterflyShape, loveSparkleShape],
    colors: ['#E0F2FE', '#FCE7F3', '#D4AF37', '#FFB6C1']
  });
}

// 10. Sparkler Spark (Sparkles ✨ & ⭐)
export function fireSparklerPop() {
  confetti({
    particleCount: 35,
    spread: 100,
    startVelocity: 36,
    ticks: 110,
    origin: { y: 0.6 },
    shapes: [sparkleShape, starShape],
    colors: ['#FFF5C2', '#FDE047', '#D4AF37', '#FFFFFF']
  });
}

// 11. Bubbly Champagne Toast (Champagne 🥂 & 💎)
export function fireChampagnePop() {
  confetti({
    particleCount: 30,
    spread: 75,
    startVelocity: 40,
    ticks: 120,
    origin: { y: 0.7 },
    shapes: [champagneShape, diamondShape, sparkleShape],
    colors: ['#F7E7CE', '#D4AF37', '#FFFFFF', '#FFF5C2']
  });
}

// 12. Pure Rose Petal Kiss (🌹 & 💋)
export function fireRoseKiss() {
  confetti({
    particleCount: 32,
    spread: 80,
    startVelocity: 34,
    ticks: 120,
    origin: { y: 0.6 },
    shapes: [roseShape, kissShape, heartShape],
    colors: ['#E11D48', '#FDA4AF', '#F43F5E', '#FFF5C2']
  });
}

// SPECIAL: Snappy Royal Celebration (on scratch completion)
export function fireRoyalCelebration() {
  confetti({
    particleCount: 40,
    spread: 85,
    startVelocity: 38,
    ticks: 120,
    origin: { y: 0.6 },
    shapes: [heartShape, diamondShape, loveSparkleShape],
    colors: ['#FF0055', '#D4AF37', '#FFF5C2', '#FFD1DC']
  });
}

// SPECIAL: Birthday Fireworks (Feb 2)
export function fireBirthdayFireworks() {
  confetti({
    particleCount: 45,
    spread: 100,
    startVelocity: 42,
    ticks: 130,
    origin: { y: 0.6 },
    shapes: [starShape, sparkleShape, diamondShape],
    colors: ['#FFD700', '#FF69B4', '#FF4500', '#00FFFF']
  });
}

// SPECIAL: Valentine Heart Rain (Feb 14)
export function fireValentineHeartRain() {
  confetti({
    particleCount: 45,
    spread: 110,
    startVelocity: 35,
    ticks: 140,
    origin: { y: 0.3 },
    shapes: [heartShape, loveSparkleShape, roseShape],
    colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FF0055']
  });
}

export function fireFireworksCannons() {
  fireSparklerPop();
}

// Main Router: assigns 1 of 12 distinct, delicate, non-spammy animations per day!
export function fireDayAnimation(dayId) {
  const numericId = Number(dayId) || 1;
  const mode = numericId % 12;

  switch (mode) {
    case 1: fireHeartExplosion(); break;
    case 2: fireGoldStarShower(); break;
    case 3: fireDiamondSplash(); break;
    case 4: fireLoveRain(); break;
    case 5: fireGoldenRing(); break;
    case 6: fireKissBurst(); break;
    case 7: fireCupidArrow(); break;
    case 8: fireGiftPop(); break;
    case 9: fireButterflyFlutter(); break;
    case 10: fireSparklerPop(); break;
    case 11: fireChampagnePop(); break;
    default: fireRoseKiss(); break;
  }
}

export function fireHeartConfetti() {
  fireHeartExplosion();
}

