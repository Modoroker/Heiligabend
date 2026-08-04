import confetti from 'canvas-confetti';

// 1. Romantic Heart & Rose Gold Burst
export function fireHeartExplosion() {
  const count = 180;
  const defaults = { origin: { y: 0.7 } };

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.35),
    spread: 70,
    startVelocity: 50,
    colors: ['#B76E79', '#E8B4B8', '#FFD1DC', '#FFB6C1']
  });

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.25),
    spread: 110,
    decay: 0.91,
    scalar: 1.2,
    colors: ['#F7E7CE', '#D4AF37', '#FFFFFF']
  });
}

// 2. Champagne Gold Star Shower
export function fireGoldStarShower() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 20 * (timeLeft / duration);
    confetti({
      startVelocity: 35,
      spread: 360,
      ticks: 60,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: ['#F7E7CE', '#D4AF37', '#E6C687', '#FFFFFF']
    });
  }, 250);
}

// 3. Side Fireworks Cannons
export function fireFireworksCannons() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#B76E79', '#F7E7CE', '#E8B4B8']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#D4AF37', '#FFD1DC', '#9B525E']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

// 4. Gentle Love Rain
export function fireLoveRain() {
  confetti({
    particleCount: 100,
    spread: 160,
    startVelocity: 25,
    decay: 0.94,
    gravity: 0.6,
    origin: { y: 0 },
    colors: ['#FFD1DC', '#E8B4B8', '#B76E79', '#F7E7CE']
  });
}

// 5. 360-degree Golden Ring Burst
export function fireGoldenRing() {
  confetti({
    particleCount: 120,
    spread: 360,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors: ['#D4AF37', '#F7E7CE', '#B76E79', '#FFFFFF']
  });
}

// Main Router: assigns a unique animation experience per day!
export function fireDayAnimation(dayId) {
  const mode = dayId % 5;
  if (mode === 1) fireHeartExplosion();
  else if (mode === 2) fireGoldStarShower();
  else if (mode === 3) fireFireworksCannons();
  else if (mode === 4) fireLoveRain();
  else fireGoldenRing();
}

export function fireHeartConfetti() {
  fireHeartExplosion();
}
