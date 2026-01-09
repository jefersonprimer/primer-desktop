import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStealthMode } from "@/contexts/StealthModeContext";
import { useAi } from "@/contexts/AiContext";
import { useAuth } from "@/contexts/AuthContext";
import { getPromptPresets, type PromptPreset } from "@/lib/tauri";

import ChevronDownIcon from "@/components/ui/icons/ChevronDownIcon";
import SelectAssistantModal from "@/components/modals/SelectAssistantModal";
import CalendarSection from "@/components/home/CalendarSection";
import WelcomeCard from "@/components/home/WelcomeCard";

import EyeIcon from "@/components/ui/icons/EyeIcon";
import HatGlassesIcon from "@/components/ui/icons/HatGlassesIcon";

export default function HomeToolbar() {
  const { t } = useTranslation();
  const { isStealth, toggleStealth } = useStealthMode();
  const { activePromptPreset, setActivePromptPreset } = useAi();
  const { isCalendarConnected } = useAuth();

  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Load welcome state from local storage or default to true
  const [showWelcome, setShowWelcome] = useState(() => {
    const saved = localStorage.getItem("show_welcome_card");
    return saved !== "false";
  });

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const data = await getPromptPresets();
      setPresets(data);
    } catch (e) {
      console.error(e);
    }
  }

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("show_welcome_card", "false");
  };

  const handleJoinDemo = () => {
    // Logic for joining demo meeting (or tutorial)
    // For now, we'll dismiss the card as requested "ok or something dismisses it"
    handleDismissWelcome();
  };

  const activePresetName = presets.find(p => p.id === activePromptPreset)?.name || "Assistente";

  return (

    <div className="w-full flex flex-col z-50 bg-[#121214] border-b border-t border-white/5 shadow-2xl">

      {/* Header */

      }
      <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-2 py-4">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium text-3xl">Primer</span>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="text-white/70 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title={t('calendar.refresh', 'Refresh Events')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-sync-icon lucide-calendar-sync"><path d="M11 10v4h4" /><path d="m11 14 1.535-1.605a5 5 0 0 1 8 1.5" /><path d="M16 2v4" /><path d="m21 18-1.535 1.605a5 5 0 0 1-8-1.5" /><path d="M21 22v-4h-4" /><path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" /><path d="M3 10h4" /><path d="M8 2v4" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAssistantSelector(!showAssistantSelector)}
              className="flex items-center gap-2 text-white/90 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/10"
            >
              <span className="text-base font-medium text-neutral-400 truncate">Mode:</span>
              <span className="text-base font-semibold truncate text-white/80">{activePresetName}</span>
              <ChevronDownIcon size={14} />
            </button>

            {showAssistantSelector && (
              <SelectAssistantModal
                value={activePromptPreset}
                onChange={(id) => {
                  setActivePromptPreset(id);
                  setShowAssistantSelector(false);
                }}
                onClose={() => setShowAssistantSelector(false)}
                positionClass="absolute left-0 top-full mt-2"
              />
            )}
          </div>

          {/* Stealth Toggle */}
          <div className="flex items-center gap-2 border border-white/10 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex">
              {!isStealth ? (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <EyeIcon size={18} />
                  <h1 className="text-base font-semibold text-white">Detectable</h1>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <HatGlassesIcon size={18} />
                  <h1 className="text-base font-semibold text-white">Undetectable</h1>
                </div>
              )}
            </div>
            <button
              onClick={toggleStealth}
              className={`relative w-11 h-6 rounded-full transition-colors ${isStealth ? 'bg-[#48CAE1]' : 'bg-gray-200 dark:bg-zinc-700'
                }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isStealth ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>

        <button className="bg-white text-black px-6 py-1.5 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">
          Start
        </button>
      </div>

      {/* Content Section (Grid) */}
      <div className="w-full max-w-4xl mx-auto px-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-500">
        {showWelcome ? (
          <div className="grid grid-cols-4 gap-4">
             {/* 
                Logic:
                - If connected: Calendar takes 3 cols, Welcome takes 1 col.
                - If NOT connected: Welcome takes 3 cols, Calendar takes 1 col.
             */}
            {!isCalendarConnected ? (
              <>
                <div className="col-span-3">
                  <WelcomeCard 
                    onDismiss={handleDismissWelcome} 
                    onJoinDemo={handleJoinDemo} 
                    className="h-full"
                  />
                </div>
                <div className="col-span-1">
                  <CalendarSection refreshTrigger={refreshTrigger} compact={true} />
                </div>
              </>
            ) : (
               <>
                <div className="col-span-1">
                  <WelcomeCard 
                    onDismiss={handleDismissWelcome} 
                    onJoinDemo={handleJoinDemo} 
                    className="h-full"
                  />
                </div>
                <div className="col-span-3">
                  <CalendarSection refreshTrigger={refreshTrigger} />
                </div>
               </>
            )}
          </div>
        ) : (
           /* Full width calendar if welcome is dismissed */
           <CalendarSection refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
}
