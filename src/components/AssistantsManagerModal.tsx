import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  getPromptPresets, 
  createPromptPreset, 
  updatePromptPreset, 
  deletePromptPreset, 
  type PromptPreset 
} from "../lib/tauri";

export default function AssistantsManagerModal({ onClose }: { onClose: () => void; open?: boolean }) {
  const [assistants, setAssistants] = useState<PromptPreset[]>([]);
  const [selected, setSelected] = useState<PromptPreset | null>(null);
  
  // Form state
  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editDesc, setEditDesc] = useState("");

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
      const defaultName = 'New Assistant';
      
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
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[600px] overflow-hidden border border-neutral-700">
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-72 border-r border-white/10 bg-neutral-950 p-2 overflow-y-auto">
            {assistants.map(a => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={`p-3 rounded-lg cursor-pointer transition mb-1 ${selected?.id === a.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <p className="text-white text-sm font-medium">{a.name}</p>
                <p className="text-xs text-white/40">{a.is_built_in ? "Built-in" : "Custom"}</p>
              </div>
            ))}

            <button 
                onClick={handleCreateNew}
                className="mt-3 w-full p-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 transition"
            >
              + Create New Assistant
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               {selected?.id === 'new' || (selected && !selected.is_built_in) ? (
                   <input 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Assistant Name"
                      className="bg-transparent text-lg text-white font-semibold border-b border-white/10 focus:border-white focus:outline-none w-full mr-4"
                   />
               ) : (
                  <h2 className="text-lg text-white font-semibold">{selected?.name}</h2>
               )}

              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-full transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* TABS */}
            <div className="flex gap-3 mb-4 border-b border-white/10 pb-2">
              <button className="px-4 py-1 bg-white/10 rounded-lg text-white text-sm">System Prompt</button>
            </div>

            {/* PROMPT EDITOR */}
            <textarea
              className="w-full h-80 bg-neutral-950 border border-white/10 rounded-lg p-4 text-white text-sm focus:outline-none resize-none font-mono"
              placeholder="# System Prompt\nDescribe the assistant behavior here..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              disabled={selected?.is_built_in}
            />
            
            {selected?.is_built_in && (
                <p className="text-xs text-white/40 mt-2">Built-in assistants cannot be modified.</p>
            )}

            {!selected?.is_built_in && (
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                    Save Changes
                    </button>
                    {selected?.id !== 'new' && (
                        <button 
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this assistant?")) {
                                    if (selected) {
                                        await deletePromptPreset(selected.id);
                                        // Reset to first available or empty
                                        setSelected(null);
                                        await loadPresets();
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded-lg text-sm"
                        >
                        Delete
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
