import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
// import { invoke } from "@tauri-apps/api/core";
// import { getCurrentWindow } from "@tauri-apps/api/window";

interface DockVisibilityContextType {
  isDockHidden: boolean;
  isFocusMode: boolean;
  setIsDockHidden: (hidden: boolean) => void;
  setIsFocusMode: (focus: boolean) => void;
}

const DockVisibilityContext = createContext<DockVisibilityContextType | null>(null);

export function useDockVisibility() {
  const context = useContext(DockVisibilityContext);
  if (!context) {
    throw new Error("useDockVisibility must be used within DockVisibilityProvider");
  }
  return context;
}

interface DockVisibilityProviderProps {
  children: ReactNode;
}

export function DockVisibilityProvider({ children }: DockVisibilityProviderProps) {
  const [isDockHidden, setIsDockHidden] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    // Listen for Ctrl+Shift+D - Toggle Dock visibility
    const unlistenDock = listen("toggle_dock_visibility", () => {
      setIsDockHidden((prev) => !prev);
    });

    // Listen for Ctrl+Shift+F - Toggle Focus Mode (only Dock visible)
    const unlistenFocus = listen("toggle_focus_mode", () => {
      setIsFocusMode((prev) => !prev);
    });

    return () => {
      unlistenDock.then((fn: UnlistenFn) => fn());
      unlistenFocus.then((fn: UnlistenFn) => fn());
    };
  }, []);

  return (
    <DockVisibilityContext.Provider
      value={{
        isDockHidden,
        isFocusMode,
        setIsDockHidden,
        setIsFocusMode,
      }}
    >
      {children}
    </DockVisibilityContext.Provider>
  );
}
