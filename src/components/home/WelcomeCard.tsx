import { motion } from "framer-motion";

interface WelcomeCardProps {
  onDismiss?: () => void;
  onJoinDemo: () => void;
  className?: string;
}

export default function WelcomeCard({ onJoinDemo, className = "" }: WelcomeCardProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative overflow-hidden flex flex-col justify-between p-8 rounded-3xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-2xl shadow-black/20 group ${className}`}
    >
      {/* Animated Gradient Background Blob */}
      <motion.div
        className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-[80px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Dismiss Button */}
      
      <div className="z-10 relative">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-10 h-10 mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
             <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
             <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
             <line x1="12" x2="12" y1="19" y2="22"/>
           </svg>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-3 tracking-tight"
        >
          Start recording
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-white/60 leading-relaxed max-w-sm mb-8"
        >
          Capture audio instantly. Get real-time transcripts, summaries, and AI-powered insights for your meetings.
        </motion.p>
      </div>

      <div className="z-10 relative">
        <motion.button
          onClick={onJoinDemo}
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255,255,255,0.15)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="group relative overflow-hidden bg-white text-black pl-5 pr-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-xl shadow-white/5 flex items-center gap-2"
        >
          <span className="relative z-10">Join demo meeting</span>
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="relative z-10"
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
          >
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </motion.svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </motion.button>
      </div>
    </motion.div>
  );
}
