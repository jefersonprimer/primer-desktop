import { invoke } from "@tauri-apps/api/core";

export default function Footer() {
  const onClose = async () => {
    await invoke("close_app");
  };

  // For demonstration purposes, replace with actual save logic
  const onSave = () => {
    console.log("Save button clicked");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-zinc-800/80 backdrop-blur-sm rounded-b-xl">
      {/* Botão power */}
      <button
        className="text-zinc-400 hover:text-red-500 transition flex items-center gap-2"
        onClick={onClose}
      >
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
          className="lucide lucide-power-icon lucide-power"
        >
          <path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>
        </svg>
      </button>

      {/* Botão salvar */}
      <button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        onClick={onSave}
      >
        Salvar
      </button>
    </div>
  );
}
