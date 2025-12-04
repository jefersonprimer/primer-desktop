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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M12 2v10m6.364-6.364a9 0 11-12.728 0"
          />
        </svg>
        Sair
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