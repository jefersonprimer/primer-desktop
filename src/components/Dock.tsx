import Draggable from "react-draggable";
import { useState, useRef, useEffect, useCallback } from "react";

import { useAuth } from "../contexts/AuthContext";
import { useAi } from "../contexts/AiContext";
import { useStealthMode } from '../contexts/StealthModeContext';
import { useModals } from "../contexts/ModalContext";

import { getPromptPresets } from "../lib/tauri";
import { invoke } from "@tauri-apps/api/core";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { generateActions } from "../services/aiService";


import AudioLinesIcon from "./ui/icons/AudioLinesIcon";
import StopIcon from "./ui/icons/StopIcon";
import EnterIcon from "./ui/icons/EnterIcon";
import EllipsisVerticalIcon from "./ui/icons/EllipsisVerticalIcon";

import LiveInsightsModal from "./modals/LiveInsightsModal";
import SelectAssistantModal from "./modals/SelectAssistantModal";
import AssistantsManagerModal from "./modals/AssistantsManagerModal";

interface DockProps {
  onOpenModal: (modal: string) => void;
  onClose?: () => void;
  onActionSelected?: (action: string) => void;
  active?: boolean;
  aiModalOpen?: boolean;
  isInputVisible?: boolean;
}

export default function Dock({ onOpenModal, onClose: _onClose, onActionSelected, active, aiModalOpen, isInputVisible: _isInputVisible = true }: DockProps) {
  const { openModal } = useModals();
  const [showMenu, setShowMenu] = useState(false);
  const [showLiveInsights, setShowLiveInsights] = useState(false);
  const [showAssistantsManager, setShowAssistantsManager] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockCenterX, setDockCenterX] = useState(window.innerWidth / 2);
  const { isStealth } = useStealthMode();
  const { userEmail, logout } = useAuth();

  const [showAssistantSelector, setShowAssistantSelector] = useState(false);
  const { 
    activePromptPreset, 
    setActivePromptPreset, 
    activeProvider, 
    activeModel, 
    outputLanguage,
    getApiKeyForProvider, 
    setLastUserMessage 
  } = useAi();
  const [activePresetName, setActivePresetName] = useState("Default");

  // Speech & AI state
  const [actions, setActions] = useState<string[]>([]);
  const { isListening, transcript, error: speechError, startListening, stopListening } = useSpeechRecognition({
      onResult: (text) => {
          console.log("[Dock] onResult received:", text);
          // Immediately generate actions when we get a result
          if (text && text.trim().length > 0) {
              handleGenerateActions(text);
          }
      }
  });
  
  // Calculate LiveInsights position
  // If AiModal is open (centered), move LiveInsights to the left
  const liveInsightsAnchorX = aiModalOpen ? dockCenterX - 570 : dockCenterX;

  const onCloseApp = async () => {
    await invoke("close_app");
  };

  useEffect(() => {
    if (speechError) {
      console.error("Speech Error:", speechError);
      // Optional: Show error to user via toast or alert
    }
  }, [speechError]);

  useEffect(() => {
    loadActivePresetName();
  }, [activePromptPreset]);

  const updateDockCenterX = useCallback(() => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setDockCenterX(rect.left + rect.width / 2);
    }
  }, []);

  useEffect(() => {
    updateDockCenterX();
    window.addEventListener("resize", updateDockCenterX);
    return () => window.removeEventListener("resize", updateDockCenterX);
  }, [updateDockCenterX]);

  // Global Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ask: Ctrl + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to prevent unwanted side effects
        onOpenModal("chat");
      }

      // Hide: Ctrl + \
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        invoke("toggle_minimize_window");
      }

      // Voice: Ctrl + D
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        handleListenClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenModal]);

  // Handle Speech End -> Generate Actions
  // REMOVED useEffect relying on isListening to avoid race conditions
  /*
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      handleGenerateActions();
    }
  }, [isListening]);
  */

  const handleGenerateActions = async (textOverride?: string) => {
    console.log("[Dock] handleGenerateActions called with:", textOverride);
    const textToProcess = textOverride || transcript;
    if (!textToProcess || textToProcess.trim().length === 0) {
        console.log("[Dock] No text to process.");
        return;
    }

    setLastUserMessage(textToProcess);

    const apiKey = getApiKeyForProvider(activeProvider);
    if (!apiKey) {
      console.warn("No API key for active provider");
      setActions(["Error: No API Key found for " + activeProvider]);
      return;
    }

    try {
      console.log("[Dock] Generating actions via AI service...");
      const generatedActions = await generateActions(textToProcess, activeProvider, apiKey, activeModel, outputLanguage);
      console.log("[Dock] Actions generated:", generatedActions);
      setActions(generatedActions);
    } catch (e) {
      console.error("Failed to generate actions", e);
    }
  };

  const handleListenClick = () => {
    console.log("Listen clicked. Current state isListening:", isListening);
    invoke("log_frontend_message", { message: `Listen clicked. isListening: ${isListening}` }).catch(e => console.error(e));
    if (isListening) {
      stopListening();
    } else {
      setActions([]); // Clear previous actions
      setShowLiveInsights(true);
      startListening();
    }
  };

  const handleActionClick = (action: string) => {
    if (onActionSelected) {
      onActionSelected(action);
    }
    // Don't necessarily close LiveInsights, maybe user wants to see transcript? 
    // But usually clicking an action navigates away.
    // setShowLiveInsights(false); 
  };

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
      <Draggable nodeRef={dockRef} onDrag={updateDockCenterX} handle=".dock-handle">
        <div ref={dockRef} className="absolute top-6 left-0 right-0 mx-auto w-fit flex flex-col items-center gap-3 z-[9999]">
          <div className="dock-handle cursor-move relative flex items-center gap-8 bg-[#4E4D4F] backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/10 shadow-lg">
            <button
              className={`flex items-center gap-2 py-2 px-4 rounded-full transition text-white group ${isListening ? 'bg-red-500/20 text-red-100' : 'bg-[#707071] hover:bg-white/10'}`}
              onClick={handleListenClick}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-medium text-white/90 group-hover:text-white">
                {isListening ? "Stop" : "Listen"}
              </span>
              {isListening ? (
                 <StopIcon fill="#ff8888" stroke="none" size={18} className="animate-pulse" />
              ) : (
                 <AudioLinesIcon stroke="#fff" size={20} />
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 py-1 px-4 rounded-full hover:bg-white/10 transition text-white group"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onOpenModal("chat");
                }}
              >
                <span className="text-sm font-medium text-white/90 group-hover:text-white">Ask</span>
                
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
                  <span className="bg-white/10 p-1.5 rounded-lg text-white/70 group-hover:text-white transition"><EnterIcon size={16}/></span>
                </div>
              </button>

              <button
                className="flex items-center gap-2 px-4 py-1 rounded-full hover:bg-white/10 transition text-white group "
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => invoke("toggle_minimize_window")}
              >
                <span className="text-sm font-medium text-white/90 group-hover:text-white">Hide</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
                  <span className="text-sm bg-white/10 px-2.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">\</span>
                </div>  
              </button>

              <button
                ref={buttonRef}
                onMouseDown={(e) => e.stopPropagation()}
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
            </div>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-6 p-4 w-64 bg-[#121213] backdrop-blur-xl rounded-lg shadow-2xl overflow-visible flex flex-col animate-in fade-in zoom-in-95 duration-200 cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
              >
              <div className="pb-3">
                <h3 className="text-white font-semibold text-sm">Primer</h3>
              </div>

              <div className="space-y-2">
                <div className="relative py-4 border-t border-b border-white/10">
                  <div className=" text-white text-sm font-medium">
                    Prompt
                  </div>
                  
                  <button
                    onClick={() => setShowAssistantSelector(!showAssistantSelector)}
                    className={`w-full px-3 py-2 my-2 text-left text-white text-sm border  ${showAssistantSelector ? 'bg-white/10 border-white' : 'hover:bg-white/5 border-neutral-400'} rounded-lg transition flex items-center justify-between`}
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
                      positionClass="absolute top-11 right-[-260px]"
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
                  <div className="flex px-3 py-2 gap-1 text-white font-medium items-center">
                    <span className="text-sm">Account: </span>
                    <span className="flex-1 text-xs overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{userEmail}</span>
                  </div>

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

                <div className="my-3 border-t border-white/10"/>
                <button className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition">
                  <span className="text-sm">{isStealth ? 'Disable Invisibility' : 'Enable Invisibility'}</span>
                </button>

                <button 
                  onClick={() => {
                    openModal("settings");
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition"
                >
                  Disable Auto Launch
                </button>
                
                <button 
                  onClick={() => {
                    openModal("settings");
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition"
                >
                  Settings
                </button>

                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/10 rounded-lg transition"
                >
                  Log Out
                </button>


                <button
                  onClick={onCloseApp}
                  className="w-full px-3 py-2 text-white text-sm bg-[#414143] hover:bg-white/5 rounded-lg transition"
                >
                  Quit Primer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
        <LiveInsightsModal
          open={showLiveInsights}
          anchorX={liveInsightsAnchorX}
          onClose={() => setShowLiveInsights(false)}
          isListening={isListening}
          transcript={transcript}
          actions={actions}
          onActionClick={handleActionClick}
          onAskClick={() => {
            setShowLiveInsights(false);
            onOpenModal("chat");
          }}
        />
        {showAssistantsManager && (
          <AssistantsManagerModal
            onClose={() => setShowAssistantsManager(false)}
          />
        )}
    </>
  );
}
