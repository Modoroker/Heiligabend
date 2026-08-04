import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function ScratchCard({ onComplete, threshold = 0.4 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const isCompletedRef = useRef(false);

  // Initialize Canvas scratch layer
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || container.clientWidth || 300;
    const height = rect.height || container.clientHeight || 180;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw metallic rose-gold gradient cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e2a9b2');
    gradient.addColorStop(0.3, '#d4af37');
    gradient.addColorStop(0.6, '#b76e79');
    gradient.addColorStop(1, '#8b4513');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Overlay subtle sparkle texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
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
  }, []);

  useEffect(() => {
    initCanvas();

    // Re-initialize canvas at 100ms, 300ms, and 550ms after Framer Motion 3D modal entrance ends
    const timers = [
      setTimeout(initCanvas, 100),
      setTimeout(initCanvas, 300),
      setTimeout(initCanvas, 550),
    ];

    const handleResize = () => setTimeout(initCanvas, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('resize', handleResize);
    };
  }, [initCanvas]);

  // Check how much percent has been cleared
  const checkScratchPercentage = useCallback(() => {
    if (isCompletedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    // Check alpha channel (index 3)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const totalPixels = pixels.length / 4;
    const percentCleared = transparentPixels / totalPixels;

    if (percentCleared >= threshold && !isCompletedRef.current) {
      isCompletedRef.current = true;
      setIsScratched(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [threshold, onComplete]);

  // Scratch action with dynamic coordinate scaling
  const scratch = (clientX, clientY) => {
    if (isCompletedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Adjust for current CSS scaling / 3D transform matrix
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2); // 36px radius
    ctx.fill();

    checkScratchPercentage();
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDrawing(true);
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
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    e.stopPropagation();
    setIsDrawing(true);
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
  };

  if (isScratched) {
    return null; // Reveal content completely
  }

  return (
    <div
      ref={containerRef}
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
