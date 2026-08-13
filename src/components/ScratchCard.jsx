import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ScratchCard({ onComplete, threshold = 0.4 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const isDrawingRef = useRef(false);
  const isCompletedRef = useRef(false);
  const hasScratchedRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastCheckTimeRef = useRef(0);
  const pendingCheckRef = useRef(false);
  const checkTimeoutRef = useRef(null);

  // Preload 3D seal image for the scratch surface
  const sealImgRef = useRef(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/sprites/wax-seal.png';
    img.onload = () => {
      sealImgRef.current = img;
      if (!hasScratchedRef.current) initCanvas();
    };
    sealImgRef.current = img;
    return () => {
      img.onload = null;
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  // Initialize Canvas luxury scratch layer
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

    // 1. Draw luxury metallic brushed rose-gold & ruby foil gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2D0A14');
    gradient.addColorStop(0.2, '#581C28');
    gradient.addColorStop(0.5, '#9F4958');
    gradient.addColorStop(0.75, '#D4AF37');
    gradient.addColorStop(0.9, '#E8B4B8');
    gradient.addColorStop(1, '#3B0D18');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ornate Golden Filigree Frame
    ctx.strokeStyle = 'rgba(247, 231, 206, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(12, 12, width - 24, height - 24);
    ctx.setLineDash([]); // Reset line dash

    // 3. Starlight sparkle dust overlay
    ctx.fillStyle = 'rgba(255, 245, 200, 0.35)';
    for (let i = 18; i < width - 18; i += 22) {
      for (let j = 18; j < height - 18; j += 22) {
        if ((i * 3 + j * 7) % 5 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Corner Star Glints
    const drawCornerStar = (cx, cy) => {
      ctx.fillStyle = '#FFF5C2';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCornerStar(8, 8);
    drawCornerStar(width - 8, 8);
    drawCornerStar(8, height - 8);
    drawCornerStar(width - 8, height - 8);

    // 4. Center 3D Royal Seal Emblem
    const sealSize = Math.min(84, Math.max(54, Math.floor(height * 0.36)));
    const sealX = width / 2;
    const sealY = height * 0.38;

    // Glowing halo behind seal
    const haloGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealSize * 0.8);
    haloGrad.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
    haloGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealSize * 0.8, 0, Math.PI * 2);
    ctx.fill();

    const sealImg = sealImgRef.current;
    if (sealImg && sealImg.complete && sealImg.naturalWidth > 0) {
      ctx.drawImage(sealImg, sealX - sealSize / 2, sealY - sealSize / 2, sealSize, sealSize);
    } else {
      // Fallback golden circle badge
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💖', sealX, sealY);
    }

    // 5. Luxury Embossed Typography
    ctx.fillStyle = '#FFF5C2';
    ctx.font = 'bold 15px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillText('✨ RUBBEL MICH FREI ✨', width / 2, sealY + sealSize / 2 + 22);

    ctx.fillStyle = '#FCE7F3';
    ctx.font = '12px sans-serif';
    ctx.shadowBlur = 4;
    ctx.fillText('Mit dem Finger drüberstreichen ❤️', width / 2, sealY + sealSize / 2 + 40);

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
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(() => {
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
    isDrawingRef.current = true;
    lastPointRef.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    e.stopPropagation();
    if (!isDrawingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = (e) => {
    if (e) e.stopPropagation();
    isDrawingRef.current = false;
    lastPointRef.current = null;
    schedulePercentageCheck(true);
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    e.stopPropagation();
    isDrawingRef.current = true;
    lastPointRef.current = null;
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (!isDrawingRef.current || !e.touches[0]) return;
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (e) e.stopPropagation();
    isDrawingRef.current = false;
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
