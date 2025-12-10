import { useEffect, useState } from "react";

interface TopDockProps {
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export default function TopDock({ onClose, onSubmit }: TopDockProps) {
  const [shown, setShown] = useState(false);
  const [input, setInput] = useState("");

  // animação de entrada
  useEffect(() => {
    setTimeout(() => setShown(true), 10);
  }, []);

  // fechar com ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSubmit(input);
    setInput("");
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
        <button className="flex justify-center items-center px-4 py-2 gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">
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

          Capturar tela
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
