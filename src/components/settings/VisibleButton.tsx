import { useStealthMode } from '../../contexts/StealthModeContext';

export default function VisibleButton() {
  const { isStealth, toggleStealth } = useStealthMode();

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <button
        onClick={toggleStealth}
        className="flex justify-center items-center gap-2 px-4 py-2 bg-black/70 text-white rounded-lg border border-white/20 backdrop-blur-md hover:bg-black/80 transition"
      >
        {isStealth ? (
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
            <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
            <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
            <path d="m2 2 20 20"/>
          </svg>
        ) : (
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
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
        <span>{isStealth ? 'Modo Furtivo (Ativo)' : 'Aplicativo visível'}</span>
      </button>
    </div>
  );
}

