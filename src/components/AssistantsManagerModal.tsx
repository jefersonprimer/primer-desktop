import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { 
  getPromptPresets, 
  createPromptPreset, 
  updatePromptPreset, 
  deletePromptPreset, 
  type PromptPreset 
} from "../lib/tauri";

import CloseIcon from "./ui/icons/CloseIcon";

export default function AssistantsManagerModal({ onClose }: { onClose: () => void; open?: boolean }) {
  const { t } = useTranslation();
  const [assistants, setAssistants] = useState<PromptPreset[]>([]);
  const [selected, setSelected] = useState<PromptPreset | null>(null);
  
  // Form state
  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const data = await getPromptPresets();
      setAssistants(data);
      // Select first or maintain selection
      if (!selected && data.length > 0) {
        setSelected(data[0]);
      } else if (selected && selected.id !== 'new') {
          // Re-select updated preset
          const updated = data.find(p => p.id === selected.id);
          if (updated) setSelected(updated);
          else if (data.length > 0) setSelected(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditPrompt(selected.prompt);
      setEditDesc(selected.description || "");
    }
  }, [selected]);

  async function handleSave() {
      if (!selected) return;

      let finalName = editName.trim();
      const defaultName = t('assistantsManager.defaultName');
      
      // Smart naming: if name is empty or default, try to grab first line of prompt
      if (!finalName || finalName === defaultName) {
          const firstLine = editPrompt.trim().split('\n')[0].trim();
          if (firstLine) {
              finalName = firstLine.substring(0, 50);
              if (firstLine.length > 50) finalName += '...';
          } else {
              finalName = defaultName;
          }
      }

      try {
          if (selected.id === 'new') {
               // Create
               const newPreset = await createPromptPreset({
                   name: finalName,
                   description: editDesc,
                   prompt: editPrompt
               });
               await loadPresets();
               setSelected(newPreset);
          } else {
              // Update
              await updatePromptPreset({
                  id: selected.id,
                  name: finalName,
                  description: editDesc,
                  prompt: editPrompt
               });
               await loadPresets();
          }
      } catch (e) {
          console.error("Failed to save:", e);
      }
  }

  async function handleCreateNew() {
      const newPlaceholder: PromptPreset = {
          id: 'new',
          name: '', // Empty name so placeholder shows and smart naming kicks in
          description: '',
          prompt: '',
          is_built_in: false,
          created_at: '',
          updated_at: ''
      };
      setSelected(newPlaceholder);
      setEditName('');
      setEditPrompt('');
      setEditDesc('');
      
      // Focus title after a small delay to allow render
      setTimeout(() => {
          titleInputRef.current?.focus();
      }, 50);
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-[9999]">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700">
        <div className="flex h-[600px]">

          <aside className="w-72 bg-[#181719] border-r border-neutral-700 p-2 overflow-y-auto">
             <div className="flex items-center justify-between px-1 py-3 shrink-0">
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-full transition-colors"
              >
                <CloseIcon size={20}/>
              </button>
            </div>

            {assistants.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={`p-3 rounded-lg  transition mb-1 ${selected?.id === a.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <p className="text-white text-sm font-medium">{a.name || t('assistantsManager.untitled')}</p>
                <p className="text-xs text-white/40">{a.is_built_in ? t('assistantsManager.builtin') : t('assistantsManager.custom')}</p>
              </div>
            ))}

            <button 
                onClick={handleCreateNew}
                className="mt-3 w-full p-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 transition"
            >
              {t('assistantsManager.createNew')}
            </button>
          </aside>

          <div className="flex-1 bg-[#1D1D1F] p-8 overflow-y-auto flex flex-col">
            <div className="flex-1 flex flex-col gap-2">
                <input 
                    ref={titleInputRef}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder={selected?.is_built_in ? "" : t('assistantsManager.newPresetPlaceholder')}
                    disabled={selected?.is_built_in}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            promptInputRef.current?.focus();
                        }
                    }}
                    className="text-base font-bold text-white bg-transparent border-none focus:outline-none placeholder:text-neutral-600 w-full"
                />

                <textarea
                    ref={promptInputRef}
                    className="flex-1 w-full bg-transparent text-white text-sm focus:outline-none resize-none font-mono leading-relaxed placeholder:text-neutral-600 mt-2"
                    placeholder={selected?.is_built_in ? "" : t('assistantsManager.instructionsPlaceholder')}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    disabled={selected?.is_built_in}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace' && editPrompt === '') {
                            e.preventDefault();
                            titleInputRef.current?.focus();
                        }
                    }}
                />
            </div>
            
            {selected?.is_built_in && (
                <p className="text-xs text-white/40 mt-4 border-t border-white/5 pt-4">{t('assistantsManager.builtinWarning')}</p>
            )}

            {!selected?.is_built_in && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                    {t('assistantsManager.saveChanges')}
                    </button>
                    {selected?.id !== 'new' && (
                      <button 
                        onClick={async () => {
                          if (confirm(t('assistantsManager.deleteConfirm'))) {
                            if (selected) {
                                await deletePromptPreset(selected.id);
                                // Reset to first available or empty
                                setSelected(null);
                                await loadPresets();
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-sm transition-colors"
                      >
                      {t('assistantsManager.delete')}
                      </button>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
