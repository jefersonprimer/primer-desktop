import { motion, AnimatePresence } from "framer-motion";
import EyeIcon from "../ui/icons/EyeIcon";
import EyeOffIcon from "../ui/icons/EyeOffIcon";
import AudioLinesIcon from "../ui/icons/AudioLinesIcon";
import CopyIcon from "../ui/icons/CopyIcon";

interface DockModalProps {
  open: boolean;
  anchorX?: number; // posição X da dock (centro)
  onClose: () => void;
}

const actions = [
  { icon: "✨", label: "Define Dyspepsia Analyze Online Stretch" },
  { icon: "⭐", label: "Give me helpful information" },
  { icon: "💡", label: "Suggest follow-up questions" },
];

export default function LiveInsightsModal({ open, anchorX = window.innerWidth / 2, onClose }: DockModalProps) {
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
                  <EyeOffIcon size={18} />
                  <span className="text-sm font-medium text-white">Summary</span>
                </button>

                <button className="flex items-center gap-2 hover:text-white">
                  <AudioLinesIcon size={18} />                  
                  <span className="text-sm font-medium text-white">Show Transcript</span>
                </button>

                <button className="flex items-center gap-2 hover:text-white">
                  <CopyIcon size={18} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <div className="text-base text-white px-2 mb-1">Actions</div>
              {actions.map((a) => (
                <button
                  key={a.label}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition"
                >
                  <span className="text-base">{a.icon}</span>
                  <span className="text-left">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center px-4 py-2 text-sm font-medium text-white/40">
              <button>
                Click to ask Primer AI
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

