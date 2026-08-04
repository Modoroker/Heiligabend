import confetti from 'canvas-confetti';

export function fireHeartConfetti() {
  // Fire romantic heart and gold confetti particles
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  // Hearts and sparkles burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#B76E79', '#E8B4B8', '#FFD1DC']
  });

  fire(0.2, {
    spread: 60,
    colors: ['#F7E7CE', '#D4AF37', '#FFFFFF']
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#B76E79', '#9B525E', '#FFB6C1']
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#F7E7CE', '#E6C687']
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#FFD1DC', '#E8B4B8']
  });
}
