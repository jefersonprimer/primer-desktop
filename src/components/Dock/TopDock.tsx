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
        fixed top-0 left-0 w-full h-40 
        bg-black/40 backdrop-blur-xl border-b border-white/10
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
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">
          ⌘E Capturar tela
        </button>

        <button 
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          Enter Enviar
        </button>

        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-700 text-white text-sm"
        >
          ESC Fechar
        </button>
      </div>
    </div>
  );
}