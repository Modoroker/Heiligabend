import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ScratchCard({ onComplete, threshold = 0.4 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const isCompletedRef = useRef(false);
  const hasScratchedRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastCheckTimeRef = useRef(0);
  const pendingCheckRef = useRef(false);

  // Initialize Canvas scratch layer
  const initCanvas = useCallback(() => {
    // If user has already scratched significantly, do not wipe progress on resize
    if (hasScratchedRef.current || isCompletedRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width || container.clientWidth || 300);
    const height = Math.floor(rect.height || container.clientHeight || 180);

    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Draw metallic rose-gold gradient cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e2a9b2');
    gradient.addColorStop(0.3, '#d4af37');
    gradient.addColorStop(0.6, '#b76e79');
    gradient.addColorStop(1, '#8b4513');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Overlay subtle sparkle texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 10; i < width; i += 24) {
      for (let j = 10; j < height; j += 24) {
        if ((i + j) % 3 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Overlay text & hint
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText('✨ Rubbel mich frei! ✨', width / 2, height / 2 - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('Mit dem Finger drüberstreichen ❤️', width / 2, height / 2 + 15);

    ctx.restore();
  }, []);

  useEffect(() => {
    // Initial draw
    initCanvas();

    // Use ResizeObserver for responsive resize tracking
    let observer;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        if (!hasScratchedRef.current) {
          requestAnimationFrame(initCanvas);
        }
      });
      observer.observe(containerRef.current);
    }

    const timer = setTimeout(() => {
      if (!hasScratchedRef.current) initCanvas();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [initCanvas]);

  // High-performance downsampled scratch percentage check
  const checkScratchPercentage = useCallback(() => {
    if (isCompletedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    let sampleCount = 0;

    // Fast sampling (check every 16th pixel = 64 bytes in rgba array)
    const step = 64;
    for (let i = 3; i < pixels.length; i += step) {
      sampleCount++;
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    if (sampleCount === 0) return;
    const percentCleared = transparentPixels / sampleCount;

    if (percentCleared >= threshold && !isCompletedRef.current) {
      isCompletedRef.current = true;
      setIsScratched(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [threshold, onComplete]);

  // Throttled percentage check to keep 60fps on mobile touch
  const schedulePercentageCheck = useCallback((force = false) => {
    const now = Date.now();
    if (force || now - lastCheckTimeRef.current > 150) {
      lastCheckTimeRef.current = now;
      pendingCheckRef.current = false;
      checkScratchPercentage();
    } else if (!pendingCheckRef.current) {
      pendingCheckRef.current = true;
      setTimeout(() => {
        if (pendingCheckRef.current) {
          pendingCheckRef.current = false;
          lastCheckTimeRef.current = Date.now();
          checkScratchPercentage();
        }
      }, 150);
    }
  }, [checkScratchPercentage]);

  // Continuous ribbon scratch action with dynamic coordinate scaling
  const scratch = (clientX, clientY) => {
    if (isCompletedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    hasScratchedRef.current = true;

    // Adjust for High-DPI canvas backing buffer
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = 36 * (scaleX / (window.devicePixelRatio || 1));

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPointRef.current = { x, y };
    schedulePercentageCheck(false);
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDrawing(true);
    lastPointRef.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    e.stopPropagation();
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = (e) => {
    if (e) e.stopPropagation();
    setIsDrawing(false);
    lastPointRef.current = null;
    schedulePercentageCheck(true);
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    e.stopPropagation();
    setIsDrawing(true);
    lastPointRef.current = null;
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (!isDrawing || !e.touches[0]) return;
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (e) e.stopPropagation();
    setIsDrawing(false);
    lastPointRef.current = null;
    schedulePercentageCheck(true);
  };

  if (isScratched) {
    return null; // Reveal content completely
  }

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="Rubbelkarte zum Freirubbeln"
      className="absolute inset-0 z-30 rounded-2xl overflow-hidden cursor-pointer select-none touch-none shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
