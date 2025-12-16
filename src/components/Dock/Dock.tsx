import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AudioLinesIcon from "../ui/icons/AudioLinesIcon";
import EllipsisVerticalIcon from "../ui/icons/EllipsisVerticalIcon";
import { useStealthMode } from '../../contexts/StealthModeContext';
import LiveInsightsModal from "./LiveInsightsModal";
import SelectAssistantModal from "./SelectAssistantModal";
import AssistantsManagerModal from "../AssistantsManagerModal";
import { useAi } from "../../contexts/AiContext";
import { getPromptPresets, type PromptPreset } from "../../lib/tauri";
import { invoke } from "@tauri-apps/api/core";

interface DockProps {
  onOpenModal: (modal: string) => void;
  active?: boolean;
}

export default function Dock({ onOpenModal, active }: DockProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLiveInsights, setShowLiveInsights] = useState(false);
  const [showAssistantsManager, setShowAssistantsManager] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLDivElement>(null); // Add this line
  const [dockCenterX, setDockCenterX] = useState(window.innerWidth / 2); // Add this line
  const { isStealth, toggleStealth } = useStealthMode();
  const { userEmail, logout } = useAuth();

  const [showAssistantSelector, setShowAssistantSelector] = useState(false);
  const { activePromptPreset, setActivePromptPreset } = useAi();
  const [activePresetName, setActivePresetName] = useState("Default");

  const onCloseApp = async () => {
    await invoke("close_app");
  };

  // if (!open) return null; // This line seems to be an error, 'open' is not defined here. I'll comment it out for now.


  useEffect(() => {
    loadActivePresetName();
  }, [activePromptPreset]);

  // Add this useEffect hook to calculate dockCenterX
  useEffect(() => {
    const updateDockCenterX = () => {
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        setDockCenterX(rect.left + rect.width / 2);
      }
    };

    updateDockCenterX();
    window.addEventListener("resize", updateDockCenterX);
    return () => window.removeEventListener("resize", updateDockCenterX);
  }, []);

  async function loadActivePresetName() {
    try {
      const presets = await getPromptPresets();
      const found = presets.find(p => p.id === activePromptPreset);
      if (found) {
        setActivePresetName(found.name);
      } else {
        setActivePresetName("Default");
      }
    } catch (e) {
      console.error(e);
      setActivePresetName("Default");
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
        setShowAssistantSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div ref={dockRef} className="absolute top-6 left-0 right-0 mx-auto w-fit flex flex-col items-center gap-3 z-[9999]">
        <div className="relative flex items-center gap-3 bg-[#4E4D4F] backdrop-blur-xl px-2 py-1 rounded-full border border-white/10 shadow-lg">
          <button
            className="flex items-center gap-2 py-2 px-4 rounded-full bg-[#707071] hover:bg-white/10 transition text-white group"
            onClick={() => setShowLiveInsights(!showLiveInsights)}
          >
            <span className="text-sm font-medium text-white/90 group-hover:text-white">Listen</span>
            <AudioLinesIcon stroke="#fff" size={20} />
          </button>

          <button
            className="flex items-center gap-2 py-2 px-4 rounded-full hover:bg-white/10 transition text-white group"
            onClick={() => onOpenModal("chat")}
          >
            <span className="text-sm font-medium text-white/90 group-hover:text-white">Ask</span>
            <span className="text-xs font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                <path d="m9 10-5 5 5 5" />
              </svg>
            </span>
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition text-white group"
          >
            <span className="text-sm font-medium text-white/90 group-hover:text-white">Hide</span>
            <span className="text-xs font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">\</span>
          </button>

          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className={`
            relative group
            flex flex-col items-center justify-center
            p-2 rounded-full
            transition
            ${active || showMenu ? "bg-white/20" : "hover:bg-white/10"}
          `}
          >
            <EllipsisVerticalIcon stroke="#fff" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="absolute top-full right-0 mt-3 p-4 w-64 bg-[#121213] backdrop-blur-xl rounded-xl shadow-2xl overflow-visible flex flex-col animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="pb-3">
                <h3 className="text-white font-semibold text-sm">Primer AI</h3>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">

                {/* Prompt Section */}
                <div className="relative py-4 border-t border-b border-white/10">
                  <div className=" text-white text-sm font-medium">
                    Prompt
                  </div>
                  <button
                    onClick={() => setShowAssistantSelector(!showAssistantSelector)}
                    className="w-full px-3 py-2 my-2 text-left text-white text-sm border border-white hover:bg-white/5 rounded-lg transition flex items-center justify-between"
                  >
                    <span>{activePresetName}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {showAssistantSelector && (
                    <SelectAssistantModal
                      value={activePromptPreset}
                      onChange={(id) => {
                        setActivePromptPreset(id);
                        setShowAssistantSelector(false);
                      }}
                      onClose={() => setShowAssistantSelector(false)}
                      positionClass="absolute top-18"
                    />
                  )}

                  <button
                    onClick={() => {
                      setShowAssistantsManager(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 mt-1 text-white text-sm bg-[#414143] hover:bg-white/10 rounded-lg transition"
                  >
                    Personalize
                  </button>
                </div>

                <div className="space-y-0">
                  {/* Account Section */}
                  <div className="flex px-3 py-2 text-white text-sm font-medium items-center">
                    <span>Account: </span>
                    <span className="ml-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{userEmail}</span>
                  </div>

                  {/* Actions */}
                  <button className="w-full px-3 py-2 text-left text-white text-sm hover:bg-white/5 rounded-lg transition flex items-center justify-between">
                    <span>Scroll Response</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50 bg-[#2C292B] rounded-lg p-1">Ctrl</span>
                      <span className="text-xs text-white/50 bg-[#2C292B] rounded-lg p-1">
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
                          <path d="M12 2v20"/>
                          <path d="m8 18 4 4 4-4"/>
                          <path d="m8 6 4-4 4 4"/>
                        </svg>
                      </span>
                    </div>
                  </button>

                  <button className="w-full px-3 py-2 text-left text-white text-sm hover:bg-white/5 rounded-lg transition flex items-center justify-between mt-1">
                    <span>Clear Response</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50 bg-[#2C292B] rounded-lg p-1">Ctrl</span>
                      <span className="text-xs text-white/50 bg-[#2C292B] rounded-lg px-2 py-1">R</span>
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-white/10"></div>

                {/* Navigation */}
                <div className="flex gap-2 mb-2">
                  <button className="flex-1 px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/10 rounded-lg transition flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Move
                  </button>

                  <button className="flex-1 px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/10 rounded-lg transition flex items-center justify-center gap-2">
                    Move
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>

                <button className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition">
                  Show Tutorial
                </button>

                {/* Stealth Mode */}
                <button className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition">
                  <span className="text-sm">{isStealth ? 'Disable Invisibility' : 'Enable Invisibility'}</span>
                </button>

                <button className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition">
                  Disable Auto Launch
                </button>

                {/* Bottom Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={logout}
                    className="flex-1 px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/10 rounded-lg transition"
                  >
                    Log Out
                  </button>

                  <button
                    onClick={onCloseApp}
                    className="flex-1 px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition"
                  >
                    Quit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        <LiveInsightsModal
          open={showLiveInsights}
          anchorX={dockCenterX} // Pass dockCenterX as anchorX
          onClose={() => setShowLiveInsights(false)}
        />
        {showAssistantsManager && (
          <AssistantsManagerModal
            onClose={() => setShowAssistantsManager(false)}
          />
        )}
    </>
  );
}
