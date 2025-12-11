import MicOffIcon from "../ui/icons/MicOffIcon";
import HeadsetIcon from "../ui/icons/HeadsetIcon";
import { useState, useEffect } from "react";
import { useAi } from "../../contexts/AiContext";

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export default function AudioScreenTab() {
  const { 
    inputDeviceId, 
    setInputDeviceId, 
    outputDeviceId, 
    setOutputDeviceId 
  } = useAi();

  const [tab, setTab] = useState<"input" | "output">("input");
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

  // Carregar dispositivos de áudio
  useEffect(() => {
    loadAudioDevices();
  }, []);

  const loadAudioDevices = async () => {
    try {
      // Solicitar permissões
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microfone ${device.deviceId.slice(0, 5)}`,
          kind: device.kind
        }));

      const audioOutputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Alto-falante ${device.deviceId.slice(0, 5)}`,
          kind: device.kind
        }));

      setInputDevices(audioInputs);
      setOutputDevices(audioOutputs);

      // Selecionar dispositivos padrão se não houver seleção no contexto
      if (audioInputs.length > 0 && (!inputDeviceId || inputDeviceId === "default")) {
        setInputDeviceId(audioInputs[0].deviceId);
      }
      if (audioOutputs.length > 0 && (!outputDeviceId || outputDeviceId === "default")) {
        setOutputDeviceId(audioOutputs[0].deviceId);
      }
    } catch (error) {
      console.error("Erro ao carregar dispositivos de áudio:", error);
    }
  };

  const getDeviceLabel = (deviceId: string, devices: AudioDevice[]) => {
    const device = devices.find(d => d.deviceId === deviceId);
    return device?.label || "Microfone Padrão";
  };

  const hasNoOutputDevices = outputDevices.length === 0;

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300 h-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("input")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            tab === "input"
              ? "border-blue-500 bg-blue-950"
              : "border-neutral-700 bg-black hover:bg-neutral-900"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Seu Áudio
        </button>
        <button
          onClick={() => setTab("output")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            tab === "output"
              ? "border-blue-500 bg-blue-950"
              : "border-neutral-700 bg-black hover:bg-neutral-900"
          }`}
        >
          <HeadsetIcon size={24}/> 
          Áudio Recebido
        </button>
      </div>

      {/* Conteúdo da aba Input */}
      {tab === "input" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Seu Microfone</h3>
            
            {/* Dropdown de Microfone */}
            <div className="relative z-20">
              <button
                onClick={() => setIsInputOpen(!isInputOpen)}
                className="w-full flex justify-between items-center px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-neutral-600 transition"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  {getDeviceLabel(inputDeviceId, inputDevices)}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isInputOpen ? 'rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isInputOpen && (
                <div className="absolute z-10 left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                  {inputDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => {
                        setInputDeviceId(device.deviceId);
                        setIsInputOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700 transition ${
                        inputDeviceId === device.deviceId ? 'bg-blue-950 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      {device.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Barra de nível de áudio */}
            <div className="mt-4 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
            </div>

            {/* Informações */}
            <div className="mt-4 flex justify-between items-center text-sm">
              <p className="text-neutral-400">
                Selecione seu microfone para capturar o que você diz durante reuniões
              </p>
              <p className="text-green-400 font-medium">
                {inputDevices.length} {inputDevices.length === 1 ? 'dispositivo disponível' : 'dispositivos disponíveis'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da aba Output */}
      {tab === "output" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Fonte de Áudio Recebido</h3>
            
            {/* Dropdown de Saída de Áudio */}
            <div className="relative z-20">
              <button
                onClick={() => !hasNoOutputDevices && setIsOutputOpen(!isOutputOpen)}
                disabled={hasNoOutputDevices}
                className={`w-full flex justify-between items-center px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg transition ${
                  hasNoOutputDevices 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-neutral-600 cursor-pointer'
                }`}
              >
                <span className="flex items-center gap-3">
                  <MicOffIcon size={18}/>
                  {hasNoOutputDevices 
                    ? "Nenhum (Desativado)" 
                    : getDeviceLabel(outputDeviceId, outputDevices)
                  }
                </span>
                {!hasNoOutputDevices && (
                  <svg 
                    className={`w-4 h-4 transition-transform ${isOutputOpen ? 'rotate-180' : ''}`} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {isOutputOpen && !hasNoOutputDevices && (
                <div className="absolute z-10 left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                  {/* Opção Nenhum */}
                  <button
                    onClick={() => {
                      setOutputDeviceId("");
                      setIsOutputOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700 transition ${
                      outputDeviceId === "" ? 'bg-blue-950 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                    Nenhum (Desativado)
                  </button>

                  {/* Áudio do Sistema */}
                  <button
                    onClick={() => {
                      setOutputDeviceId("system");
                      setIsOutputOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700 transition ${
                      outputDeviceId === "system" ? 'bg-blue-950 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    Áudio do Sistema (Nativo)
                  </button>

                  {/* Dispositivos de saída */}
                  {outputDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => {
                        setOutputDeviceId(device.deviceId);
                        setIsOutputOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700 transition ${
                        outputDeviceId === device.deviceId ? 'bg-blue-950 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      {device.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="mt-4 text-sm">
              <p className="text-neutral-400">
                Capture áudio de outros em reuniões (requer dispositivo de áudio virtual para áudio do sistema)
              </p>
              <p className="text-green-400 font-medium mt-2">
                {outputDevices.length} {outputDevices.length === 1 ? 'dispositivo disponível' : 'dispositivos disponíveis'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
