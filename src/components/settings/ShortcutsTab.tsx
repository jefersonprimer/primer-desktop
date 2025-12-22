import EnterIcon from "../ui/icons/EnterIcon";
import MonitorIcon from "../ui/icons/MonitorIcon";
import MicIcon from "../ui/icons/MicIcon";

export default function ShortcutsTab() {
  return (
    <div className="p-4 pb-8 bg-[#1D1D1F] text-neutral-300 h-full overflow-y-auto">
      {/* Cabeçalho */}
      <div className="mb-6 px-4">
        <h2 className="text-base font-medium text-white">Keyboard shortcuts</h2>
        <p className="text-sm text-neutral-400">
          Visualize os atalhos de teclado configurados para o seu fluxo de trabalho.
        </p>
      </div>

      {/* Atalhos */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white px-4">General</h3>
        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="gap-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m14 10 7-7"/>
              <path d="M20 10h-6V4"/>
              <path d="m3 21 7-7"/>
              <path d="M4 14h6v6"/>
            </svg>
            <h3 className="text-sm font-medium text-white">Toggle visibility of Primer</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm bg-white/10 px-2.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">\</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
            </svg>
            <h3 className="text-sm font-medium text-white">Ask Primer about your screen or anything</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="bg-white/10 p-1.5 rounded-lg text-white/70 group-hover:text-white transition"><EnterIcon size={16}/></span>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <MonitorIcon size={16}/>
            <h3 className="text-sm font-medium text-white">
              Take a screenshot and submit 
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
              <span className="bg-white/10 p-1.5 rounded-lg text-white/70 group-hover:text-white transition"><EnterIcon size={16}/></span>
            </div>
            +
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
              <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">E</span>
            </div>
          </div>
        </div>


        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <MicIcon size={16}/>
            <h3 className="text-sm font-medium text-white">
              Ask Primer with audio
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">D</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/>
              <path d="m5.082 11.09 8.828 8.828"/>
            </svg>
            <h3 className="text-sm font-medium text-white">
              Clear the current conversation with Primer
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">R</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 18a2 2 0 0 0-4 0"/>
              <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11"/>
              <path d="M2 11h20"/>
              <circle cx="17" cy="18" r="3"/>
              <circle cx="7" cy="18" r="3"/>
            </svg>
            <h3 className="text-sm font-medium text-white">
              Start or stop a Stealth mode session
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Shift</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">S</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white px-4">Scroll</h3>
        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16"
              height="16"
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              stroke-width="2" 
              stroke-linecap="round"
              stroke-linejoin="round" 
            >
              <rect x="5" y="2" width="14" height="20" rx="7"/>
              <path d="M12 6v4"/>
            </svg>
            <h3 className="text-sm font-medium text-white">
              Scroll the response window up
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg> 
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center px-4 py-2 hover:bg-[#232326] rounded-lg">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16"
              height="16"
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              stroke-width="2" 
              stroke-linecap="round"
              stroke-linejoin="round" 
            >
              <rect x="5" y="2" width="14" height="20" rx="7"/>
              <path d="M12 6v4"/>
            </svg>
            <h3 className="text-sm font-medium text-white">
              Scroll the response window down
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">Ctrl</span>
            <span className="text-sm font-medium bg-white/10 px-1.5 py-1 rounded-lg text-white/70 group-hover:text-white transition">
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="18" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 5v14"/>
                <path d="m19 12-7 7-7-7"/>
              </svg>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
