import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { invoke } from "@tauri-apps/api/core";
import ShortcutInputButton from "./ShortcutInputButton";
import CircleAlertIcon from "../ui/icons/CircleAlertIcon";
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

export interface ShortcutsTabHandle {
  save: () => Promise<void>;
}

const ShortcutsTab = forwardRef<ShortcutsTabHandle>((_, ref) => {
  const { userId } = useAuth();
    const [shortcuts, setShortcuts] = useState({
      ask: "Ctrl + Enter",
      screenshot: "Ctrl + E",
      voice: "Ctrl + D",
      hide: "Ctrl + \\",
    });
    const [loading, setLoading] = useState(false);
  
    useImperativeHandle(ref, () => ({
      save: handleSave
    }));
  
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
          if (s.action === "hide") newShortcuts.hide = s.keys;
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
        const actions = [
          { action: "ask", keys: shortcuts.ask },
          { action: "screenshot", keys: shortcuts.screenshot },
          { action: "voice", keys: shortcuts.voice },
          { action: "hide", keys: shortcuts.hide },
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
      }
    }
  
    function updateShortcut(key: keyof typeof shortcuts, value: string) {
      setShortcuts(prev => ({ ...prev, [key]: value }));
    }
  
    function resetToDefaults() {
      setShortcuts({
        ask: "Ctrl + Enter",
        screenshot: "Ctrl + E",
        voice: "Ctrl + D",
        hide: "Ctrl + \\",
      });
    }
  
    if (loading) return <div className="px-6 py-4 text-neutral-400">Carregando atalhos...</div>;
  
    return (
      <div className="px-6 py-4 pb-8 bg-black text-neutral-300 h-full overflow-y-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-white mb-2">Atalhos de Teclado</h2>
          <p className="text-sm text-neutral-400">
            Personalize os atalhos de teclado para corresponder ao seu fluxo de trabalho. Clique em "Alterar" para gravar um novo atalho.
          </p>
        </div>
  
        {/* Atalhos */}
        <div className="space-y-4">
          {/* Perguntar Qualquer Coisa / Enviar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-base font-medium text-white mb-1">
              Perguntar Qualquer Coisa / Enviar
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              Envie seu prompt ou abra a entrada de texto para fazer uma pergunta
            </p>
            <ShortcutInputButton
              label={shortcuts.ask}
              onChange={(v) => updateShortcut("ask", v)}
            />
          </div>
  
          {/* Capturar Captura de Tela */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-base font-medium text-white mb-1">
              Capturar Captura de Tela
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              Capture uma captura de tela da sua tela para análise
            </p>
            <ShortcutInputButton
              label={shortcuts.screenshot}
              onChange={(v) => updateShortcut("screenshot", v)}
            />
          </div>
  
          {/* Gravação de Voz */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-base font-medium text-white mb-1">
              Gravação de Voz
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              Inicie ou pare a gravação de voz para transcrição
            </p>
            <ShortcutInputButton
              label={shortcuts.voice}
              onChange={(v) => updateShortcut("voice", v)}
            />
          </div>
  
          {/* Ocultar / Mostrar Janela */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <h3 className="text-base font-medium text-white mb-1">
              Alternar Visibilidade (Stealth)
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              Oculte ou mostre a janela rapidamente (Modo Stealth)
            </p>
            <ShortcutInputButton
              label={shortcuts.hide}
              onChange={(v) => updateShortcut("hide", v)}
            />
          </div>
  
        </div>

      {/* Botão de Reset */}
      <div className="flex justify-end mt-6">
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Redefinir Todos para Padrões
        </button>
      </div>

      {/* Dicas */}
      <div className="mt-6 bg-blue-950/30 border border-blue-900/50 rounded-lg p-4">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center mb-2 gap-1">
            <CircleAlertIcon size={18}/> 
            <p className="font-medium">Dicas:</p>
          </div>
          <div className="text-sm text-neutral-300 space-y-1">
            <ul className="space-y-1 list-disc list-inside">
              <li>Os atalhos devem incluir uma tecla modificadora (Command/Ctrl ou Alt), exceto quando usar uma tecla única permitida como Caps Lock</li>
              <li>As alterações têm efeito imediato</li>
              <li>Os atalhos não podem ser duplicados</li>
              <li>Pressione ESC durante a gravação para cancelar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShortcutsTab;
