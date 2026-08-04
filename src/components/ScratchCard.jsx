import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Heart } from 'lucide-react';

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
    const width = rect.width;
    const height = rect.height;

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

    // Overlay subtle pattern/texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Overlay text & hint
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('✨ Rubbel mich frei! ✨', width / 2, height / 2 - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('Mit dem Finger drüberstreichen ❤️', width / 2, height / 2 + 15);
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
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

  // Scratch action
  const scratch = (clientX, clientY) => {
    if (isCompletedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch Handlers
  const handleTouchStart = (e) => {
    setIsDrawing(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDrawing || !e.touches[0]) return;
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  if (isScratched) {
    return null; // Reveal content completely
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 rounded-2xl overflow-hidden cursor-pointer select-none touch-none shadow-inner"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
