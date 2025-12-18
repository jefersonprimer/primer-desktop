import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EyeOffIcon from "../ui/icons/EyeOffIcon";
import AudioLinesIcon from "../ui/icons/AudioLinesIcon";
import CopyIcon from "../ui/icons/CopyIcon";

interface DockModalProps {
  open: boolean;
  anchorX?: number; // posição X da dock (centro)
  onClose: () => void;
  isListening?: boolean;
  transcript?: string;
  actions?: string[];
  onActionClick?: (action: string) => void;
  onAskClick?: () => void;
}

export default function LiveInsightsModal({ 
  open, 
  anchorX = window.innerWidth / 2, 
  onClose,
  isListening = false,
  transcript = "",
  actions = [],
  onActionClick,
  onAskClick
}: DockModalProps) {
  const [view, setView] = useState<'summary' | 'transcript'>('summary');
  
  const hasTranscript = transcript.trim().length > 0;
  const showPlaceholder = isListening && !hasTranscript;

  // Reset view to summary when opening or when a new transcription starts
  useEffect(() => {
    if (open && isListening) {
      setView('summary');
    }
  }, [open, isListening]);

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-24 rounded-lg bg-[#4E4D4F] backdrop-blur-md shadow-xl border border-white/10 w-[500px]"
            style={{ left: anchorX - 250 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 text-xs text-white/60">
              <span className="text-sm font-medium text-white">Live Insights</span>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setView('summary')}
                  className={`flex items-center gap-2 hover:text-white transition-colors ${view === 'summary' ? 'text-white' : ''}`}
                >
                  <EyeOffIcon size={16} />
                  <span className="text-sm font-medium">Summary</span>
                </button>

                <button 
                  onClick={() => setView('transcript')}
                  className={`flex items-center gap-2 hover:text-white transition-colors ${view === 'transcript' ? 'text-white' : ''}`}
                >
                  <AudioLinesIcon size={16} />                  
                  <span className="text-sm font-medium">Show Transcript</span>
                </button>

                <button 
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                  disabled={!hasTranscript}
                >
                  <CopyIcon size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 h-auto flex flex-col justify-center">
               {view === 'summary' ? (
                 <>
                   {showPlaceholder && (
                    <div className="text-white/60 text-lg">
                      Start speaking to see realtimer insights...
                    </div>
                   )}
                   
                   {!isListening && actions.length > 0 && (
                     <div className="mt-0">
                        <div className="text-xs font-semibold text-white/40 uppercase mb-2">Suggested Actions</div>
                        <div className="space-y-2">
                          {actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={() => onActionClick?.(action)}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-left group"
                            >
                              <span className="text-base">✨</span>
                              <span className="text-sm text-white/90 group-hover:text-white">{action}</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   )}

                   {!isListening && actions.length === 0 && (
                      <div className="flex justify-start">
                        <div className="py-2 rounded-lg flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                   )}
                 </>
               ) : (
                 <div className="text-white text-lg font-medium leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                   {hasTranscript ? (
                     `"${transcript}"`
                   ) : (
                     <div className="text-center text-white/40">
                       {isListening ? "Transcript will appear here..." : "No transcript available."}
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="text-center px-4 py-2 text-sm font-medium text-white/40 border-t border-white/5">
              <button onClick={onAskClick}>
                Click to ask Primer AI
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

