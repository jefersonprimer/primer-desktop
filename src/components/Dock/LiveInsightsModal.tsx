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
}

export default function LiveInsightsModal({ 
  open, 
  anchorX = window.innerWidth / 2, 
  onClose,
  isListening = false,
  transcript = "",
  actions = [],
  onActionClick
}: DockModalProps) {
  
  const hasTranscript = transcript.trim().length > 0;
  const showPlaceholder = isListening && !hasTranscript;

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
            className="absolute top-24 rounded-2xl bg-[#4E4D4F] backdrop-blur-md shadow-xl border border-white/10 w-[500px]"
            style={{ left: anchorX - 250 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 text-xs text-white/60">
              <span className="text-sm font-medium text-white">Live Insights</span>
              
              <div className="flex gap-4">
                <button className="flex items-center gap-2 hover:text-white">
                  <EyeOffIcon size={16} />
                  <span className="text-sm font-medium text-white">Summary</span>
                </button>

                <button className="flex items-center gap-2 hover:text-white">
                  <AudioLinesIcon size={16} />                  
                  <span className="text-sm font-medium text-white">Show Transcript</span>
                </button>

                <button className="flex items-center gap-2 hover:text-white">
                  <CopyIcon size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 min-h-[100px] flex flex-col justify-center">
               {showPlaceholder && (
                 <div className="flex flex-col items-center justify-center gap-4">
                   <div className="relative flex items-center justify-center">
                     <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-red-400 opacity-20"></span>
                     <span className="relative inline-flex h-6 w-6 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
                   </div>
                   <div className="text-center text-white/60 text-lg">
                     Listening...
                   </div>
                 </div>
               )}
               
               {hasTranscript && (
                 <div className="text-white text-lg font-medium leading-relaxed">
                   "{transcript}"
                 </div>
               )}

               {!isListening && actions.length > 0 && (
                 <div className="mt-4">
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
               
               {!isListening && !showPlaceholder && !hasTranscript && actions.length === 0 && (
                  <div className="text-center text-white/40">
                    Ready to listen.
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="text-center px-4 py-2 text-sm font-medium text-white/40 border-t border-white/5">
              <button onClick={onClose}>
                {isListening ? "Listening..." : "Click to ask Primer AI"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

