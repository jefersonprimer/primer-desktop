// src/components/StealthControls.tsx
import React, { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface StealthStatus {
  active: boolean;
  method: string;
  click_through: boolean;
  hidden_from_dock: boolean;
  os: string;
}

interface CaptureFrame {
  width: number;
  height: number;
  data: number[]; // Vec<u8> becomes number[] in JS
}

const StealthControls: React.FC = () => {
  const [stealthStatus, setStealthStatus] = useState<StealthStatus | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastFrame, setLastFrame] = useState<CaptureFrame | null>(null);

  useEffect(() => {
    // Initial status check
    getStealthStatus();

    // Listen for stealth-frame events
    const unlistenPromise = listen<CaptureFrame>('stealth-frame', (eventPayload) => {
      // console.log('Received stealth frame:', eventPayload.payload.width, eventPayload.payload.height);
      setLastFrame(eventPayload.payload);
    });

    return () => {
      unlistenPromise.then(f => f()); // Clean up listener
    };
  }, []);

  useEffect(() => {
    if (lastFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = lastFrame.width;
        canvas.height = lastFrame.height;

        const imageData = ctx.createImageData(lastFrame.width, lastFrame.height);
        // Assuming BGRA from XGetImage output
        for (let i = 0; i < lastFrame.data.length; i += 4) {
          imageData.data[i + 0] = lastFrame.data[i + 2]; // R (from B)
          imageData.data[i + 1] = lastFrame.data[i + 1]; // G (from G)
          imageData.data[i + 2] = lastFrame.data[i + 0]; // B (from R)
          imageData.data[i + 3] = lastFrame.data[i + 3]; // A (from A)
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [lastFrame]);


  const getStealthStatus = async () => {
    try {
      const status: StealthStatus = await invoke('get_stealth_status_cmd');
      setStealthStatus(status);
    } catch (e) {
      alert(`Error getting stealth status: ${e}`);
    }
  };

  const handleEnableClickThrough = async () => {
    try {
      await invoke('enable_click_through_cmd');
      alert('Click-through enabled!');
      getStealthStatus();
    } catch (e) {
      alert(`Error enabling click-through: ${e}`);
    }
  };

  const handleDisableClickThrough = async () => {
    try {
      await invoke('disable_click_through_cmd');
      alert('Click-through disabled!');
      getStealthStatus();
    } catch (e) {
      alert(`Error disabling click-through: ${e}`);
    }
  };

  const handleHideFromTaskbar = async () => {
    try {
      await invoke('hide_from_taskbar_cmd');
      alert('Hidden from taskbar!');
      getStealthStatus();
    } catch (e) {
      alert(`Error hiding from taskbar: ${e}`);
    }
  };

  const handleShowInTaskbar = async () => {
    try {
      await invoke('show_in_taskbar_cmd');
      alert('Shown in taskbar!');
      getStealthStatus();
    } catch (e) {
      alert(`Error showing in taskbar: ${e}`);
    }
  };

  const handleEnableStealthMode = async () => {
    try {
      const status: StealthStatus = await invoke('enable_stealth_mode_cmd');
      setStealthStatus(status);
      alert('Stealth Mode enabled!');
    } catch (e) {
      alert(`Error enabling Stealth Mode: ${e}`);
    }
  };

  const handleDisableStealthMode = async () => {
    try {
      await invoke('disable_stealth_mode_cmd');
      setStealthStatus(prev => prev ? { ...prev, active: false } : null);
      alert('Stealth Mode disabled!');
    } catch (e) {
      alert(`Error disabling Stealth Mode: ${e}`);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
      <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Stealth Controls</h3>
      
      <p style={{ color: 'white' }}>Status: {stealthStatus?.active ? 'Active' : 'Inactive'}</p>
      <p style={{ color: 'white' }}>Method: {stealthStatus?.method}</p>
      <p style={{ color: 'white' }}>OS: {stealthStatus?.os}</p>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
        <button onClick={handleEnableStealthMode}>Enable Stealth Mode</button>
        <button onClick={handleDisableStealthMode}>Disable Stealth Mode</button>
        <button onClick={getStealthStatus}>Refresh Status</button>
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
        <button onClick={handleEnableClickThrough}>Enable Click-Through</button>
        <button onClick={handleDisableClickThrough}>Disable Click-Through</button>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button onClick={handleHideFromTaskbar}>Hide from Taskbar</button>
        <button onClick={handleShowInTaskbar}>Show in Taskbar</button>
      </div>

      <h4 style={{ color: 'white', margin: '10px 0 5px 0' }}>Captured Frame:</h4>
      <canvas ref={canvasRef} style={{ border: '1px solid white', maxWidth: '300px', height: 'auto' }}></canvas>
    </div>
  );
};

export default StealthControls;
