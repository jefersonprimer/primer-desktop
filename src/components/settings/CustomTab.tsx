import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import CheckIcon from "../ui/icons/CheckIcon";
import { useAi } from "../../contexts/AiContext";
import WhisperManager from "./WhisperManager";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string;
  savedModel?: string;
  onSave: () => void;
}

interface OllamaModel {
  name: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
  };
}

export default function CustomTab({ 
    apiKey,
    setApiKey,
    model,
    setModel,
    savedKey,
    onSave,}: Props) {
  const { activeProvider, setActiveProvider, getTranscriptionModelForProvider, setTranscriptionModelForProvider } = useAi();
  
  const transcriptionModel = getTranscriptionModelForProvider("Custom");

  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingOllama, setLoadingOllama] = useState(false);
  const [errorOllama, setErrorOllama] = useState("");
  const [activeWhisperModel, setActiveWhisperModel] = useState<string>(() => localStorage.getItem("whisper_model") || "tiny");
  const [showWhisperConfig, setShowWhisperConfig] = useState(transcriptionModel === "whisper_cpp");

  useEffect(() => {
    if (transcriptionModel === "whisper_cpp") {
      setShowWhisperConfig(false);
    }
  }, [transcriptionModel]);

  const isMacOrWin = /Mac|Win/.test(navigator.platform);
  const sttStrategies = [
    { id: "whisper_cpp", label: "Whisper Local (cpp)", description: "Offline, private transcription running on your device" },
    ...(isMacOrWin ? [{ id: "web_speech_api", label: "Web Speech API", description: "Browser built-in speech recognition (Fast, Free)" }] : [])
  ];

  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  const handleSetWhisperModel = (name: string) => {
    localStorage.setItem("whisper_model", name);
    setActiveWhisperModel(name);
    setTranscriptionModelForProvider("Custom", "whisper_cpp");
  };

  useEffect(() => {
    fetchOllamaModels();
  }, [apiKey]);

  const fetchOllamaModels = async () => {
    setLoadingOllama(true);
    setErrorOllama("");
    const urlToUse = apiKey || "http://localhost:11434";
    try {
      const models = await invoke<OllamaModel[]>("get_ollama_models", { url: urlToUse });
      setOllamaModels(models);
      if (models.length > 0 && !model) {
        setModel(models[0].name);
      }
    } catch (err: any) {
      console.error("Failed to fetch Ollama models:", err);
      setErrorOllama(err.toString());
      setOllamaModels([]);
    } finally {
      setLoadingOllama(false);
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="px-6 py-4 pb-8 bg-[#1D1D1F] text-neutral-300">
      <div className="flex justify-between items-center bg-[#242425] py-2 px-4 rounded-lg">
        <div>
          <h2 className="text-white text-base font-semibold">Custom</h2>
          <p className="text-gray-400 text-sm">Run models locally with Ollama and Whisper.cpp</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "Custom" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e"/>
              Ativo
            </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("Custom")}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-neutral-700 transition"
            >
              Usar este modelo
            </button>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 my-6 bg-[#242425] py-2 px-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Ollama URL</span>
          <button className="flex items-center gap-2 text-sm rounded-lg border border-[#5BBF4B] bg-[#071C0B] py-1 px-2">
            <span className="rounded-full bg-[#5BBF4B] text-[#071C0B]">
              <CheckIcon size={16} color="#071C0B"/>
            </span>
            <span className={`${currentStatus === "success" ? "text-green-500" : "text-neutral-500"}`}>
              {currentStatus === "success" ? "Ready" : "Waiting for Save"}
            </span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <input
              type="text"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="http://localhost:11434"
          />
          <button 
              onClick={fetchOllamaModels}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
          >
              Refresh
          </button>
        </div>

        {errorOllama && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-lg">
                Could not connect to Ollama. Make sure it is running. ({errorOllama})
            </div>
        )}
      </label>

      <label className="flex flex-col gap-1 my-6 bg-[#242425] py-2 px-4 rounded-lg">
          <span className="text-sm text-white">Selected Model</span>
          <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              disabled={loadingOllama || ollamaModels.length === 0}
          >
              {ollamaModels.length === 0 ? (
                  <option value="">{loadingOllama ? "Loading..." : "No models found"}</option>
              ) : (
                  ollamaModels.map((m) => (
                      <option key={m.name} value={m.name}>
                          {m.name} ({m.details.parameter_size}, {formatSize(m.size)})
                      </option>
                  ))
              )}
          </select>

        <p className="text-neutral-400 text-sm">
          Downloaded models found in your local Ollama instance.
        </p>
      </label>

      {/* Whisper Section */}
      <div className="bg-[#242425] py-2 px-4 rounded-lg">
        <h3 className="text-base text-white font-semibold">Speech Recognition</h3>
        <p className="text-sm text-neutral-400 mb-3">
            Choose your speech-to-text provider.
        </p>

        <div>
            <select
                value={transcriptionModel}
                onChange={(e) => {
                  setTranscriptionModelForProvider("Custom", e.target.value);
                  if (e.target.value === "whisper_cpp") {
                    setShowWhisperConfig(true);
                  }
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
                {sttStrategies.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.label}
                    </option>
                ))}
            </select>

            {/* Whisper Management Toggle Button */}
            {transcriptionModel === "whisper_cpp" && (
              <button 
                onClick={() => setShowWhisperConfig(!showWhisperConfig)}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
              >
                <div className={`p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-transform ${showWhisperConfig ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                {showWhisperConfig ? 'Ocultar configurações locais' : 'Gerenciar Modelos Whisper (Local)'}
              </button>
            )}
        </div>

        {/* Whisper Model Manager Section */}
        {transcriptionModel === "whisper_cpp" && showWhisperConfig && (
          <div className="mt-4 bg-[#0A0A0A] border border-neutral-800 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Central de Modelos Locais</h4>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Status: <span className="text-blue-400">{activeWhisperModel} Ativo</span></p>
                </div>
              </div>
            </div>

            <WhisperManager 
                activeModel={activeWhisperModel} 
                onModelChange={handleSetWhisperModel} 
            />
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-800">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition"
        >
          Salvar Alterações
        </button>
      </div>

    </div>
  );
}
