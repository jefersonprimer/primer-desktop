import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowFrameProps {
  children: React.ReactNode;
}

export default function WindowFrame({ children }: WindowFrameProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    
    const updateState = async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch (e) {
        console.error("Failed to get window state", e);
      }
    };

    updateState();

    const unlisten = appWindow.onResized(async () => {
      updateState();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div
      className={`relative w-full h-screen ${
        !isMaximized ? "rounded-xl border border-white/10 shadow-2xl" : ""
      }`}
      style={{
        // This ensures 'fixed' children (like TitleBar) are clipped by overflow: hidden
        // when a border radius is applied.
        transform: !isMaximized ? "translateZ(0)" : "none",
        overflow: !isMaximized ? "hidden" : "visible",
      }}
    >
      {children}
    </div>
  );
}
