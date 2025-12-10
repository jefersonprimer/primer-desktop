import React, { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useStealthMode } from '../contexts/StealthModeContext';

interface CaptureFrame {
  width: number;
  height: number;
  data: number[];
}

const StealthMirror: React.FC = () => {
  const { isStealth } = useStealthMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isStealth) return;

    // Listen for stealth-frame events from the backend (Linux/Windows Mirror)
    const unlistenPromise = listen<CaptureFrame>('stealth-frame', (event) => {
      const frame = event.payload;
      const canvas = canvasRef.current;
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Update canvas size if changed
          if (canvas.width !== frame.width || canvas.height !== frame.height) {
             canvas.width = frame.width;
             canvas.height = frame.height;
          }

          const imageData = ctx.createImageData(frame.width, frame.height);
          // Assuming BGRA/RGBA data. Adjust loop based on raw format if colors are swapped.
          // Linux X11 (XGetImage) usually returns BGRA.
          for (let i = 0; i < frame.data.length; i += 4) {
            imageData.data[i + 0] = frame.data[i + 2]; // R (from B)
            imageData.data[i + 1] = frame.data[i + 1]; // G (from G)
            imageData.data[i + 2] = frame.data[i + 0]; // B (from R)
            imageData.data[i + 3] = frame.data[i + 3]; // A (from A)
          }
          ctx.putImageData(imageData, 0, 0);
        }
      }
    });

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [isStealth]);

  if (!isStealth) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-50 w-full h-full object-cover pointer-events-none"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}
    />
  );
};

export default StealthMirror;
