import { useState, useEffect } from "react";

interface Props {
  label: string;
  onChange: (value: string) => void;
}

export default function ShortcutInputButton({ label, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const [currentCombo, setCurrentCombo] = useState("");

  useEffect(() => {
    if (!recording) return;

    function listener(e: KeyboardEvent) {
      e.preventDefault();

      const parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.metaKey) parts.push("Cmd");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!["Control", "Shift", "Meta", "Alt"].includes(e.key)) {
        parts.push(keyName);
      }

      const combo = parts.join(" + ");
      setCurrentCombo(combo);
      onChange(combo);
      setRecording(false);
    }

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [recording]);

  return (
    <div className="flex items-center gap-4">
      {/* Chip do atalho */}
      <span className="px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700 text-sm">
        {currentCombo || label}
      </span>

      {/* Botão Change */}
      <button
        className="px-4 py-2 rounded-lg border text-sm bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
        onClick={() => {
          setRecording(true);
          setCurrentCombo("Pressione as teclas...");
        }}
      >
        {recording ? "Gravando..." : "Change"}
      </button>
    </div>
  );
}

