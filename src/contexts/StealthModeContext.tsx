import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { listen } from '@tauri-apps/api/event';
import { 
  getStealthStatus,
  enableClickThrough as enableClickThroughCmd,
  disableClickThrough as disableClickThroughCmd,
  setAlwaysOnTop
} from '../lib/tauri';
import {
  enableFullStealth,
  disableFullStealth
} from '../stealth';

interface StealthModeContextType {
  isStealth: boolean;
  isClickThrough: boolean;
  isAlwaysOnTop: boolean;
  toggleStealth: () => Promise<void>;
  toggleClickThrough: () => Promise<void>;
  toggleAlwaysOnTop: () => Promise<void>;
  setIsStealthDirectly: (value: boolean) => void;
}

const StealthModeContext = createContext<StealthModeContextType | undefined>(undefined);

export const StealthModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isStealth, setIsStealth] = useState(false);
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  useEffect(() => {
    // Sync initial state
    getStealthStatus().then((status) => {
      setIsStealth(status.active);
      setIsClickThrough(status.click_through);
      // Backend doesn't return always_on_top in status yet, assume false or check if active implies it
      if (status.active) {
          setIsAlwaysOnTop(true);
      }
    }).catch(err => console.error("Failed to get stealth status:", err));

    // Listen for global stealth toggle events (e.g. from hotkey)
    const unlistenPromise = listen<boolean>('stealth_change', (_event) => {
      // Refresh status when global event happens
      getStealthStatus().then((status) => {
        setIsStealth(status.active);
        setIsClickThrough(status.click_through);
        if (status.active) {
            setIsAlwaysOnTop(true);
        } else {
            setIsAlwaysOnTop(false);
        }
      });
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
        setIsClickThrough(true);
        setIsAlwaysOnTop(true);
        // Ensure always on top is actually set if enableFullStealth doesn't cover it for all OS
        await setAlwaysOnTop(true);
      } else {
        // Deactivate full stealth
        await disableFullStealth();
        setIsClickThrough(false);
        setIsAlwaysOnTop(false);
        await setAlwaysOnTop(false);
      }
    } catch (error) {
      console.error("Failed to toggle stealth mode:", error);
      setIsStealth(!targetState); // Revert on error
    }
  };

  const toggleClickThrough = async () => {
    const targetState = !isClickThrough;
    try {
      setIsClickThrough(targetState);
      if (targetState) {
        await enableClickThroughCmd();
      } else {
        await disableClickThroughCmd();
      }
    } catch (error) {
      console.error("Failed to toggle click through:", error);
      setIsClickThrough(!targetState);
    }
  };

  const toggleAlwaysOnTop = async () => {
    const targetState = !isAlwaysOnTop;
    try {
      setIsAlwaysOnTop(targetState);
      await setAlwaysOnTop(targetState);
    } catch (error) {
       console.error("Failed to toggle always on top:", error);
       setIsAlwaysOnTop(!targetState);
    }
  };

  return (
    <StealthModeContext.Provider value={{ isStealth, isClickThrough, isAlwaysOnTop, toggleStealth, toggleClickThrough, toggleAlwaysOnTop, setIsStealthDirectly }}>
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
