import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import ShortcutInputButton from "./ShortcutInputButton";
import { useAuth } from "../../contexts/AuthContext";

interface ShortcutDto {
  id: string;
  user_id: string;
  action: string;
  keys: string;
}

interface GetShortcutsResponse {
  shortcuts: ShortcutDto[];
}

export default function ShortcutsTab() {
  const { userId } = useAuth();
  const [shortcuts, setShortcuts] = useState({
    ask: "Ctrl + Enter",
    screenshot: "Ctrl + E",
    voice: "Ctrl + D",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      loadShortcuts();
    }
  }, [userId]);

  async function loadShortcuts() {
    try {
      setLoading(true);
      const res = await invoke<GetShortcutsResponse>("get_shortcuts", {
        dto: { user_id: userId },
      });
      
      const newShortcuts = { ...shortcuts };
      res.shortcuts.forEach(s => {
        if (s.action === "ask") newShortcuts.ask = s.keys;
        if (s.action === "screenshot") newShortcuts.screenshot = s.keys;
        if (s.action === "voice") newShortcuts.voice = s.keys;
      });
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error("Failed to load shortcuts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    try {
      setSaving(true);
      const actions = [
        { action: "ask", keys: shortcuts.ask },
        { action: "screenshot", keys: shortcuts.screenshot },
        { action: "voice", keys: shortcuts.voice },
      ];

      for (const item of actions) {
        await invoke("save_shortcut", {
          dto: {
            user_id: userId,
            action: item.action,
            keys: item.keys,
          },
        });
      }
      alert("Atalhos salvos com sucesso!");
    } catch (error) {
      console.error("Failed to save shortcuts:", error);
      alert("Erro ao salvar atalhos.");
    } finally {
      setSaving(false);
    }
  }

  function updateShortcut(key: keyof typeof shortcuts, value: string) {
    setShortcuts(prev => ({ ...prev, [key]: value }));
  }

  if (loading) return <div className="p-6 text-neutral-400">Carregando atalhos...</div>;

  return (
    <div className="p-6 w-full space-y-6 pb-8">
      <h2 className="text-2xl font-semibold">Atalhos de Teclado</h2>
      <p className="text-neutral-400">
        Personalize os atalhos de teclado para corresponder ao seu fluxo.
        Clique em "Alterar" para gravar um novo atalho.
      </p>

      {/* Card — Perguntar */}
      <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-medium">Perguntar Qualquer Coisa / Enviar</h3>
        <p className="text-neutral-400 mt-1 mb-4 text-sm">
          Envie seu prompt ou abra a entrada de texto para fazer uma pergunta.
        </p>

        <ShortcutInputButton
          label={shortcuts.ask}
          onChange={(v) => updateShortcut("ask", v)}
        />
      </div>

      {/* Card — Captura */}
      <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-medium">Capturar Captura de Tela</h3>
        <p className="text-neutral-400 mt-1 mb-4 text-sm">
          Capture uma captura de tela da sua tela para análise.
        </p>

        <ShortcutInputButton
          label={shortcuts.screenshot}
          onChange={(v) => updateShortcut("screenshot", v)}
        />
      </div>

      {/* Card — Voz */}
      <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-medium">Gravação de Voz</h3>
        <p className="text-neutral-400 mt-1 mb-4 text-sm">
          Inicie ou pare a gravação de voz para transcrição.
        </p>

        <ShortcutInputButton
          label={shortcuts.voice}
          onChange={(v) => updateShortcut("voice", v)}
        />
      </div>

      <div className="w-full flex justify-end mt-6">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
