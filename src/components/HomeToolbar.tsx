import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showWelcome] = useState(true);

  /*
  const [showWelcome, setShowWelcome] = useState(() => {                                                                         │
│   const saved = localStorage.getItem("show_welcome_card");                                                                     │
│   return saved !== "false";                                                                                                    │
│ });                                        
  */

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
    // Kept visible forever
  };

  /*
  const handleDismissWelcome = () => {                                                                                           │
│   setShowWelcome(false);                                                                                                       │
│   localStorage.setItem("show_welcome_card", "false");                                                                          │
│ };      
  */

  const handleJoinDemo = () => {
    // Logic for joining demo meeting (or tutorial)
    // For now, we'll dismiss the card as requested "ok or something dismisses it"
    handleDismissWelcome();
  };

  const activePresetName = presets.find(p => p.id === activePromptPreset)?.name || "Assistente";

  return (

    <div className="w-full min-h-[180px] md:min-h-[200px] max-h-[300px] md:max-h-[400px] pt-4 flex flex-col z-50 bg-[#121212] border-b border-t border-white/5">

      <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-2 py-4">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-white font-medium text-2xl md:text-3xl">Primer</span>

          <motion.button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="group relative flex items-center justify-center p-1.5 md:p-2 rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: 360 }}
            title={t('calendar.refresh', 'Refresh Events')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="lucide lucide-calendar-sync-icon lucide-calendar-sync transition-transform duration-700 ease-in-out group-hover:rotate-[360deg] md:w-5 md:h-5"
            >
              <path d="M11 10v4h4" /><path d="m11 14 1.535-1.605a5 5 0 0 1 8 1.5" /><path d="M16 2v4" /><path d="m21 18-1.535 1.605a5 5 0 0 1-8-1.5" /><path d="M21 22v-4h-4" /><path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" /><path d="M3 10h4" /><path d="M8 2v4" />
            </svg>
          </motion.button>

          <div className="relative">
            <button
              onClick={() => setShowAssistantSelector(!showAssistantSelector)}
              className="flex items-center gap-2 text-white/90 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/10"
            >
              <span className="hidden md:inline text-base font-medium text-neutral-400 truncate">Mode:</span>
              <span className="text-sm md:text-base font-semibold truncate text-white/80 max-w-[80px] md:max-w-none">{activePresetName}</span>
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
          <motion.button
            onClick={toggleStealth}
            className={`relative flex items-center gap-2 md:gap-3 px-2 py-1.5 md:px-4 md:py-2 rounded-full border backdrop-blur-md transition-all duration-500 overflow-hidden ${
              isStealth
                ? "bg-[#48CAE1]/10 border-[#48CAE1]/30 text-[#48CAE1] shadow-[0_0_15px_rgba(72,202,225,0.15)]"
                : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            {/* Animated Background Gradient for Stealth */}
            {isStealth && (
              <motion.div
                layoutId="stealth-glow"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#48CAE1]/10 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            )}

            <div className="relative z-10 flex items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isStealth ? "stealth" : "visible"}
                  initial={{ y: -20, opacity: 0, rotate: -20 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 20, opacity: 0, rotate: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isStealth ? <HatGlassesIcon size={16}/> : <EyeIcon size={16}/>}
                </motion.div>
              </AnimatePresence>

              <div className="relative h-[20px] w-[80px] overflow-hidden flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isStealth ? "undetectable" : "detectable"}
                    className="absolute inset-0 font-medium text-sm flex items-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isStealth ? "Undetectable" : "Detectable"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Stylized Toggle Switch */}
            <div className={`relative w-8 h-5 flex items-center px-0.5 rounded-full transition-colors duration-300 border ${isStealth ? 'bg-[#48CAE1]/20 border-[#48CAE1]/50' : 'bg-black/20 border-white/10'}`}>
              <motion.div
                className={`w-3.5 h-3.5 rounded-full shadow-sm ${isStealth ? 'bg-[#48CAE1]' : 'bg-white/80'}`}
                animate={{ x: isStealth ? (window.innerWidth < 768 ? 10 : 14) : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </motion.button>
        </div>

        <button className="relative group overflow-hidden px-4 py-1.5 md:px-8 md:py-2 rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-colors duration-300"></div>
          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          <span className="relative z-10 font-medium text-white/90 group-hover:text-white tracking-wide text-sm md:text-base">Start</span>
        </button>
      </div>

      {/* Content Section (Grid) */}
      <div className="w-full max-w-6xl mx-auto mt-6 px-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-500 flex-1 overflow-hidden">
        {showWelcome ? (
          <div className="grid grid-cols-4 gap-4 h-full">
             {/* 
                Logic:
                - If connected: Calendar takes 3 cols (md), Welcome takes 1 col (md).
                - If NOT connected: Welcome takes 3 cols (md), Calendar takes 1 col (md).
                - On mobile (<md): Both take 2 cols (50/50).
             */}
            {!isCalendarConnected ? (
              <>
                <div className="col-span-2 md:col-span-3 h-full min-h-0">
                  <WelcomeCard 
                    onJoinDemo={handleJoinDemo} 
                    className="h-full"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 h-full min-h-0">
                  <CalendarSection refreshTrigger={refreshTrigger} compact={true} />
                </div>
              </>
            ) : (
               <>
                <div className="col-span-2 md:col-span-1 h-full min-h-0">
                  <WelcomeCard 
                    onJoinDemo={handleJoinDemo} 
                    className="h-full"
                  />
                </div>
                <div className="col-span-2 md:col-span-3 h-full min-h-0">
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
