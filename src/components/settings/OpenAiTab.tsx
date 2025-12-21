import { useState, useEffect } from "react";
import CheckIcon from "../ui/icons/CheckIcon";
import CircleAlertIcon from "../ui/icons/CircleAlertIcon";
import { useAi } from "../../contexts/AiContext";
import WhisperManager from "./WhisperManager";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string;
  onSave: () => void;
}

type PerformanceMode = "rapido" | "padrao" | "qualidade" | "personalizado";

export default function OpenAiTab({
  apiKey,
  setApiKey,
  model,
  setModel,
  savedKey,
  onSave,
}: Props) {
  const {
    activeProvider,
    setActiveProvider,
    getTranscriptionModelForProvider,
    setTranscriptionModelForProvider,
    imageModel,
    setImageModel
  } = useAi();
  
  const transcriptionModel = getTranscriptionModelForProvider("OpenAI");

  // Track specific whisper model selection
  const [activeWhisperModel, setActiveWhisperModel] = useState<string>(() => localStorage.getItem("whisper_model") || "tiny");
  const [showWhisperConfig, setShowWhisperConfig] = useState(transcriptionModel === "whisper_cpp");

  useEffect(() => {
    if (transcriptionModel === "whisper_cpp") {
      setShowWhisperConfig(false);
    }
  }, [transcriptionModel]);

  const handleSetWhisperModel = (name: string) => {
    localStorage.setItem("whisper_model", name);
    setActiveWhisperModel(name);
  };

  // Os 4 melhores modelos da OpenAI (Atualizado para a solicitação)
  const topModels = [
    { id: "gpt-4.1", label: "GPT-4.1", description: "O modelo mais avançado para análise complexa e multimodality." },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", description: "Versão ultra-rápida e eficiente do GPT-4.1." },
    { id: "gpt-4o", label: "GPT-4o", description: "O modelo versátil padrão para texto, visão e áudio." },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Modelo rápido e econômico para tarefas cotidianas." }
  ];

  // Lista completa de modelos para personalizado (Restrita conforme solicitado)
  const allModels = [
    { id: "gpt-4.1", label: "gpt-4.1", description: "Advanced multimodal model for complex analysis and reasoning." },
    { id: "gpt-4.1-nano", label: "gpt-4.1-nano", description: "Lightweight, extremely fast model for quick tasks." },
    { id: "gpt-4o", label: "gpt-4o", description: "Versatile flagship model for high-quality text and vision." },
    { id: "gpt-4o-mini", label: "gpt-4o-mini", description: "Cost-effective, fast model for standard interactions." }
  ];

  // Modelos de transcrição (Atualizado)
  const isMacOrWin = /Mac|Win/.test(navigator.platform);
  const transcriptionModels = [
    { id: "gpt-4o-transcribe", label: "GPT-4o Transcribe", description: "High-accuracy transcription using GPT-4o technology" },
    { id: "gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe", description: "Fast transcription optimized for speed" },
    { id: "whisper_cpp", label: "Whisper Local (cpp)", description: "Offline, private transcription running on your device" },
    ...(isMacOrWin ? [{ id: "web_speech_api", label: "Web Speech API", description: "Browser built-in speech recognition (Fast, Free)" }] : [])
  ];

  // Modelos de geração de imagem
  const imageModels = [
    { id: "dall-e-3", label: "DALL-E 3", description: "Most advanced image generation" },
    { id: "dall-e-2", label: "DALL-E 2", description: "Previous generation" },
    { id: "gpt-image-1", label: "GPT-Image-1", description: "Latest image model" },
    { id: "gpt-image-1-mini", label: "GPT-Image-1 Mini", description: "Faster image generation" }
  ];

  const performanceModes = {
    rapido: { model: "gpt-4o-mini", label: "Rápido" },
    padrao: { model: "gpt-4o", label: "Padrão" },
    qualidade: { model: "gpt-4.1", label: "Qualidade" },
    personalizado: { model: model, label: "Personalizado" }
  };

  const getInitialPerformanceMode = (currentModel: string): PerformanceMode => {
    if (currentModel === performanceModes.rapido.model) return "rapido";
    if (currentModel === performanceModes.padrao.model) return "padrao";
    if (currentModel === performanceModes.qualidade.model) return "qualidade";
    return "personalizado";
  };

  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => getInitialPerformanceMode(model));

  useEffect(() => {
    setPerformanceMode(getInitialPerformanceMode(model));
  }, [model]);

  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  const handlePerformanceChange = (mode: PerformanceMode) => {
    setPerformanceMode(mode);
    if (mode !== "personalizado") {
      setModel(performanceModes[mode].model);
    }
  };

  return (
    <div className="px-6 py-4 pb-8 bg-[#1D1D1F] text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">OpenAI</h2>
          <p className="text-neutral-400 mb-4">GPT-4.1, GPT-4o e outros modelos</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenAI" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e"/>
              Ativo
            </span>
          ) : (
            <button
              onClick={() => setActiveProvider("OpenAI")}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-neutral-700 transition"
            >
              Usar este modelo
            </button>
          )}
        </div>
      </div>

      <button className="flex items-center gap-2 my-6 rounded-lg border border-[#5BBF4B] bg-[#071C0B] py-2 px-4">
        <span className="rounded-full bg-[#5BBF4B] text-[#071C0B]">
          <CheckIcon size={18} color="#071C0B"/>
        </span>
        <span className={`${currentStatus === "success" ? "text-green-500" : "text-neutral-500"}`}>
          {currentStatus === "success" ? "Pronto" : "Chave necessária"}
        </span>
      </button>

      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
        </div>
        <input
          type="password"
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>

      <p className="text-neutral-400 text-sm mb-6">
        Sua chave de API e armazenada localmente, e nunca e enviada aos nossos servidores. 
      </p>

      {/* Speech-to-Text Model Selection (Moved outside personalized) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Modelo de Transcrição</h3>
        <p className="text-neutral-400 text-sm mb-3">Selecione o modelo usado para transcrição de voz</p>
        
        <select
          value={transcriptionModel}
          onChange={(e) => {
            setTranscriptionModelForProvider("OpenAI", e.target.value);
            if (e.target.value === "whisper_cpp") {
              setShowWhisperConfig(true);
            }
          }}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
        >
          {transcriptionModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        
        {transcriptionModels.find(m => m.id === transcriptionModel) && (
          <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-sm text-neutral-400">
              {transcriptionModels.find(m => m.id === transcriptionModel)?.description}
            </p>
          </div>
        )}

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

      <h3 className="text-lg font-semibold mb-3">Desempenho</h3>
      <p className="text-neutral-400 text-sm mb-4">
        Escolha o equilíbrio preferido entre velocidade e qualidade. Selecionaremos automaticamente os melhores modelos para você.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => handlePerformanceChange("rapido")}
          className={`flex flex-col items-center justify-center p-4 bg-[#0D0D0D] rounded-lg border transition ${
            performanceMode === "rapido"
              ? "bg-neutral-800 border-neutral-600"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-medium mb-1">Rápido</span>
          <span className="font-medium text-xs">Respostas rápidas, respostas curtas</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("padrao")}
          className={`flex flex-col items-center justify-center p-4 bg-[#0D0D0D] rounded-lg border transition ${
            performanceMode === "padrao"
              ? "bg-neutral-800 border-neutral-600"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
          <span className="font-medium mb-1">Padrão</span>
          <span className="font-medium text-xs">Boa combinação de velocidade e qualidade</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("qualidade")}
          className={`flex flex-col items-center justify-center p-4 bg-[#0D0D0D] rounded-lg border transition ${
            performanceMode === "qualidade"
              ? "bg-neutral-800 border-neutral-600"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-medium mb-1">Qualidade</span>
          <span className="font-medium text-xs">Respostas completas, respostas detalhadas</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("personalizado")}
          className={`flex flex-col items-center justify-center p-4 bg-[#0D0D0D] rounded-lg border transition relative ${
            performanceMode === "personalizado"
              ? "bg-indigo-950 border-indigo-700"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          {performanceMode === "personalizado" && (
            <div className="absolute top-2 right-2">
              <CheckIcon size={16} color="#818cf8" />
            </div>
          )}
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364l-2.121-2.121M8.757 8.757L6.636 6.636m12.728 0l-2.121 2.121m-9.9 9.9l-2.121 2.121" />
            </svg>
          <span className="font-medium mb-1">Personalizado</span>
          <span className="text-xs">Escolha seus próprios modelos</span>
        </button>
      </div>

      <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3 mb-6 flex items-start gap-2">
        <CircleAlertIcon size={18}/>
        <p className="text-sm text-neutral-300">
          As seleções de modelo são otimizadas automaticamente com base na sua escolha de desempenho.
        </p>
      </div>

      {/* Seleção de Modelo Personalizado */}
      {performanceMode === "personalizado" && (
        <div className="space-y-6 mb-6">
          {/* Modelo de Análise */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Modelo de Análise</h3>
            <p className="text-neutral-400 text-sm mb-3">Modelo usado para analisar imagens e conversas</p>
            
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {allModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            
            {allModels.find(m => m.id === model) && (
              <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">
                  {allModels.find(m => m.id === model)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Modelo de Transcrição Whisper */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Modelo de Transcrição Whisper</h3>
            <p className="text-neutral-400 text-sm mb-3">Selecione o modelo usado para transcrição de voz em tempo real</p>
            
            <select
              value={transcriptionModel}
              onChange={(e) => setTranscriptionModelForProvider("OpenAI", e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {transcriptionModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            
            {transcriptionModels.find(m => m.id === transcriptionModel) && (
              <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">
                  {transcriptionModels.find(m => m.id === transcriptionModel)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Modelo de Geração de Imagem */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Modelo de Geração de Imagem</h3>
            <p className="text-neutral-400 text-sm mb-3">Modelo usado para gerar imagens</p>
            
            <select
              value={imageModel}
              onChange={(e) => setImageModel?.(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {imageModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            
            {imageModels.find(m => m.id === imageModel) && (
              <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">
                  {imageModels.find(m => m.id === imageModel)?.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modelo atual quando não for personalizado */}
      {performanceMode !== "personalizado" && (
        <div className="mb-6 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-400">Modelo Selecionado</span>
            <span className="text-sm font-medium text-neutral-200">{model}</span>
          </div>
          <p className="text-xs text-neutral-500">
            {topModels.find(m => m.id === model)?.description || "Modelo otimizado para este modo de desempenho"}
          </p>
        </div>
      )}
      
      <div className="mt-4 mb-8">
        <a 
          href="https://platform.openai.com/docs/models" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Ver detalhes do modelo
        </a>
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
