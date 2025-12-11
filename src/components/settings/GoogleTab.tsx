import { useState } from "react";
import CheckIcon from "../ui/icons/CheckIcon";
import CircleAlertIcon from "../ui/icons/CircleAlertIcon";
import { useAi } from "../../contexts/AiContext";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string;
  savedModel?: string;
}

type PerformanceMode = "rapido" | "padrao" | "qualidade" | "personalizado";

export default function GoogleTab({ 
  apiKey, 
  setApiKey, 
  model, 
  setModel,
  savedKey, 
}: Props) {
  const { 
    activeProvider, 
    setActiveProvider,
    transcriptionModel,
    setTranscriptionModel,
    imageModel,
    setImageModel
  } = useAi();
  
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("personalizado");

  // Modelos principais do Gemini (Atualizado para a solicitação)
  const analysisModels = [
    { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview", description: "O modelo de próxima geração do Gemini, com capacidades avançadas e multimodais." },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Modelo poderoso para raciocínio complexo e tarefas multimodais." },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Modelo otimizado para velocidade e eficiência de custo." },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", description: "Versão ultra-leve e econômica do Flash." },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", description: "Modelo leve focado em velocidade." }
  ];

  // Modelos de transcrição Gemini Live (Apenas os solicitados)
  const transcriptionModels = [
    { id: "gemini-live-2.5-flash-preview", label: "Gemini Live 2.5 Flash Preview", description: "O modelo mais recente para transcrição de voz em tempo real." }
  ];

  // Modelos de geração de imagem
  const imageModels = [
    { id: "imagen-3.0-generate-001", label: "Imagen 3.0", description: "Latest image generation model" },
    { id: "imagen-3.0-fast-generate-001", label: "Imagen 3.0 Fast", description: "Faster image generation" },
    { id: "imagen-2.0-generate-001", label: "Imagen 2.0", description: "Previous generation" }
  ];

  const performanceModes = {
    rapido: { model: "gemini-2.5-flash-lite", label: "Rápido" },
    padrao: { model: "gemini-2.5-flash", label: "Padrão" },
    qualidade: { model: "gemini-2.5-pro", label: "Qualidade" }, // gemini-3-pro-preview is a preview, so keep 2.5-pro for stable "qualidade"
    personalizado: { model: model, label: "Personalizado" }
  };

  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  const handlePerformanceChange = (mode: PerformanceMode) => {
    setPerformanceMode(mode);
    if (mode !== "personalizado") {
      setModel(performanceModes[mode].model);
    }
  };

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">Google</h2>
          <p className="text-neutral-400 mb-4">Gemini 3 Pro, Gemini 2.5 e outros modelos</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "Google" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e"/>
              Ativo
            </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("Google")}
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
          {currentStatus === "success" ? "Pronto" : "Aguardando configuração"}
        </span>
      </button>

      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
        </div>
        <input
          type="password"
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500"
          placeholder="Cole sua chave API aqui..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>

      <p className="text-neutral-400 text-sm mb-6">
        Sua chave de API do Gemini para suporte de análise de imagem.
      </p>

      {/* Desempenho */}
      <h3 className="text-lg font-semibold mb-3">Desempenho</h3>
      <p className="text-neutral-400 text-sm mb-4">
        Escolha o equilíbrio preferido entre velocidade e qualidade. Selecionaremos automaticamente os melhores modelos para você.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {/* Rápido */}
        <button
          onClick={() => handlePerformanceChange("rapido")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition ${
            performanceMode === "rapido"
              ? "bg-neutral-800 border-neutral-600"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-medium mb-1">Rápido</span>
          <span className="font-medium mb-1">Respostas rápidas, respostas curtas</span>
          <span className="text-xs text-neutral-400 text-center">Flash Lite</span>
        </button>

        {/* Padrão */}
        <button
          onClick={() => handlePerformanceChange("padrao")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition ${
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
          <span className="font-medium mb-1">Boa combinação de velocidade e qualidade</span>
          <span className="text-xs text-neutral-400 text-center">Gemini 2.5 Flash</span>
        </button>

        {/* Qualidade */}
        <button
          onClick={() => handlePerformanceChange("qualidade")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition ${
            performanceMode === "qualidade"
              ? "bg-neutral-800 border-neutral-600"
              : "bg-black border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-medium mb-1">Qualidade</span>
          <span className="font-medium mb-1">Respostas completas, respostas detalhadas</span>
          <span className="text-xs text-neutral-400 text-center">Gemini 2.5 Pro</span>
        </button>

        {/* Personalizado */}
        <button
          onClick={() => handlePerformanceChange("personalizado")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition relative ${
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
          <span className="text-xs text-neutral-400 text-center">Escolha seus próprios modelos</span>
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
              {analysisModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            
            {analysisModels.find(m => m.id === model) && (
              <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-400">
                  {analysisModels.find(m => m.id === model)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Modelo de Transcrição Gemini Live */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Modelo de Transcrição Gemini Live</h3>
            <p className="text-neutral-400 text-sm mb-3">Selecione o modelo usado para transcrição de voz Gemini Live</p>
            
            <select
              value={transcriptionModel}
              onChange={(e) => setTranscriptionModel(e.target.value)}
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
            <p className="text-neutral-400 text-sm mb-3">Modelo usado para gerar imagens com Imagen</p>
            
            <select
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
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
            {analysisModels.find(m => m.id === model)?.description || "Modelo otimizado para este modo de desempenho"}
          </p>
        </div>
      )}
    </div>
  );
}
