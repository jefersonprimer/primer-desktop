import { useTranslation } from "react-i18next";

interface WelcomeCardProps {
  onDismiss: () => void;
  onJoinDemo: () => void;
  className?: string;
}

export default function WelcomeCard({ onDismiss, onJoinDemo, className = "" }: WelcomeCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative flex flex-col justify-between p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 ${className}`}>
        
      {/* Dismiss Button */}
      <button 
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        title={t('common.dismiss', 'Dismiss')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>

      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Start recording meeting with Primer
        </h2>
        <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-md">
          Capture audio from any application instantly. Get real-time transcripts, summaries, and AI-powered insights for your meetings.
        </p>
      </div>

      <div>
        <button
          onClick={onJoinDemo}
          className="bg-white text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M15.9 14.3a5 5 0 0 1-7.8 0" /><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" />
          </svg>
          Join demo meeting
        </button>
      </div>
    </div>
  );
}
