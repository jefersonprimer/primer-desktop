import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TopDockProps {
  onClose: () => void;
  onSubmit: (text: string, image?: string) => void;
}

export default function TopDock({ onClose, onSubmit }: TopDockProps) {
  const [shown, setShown] = useState(false);
  const [input, setInput] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // animação de entrada
  useEffect(() => {
    setTimeout(() => setShown(true), 10);
  }, []);

  // fechar com ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      // Shortcut for capture: Ctrl+E (matches UI)
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        handleCapture();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCapture = async () => {
    setIsCapturing(true);
    // Hide window briefly to capture? 
    // Actually, user wants to capture what's on screen. The TopDock overlays it.
    // If I hide TopDock, I need to bring it back.
    // But invoke is async.
    // Let's try capturing directly first. TopDock backdrop is blurry/transparent.
    try {
        // Ideally we should hide the window, capture, and show it again.
        // But for now let's just capture.
        const image = await invoke<string>("capture_screen");
        setCapturedImage(image);
    } catch (e) {
        console.error("Failed to capture screen", e);
    } finally {
        setIsCapturing(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() && !capturedImage) return;
    onSubmit(input, capturedImage || undefined);
    setInput("");
    setCapturedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`
        absolute top-0 left-0 w-full h-40 
        bg-transparent backdrop-blur-xl 
        transition-all duration-300 z-[99999]
        flex flex-col items-center justify-start pt-4
        ${shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"}
      `}
    >
      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 mt-2 group">
            <div className="relative">
                <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="h-20 w-auto rounded-lg border border-white/20 shadow-lg"
                />
                <button 
                    onClick={() => setCapturedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
      )}

      {/* Input */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full max-w-xl rounded-xl bg-black/60 border border-white/10 px-4 py-3
                   text-white placeholder-white/40 focus:outline-none focus:ring-2
                   focus:ring-blue-500"
        placeholder="Comece a digitar... (pressione Enter para enviar)"
      />

      {/* Botões */}
      <div className="mt-3 flex gap-3">
        <button 
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex justify-center items-center px-4 py-2 gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-50"
        >
          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            Ctrl
          </span>
          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            E
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="20" height="14" x="2" y="3" rx="2"/>
            <line x1="8" x2="16" y1="21" y2="21"/>
            <line x1="12" x2="12" y1="17" y2="21"/>
          </svg>

          {isCapturing ? "Capturando..." : "Capturar tela"}
        </button>

        <button 
          onClick={handleSubmit}
          className="flex justify-center items-center px-4 py-2 gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            Enter
          </span>
          Enter Enviar
        </button>

        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="flex justify-center items-center px-4 py-2 gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          <span className="text-[12px] font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/70 group-hover:text-white transition">
            ESC
          </span>
          Fechar
        </button>
      </div>
    </div>
  );
}
