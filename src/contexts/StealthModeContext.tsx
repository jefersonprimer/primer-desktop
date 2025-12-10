import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { listen } from '@tauri-apps/api/event';
import { 
  getStealthStatus
} from '../lib/tauri';
import {
  enableFullStealth,
  disableFullStealth
} from '../stealth';

interface StealthModeContextType {
  isStealth: boolean;
  toggleStealth: () => Promise<void>;
  setIsStealthDirectly: (value: boolean) => void;
}

const StealthModeContext = createContext<StealthModeContextType | undefined>(undefined);

export const StealthModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isStealth, setIsStealth] = useState(false);

  useEffect(() => {
    // Sync initial state
    getStealthStatus().then((status) => {
      setIsStealth(status.active);
    }).catch(err => console.error("Failed to get stealth status:", err));

    // Listen for global stealth toggle events (e.g. from hotkey)
    const unlistenPromise = listen<boolean>('stealth_change', (event) => {
      setIsStealth(event.payload);
    });

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  // Function to directly set stealth mode, useful for initial load or external triggers
  const setIsStealthDirectly = (value: boolean) => {
    setIsStealth(value);
  };

  const toggleStealth = async () => {
    const targetState = !isStealth;
    try {
      setIsStealth(targetState); // Optimistic update
      
      if (targetState) {
        // Activate full stealth (Stealth, ClickThrough, Taskbar, Opacity, AlwaysOnTop)
        await enableFullStealth();
      } else {
        // Deactivate full stealth
        await disableFullStealth();
      }
    } catch (error) {
      console.error("Failed to toggle stealth mode:", error);
      setIsStealth(!targetState); // Revert on error
    }
  };

  return (
    <StealthModeContext.Provider value={{ isStealth, toggleStealth, setIsStealthDirectly }}>
      {children}
    </StealthModeContext.Provider>
  );
};

export const useStealthMode = () => {
  const context = useContext(StealthModeContext);
  if (context === undefined) {
    throw new Error('useStealthMode must be used within a StealthModeProvider');
  }
  return context;
};
