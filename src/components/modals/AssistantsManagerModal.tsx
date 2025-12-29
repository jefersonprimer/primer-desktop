import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAi } from "../../contexts/AiContext";
import {
  getPromptPresets,
  getSummaryPresets,
  createPromptPreset,
  updatePromptPreset,
  deletePromptPreset,
  type PromptPreset
} from "../../lib/tauri";

import CloseIcon from "../ui/icons/CloseIcon";
import CheckIcon from "../ui/icons/CheckIcon";

type PresetMode = 'assistant' | 'summary';

export default function AssistantsManagerModal({ onClose }: { onClose: () => void; open?: boolean }) {
  const { t } = useTranslation();
  const { activeSummaryPreset, setActiveSummaryPreset } = useAi();

  const [assistants, setAssistants] = useState<PromptPreset[]>([]);
  const [summaries, setSummaries] = useState<PromptPreset[]>([]);
  const [selected, setSelected] = useState<PromptPreset | null>(null);
  const [mode, setMode] = useState<PresetMode>('assistant');

  // Form state
  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    if (!selected) {
      if (mode === 'assistant' && assistants.length > 0) setSelected(assistants[0]);
      else if (mode === 'summary' && summaries.length > 0) setSelected(summaries[0]);
    }
  }, [mode, assistants, summaries, selected]);

  async function loadPresets() {
    try {
      const [asstData, sumData] = await Promise.all([
        getPromptPresets(),
        getSummaryPresets()
      ]);
      setAssistants(asstData);
      setSummaries(sumData);

      // Select first if nothing selected
      if (!selected) {
        if (mode === 'assistant' && asstData.length > 0) setSelected(asstData[0]);
        else if (mode === 'summary' && sumData.length > 0) setSelected(sumData[0]);
      } else if (selected.id !== 'new') {
        // Refresh selected data
        const pool = selected.preset_type === 'summary' ? sumData : asstData;
        const updated = pool.find(p => p.id === selected.id);
        if (updated) setSelected(updated);
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
      // Switch mode tab if we selected externally (though here we control it)
      if (selected.preset_type === 'summary') setMode('summary');
      else if (selected.id !== 'new') setMode('assistant');
    }
  }, [selected]);

  async function handleSave() {
    if (!selected) return;

    let finalName = editName.trim();
    const defaultName = t('assistantsManager.defaultName');

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
      const presetType = mode; // 'assistant' or 'summary'

      if (selected.id === 'new') {
        const newPreset = await createPromptPreset({
          name: finalName,
          description: editDesc,
          prompt: editPrompt,
          preset_type: presetType
        });
        await loadPresets();
        setSelected(newPreset);
      } else {
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

  function handleCreateNew() {
    const newPlaceholder: PromptPreset = {
      id: 'new',
      name: '',
      description: '',
      prompt: '',
      is_built_in: false,
      created_at: '',
      updated_at: '',
      preset_type: mode
    };
    setSelected(newPlaceholder);
    setEditName('');
    setEditPrompt('');
    setEditDesc('');

    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  }

  const renderList = (items: PromptPreset[], currentMode: PresetMode) => (
    items.map(a => (
      <div
        key={a.id}
        className={`flex items-center justify-between p-3 rounded-lg transition mb-1 cursor-pointer
              ${selected?.id === a.id ? "bg-white/10" : "hover:bg-white/5"}
          `}
        onClick={() => {
          setMode(currentMode);
          setSelected(a);
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{a.name || t('assistantsManager.untitled')}</p>
          <p className="text-xs text-white/40">{a.is_built_in ? t('assistantsManager.builtin') : t('assistantsManager.custom')}</p>
        </div>

        {currentMode === 'summary' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSummaryPreset(a.id);
            }}
            className={`ml-2 p-1.5 rounded-full border transition-all ${activeSummaryPreset === a.id
              ? "bg-green-500/20 border-green-500/50 text-green-400"
              : "border-white/10 text-white/20 hover:border-white/30 hover:text-white/40"}`}
            title="Use as active email summary"
          >
            <CheckIcon size={14} />
          </button>
        )}
      </div>
    ))
  );

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-[9999]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700">
        <div className="flex h-[600px]">

          <aside className="w-72 bg-[#181719] border-r border-neutral-700 flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-2 text-xs font-medium bg-neutral-800 p-1 rounded-lg">
                <button
                  onClick={() => { setMode('assistant'); setSelected(null); }}
                  className={`px-3 py-1 rounded-md transition ${mode === 'assistant' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => { setMode('summary'); setSelected(null); }}
                  className={`px-3 py-1 rounded-md transition ${mode === 'summary' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  Email
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-full transition-colors"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {mode === 'assistant' ? renderList(assistants, 'assistant') : renderList(summaries, 'summary')}
            </div>

            <div className="p-3 border-t border-white/5">
              <button
                onClick={handleCreateNew}
                className="w-full p-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 transition"
              >
                {t('assistantsManager.createNew')}
              </button>
            </div>
          </aside>

          <div className="flex-1 bg-[#1D1D1F] p-8 overflow-y-auto flex flex-col">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <input
                  ref={titleInputRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={selected?.is_built_in ? "" : t('assistantsManager.newPresetPlaceholder')}
                  disabled={selected?.is_built_in}
                  className="text-base font-bold text-white bg-transparent border-none focus:outline-none placeholder:text-neutral-600 w-full"
                />
                {mode === 'summary' && selected && selected.id !== 'new' && (
                  <div className="flex items-center gap-2 text-xs">
                    {activeSummaryPreset === selected.id ? (
                      <span className="text-green-400 font-medium px-2 py-1 bg-green-400/10 rounded">Active Summary Preset</span>
                    ) : (
                      <button
                        onClick={() => setActiveSummaryPreset(selected.id)}
                        className="text-neutral-400 hover:text-white px-2 py-1 hover:bg-white/5 rounded transition"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                )}
              </div>

              <textarea
                ref={promptInputRef}
                className="flex-1 w-full bg-transparent text-white text-sm focus:outline-none resize-none font-mono leading-relaxed placeholder:text-neutral-600 mt-2"
                placeholder={selected?.is_built_in ? "" : t('assistantsManager.instructionsPlaceholder')}
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                disabled={selected?.is_built_in}
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

