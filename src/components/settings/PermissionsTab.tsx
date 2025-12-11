import { useState, useEffect } from "react";

export default function PermissionsTab() {
  const [micPermission, setMicPermission] = useState<boolean>(false);
  const [screenPermission, setScreenPermission] = useState<boolean>(false);
  const [loadingMic, setLoadingMic] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // Check Mic (Check if we already have labels, meaning permission granted OR if we have a manual override)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicPermission = devices.some(d => d.kind === 'audioinput' && d.label !== '');
      const hasOverride = localStorage.getItem("app_permission_mic_override") === "true";
      
      if (hasMicPermission || hasOverride) {
        setMicPermission(true);
      }
    } catch (e) {
      console.error("Error checking mic permission", e);
      // Even if check fails, trust the override if it exists
      if (localStorage.getItem("app_permission_mic_override") === "true") {
        setMicPermission(true);
      }
    }

    // Check Screen (Local Storage)
    const screenAllowed = localStorage.getItem("app_permission_screen_capture") === "true";
    setScreenPermission(screenAllowed);
  };

  const handleMicToggle = async () => {
    if (micPermission) {
        // User wants to disable?
        setMicPermission(false);
        localStorage.removeItem("app_permission_mic_override");
        return;
    }

    setLoadingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop immediately, we just wanted permission
      stream.getTracks().forEach(t => t.stop());
      setMicPermission(true);
      localStorage.setItem("app_permission_mic_override", "true");
    } catch (e: any) {
      console.error("Mic permission denied", e);
      // Allow manual override
      const force = window.confirm(
        `Erro ao acessar microfone: ${e.name} - ${e.message}\n\nDeseja marcar como "Permitido" mesmo assim? (Isso não corrige bloqueios do sistema)`
      );
      if (force) {
        setMicPermission(true);
        localStorage.setItem("app_permission_mic_override", "true");
      }
    } finally {
      setLoadingMic(false);
    }
  };

  const handleScreenToggle = () => {
    const newState = !screenPermission;
    setScreenPermission(newState);
    localStorage.setItem("app_permission_screen_capture", String(newState));
  };

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300 h-full">
      {/* Item de Permissão: Microfone */}
      <div className="flex items-start justify-between py-4 border-b border-neutral-800">
        <div className="flex-1">
          <h3 className="text-base font-medium text-white mb-1">Acesso ao Microfone</h3>
          <p className="text-sm text-neutral-400">
            Necessário para recursos de gravação de voz.
          </p>
        </div>
        
        <div className="flex items-center ml-4">
          {micPermission ? (
            <svg 
              className="w-6 h-6 text-green-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          ) : (
            <button
              onClick={handleMicToggle}
              disabled={loadingMic}
              className="text-neutral-500 hover:text-neutral-300 transition"
            >
              <svg 
                className="w-6 h-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Item de Permissão: Captura de Tela */}
      <div className="flex items-start justify-between py-4 border-b border-neutral-800">
        <div className="flex-1">
          <h3 className="text-base font-medium text-white mb-1">Captura de Tela</h3>
          <p className="text-sm text-neutral-400">
            Necessário para tirar capturas de tela.
          </p>
        </div>
        
        <div className="flex items-center ml-4">
          {screenPermission ? (
            <svg 
              className="w-6 h-6 text-green-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          ) : (
            <button
              onClick={handleScreenToggle}
              className="text-neutral-500 hover:text-neutral-300 transition"
            >
              <svg 
                className="w-6 h-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Aviso sobre modo furtivo */}
      <div className="mt-6">
        <p className="text-sm text-neutral-400 leading-relaxed">
          O aplicativo é executado em modo furtivo (oculto da barra de tarefas). Use <span className="text-neutral-200 font-medium">Ctrl+B</span> para mostrar/ocultar.
        </p>
      </div>
    </div>
  );
}
