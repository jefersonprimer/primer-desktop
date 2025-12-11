import { useState, useEffect } from "react";
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

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  description?: string;
}

export default function OpenRouterTab({ apiKey, setApiKey, model, setModel, savedKey }: Props) {
  const { activeProvider, setActiveProvider } = useAi();
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Modelos gratuitos padrão (fallback se a API falhar)
  const defaultFreeModels = [
    { 
      id: "google/gemma-2-9b-it:free", 
      name: "Google: Gemma 2 9B (free)",
      pricing: { prompt: "0", completion: "0" },
      context_length: 8192,
      description: "Free tier model"
    },
    { 
      id: "mistralai/mistral-7b-instruct:free", 
      name: "Mistral: Mistral 7B Instruct (free)",
      pricing: { prompt: "0", completion: "0" },
      context_length: 32768,
      description: "Free tier model"
    },
    { 
      id: "meta-llama/llama-3.2-3b-instruct:free", 
      name: "Meta: Llama 3.2 3B Instruct (free)",
      pricing: { prompt: "0", completion: "0" },
      context_length: 131072,
      description: "Free tier model"
    },
  ];

  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  // Definir modelo padrão gratuito se não houver nenhum
  useEffect(() => {
    if (!model) {
      setModel(defaultFreeModels[0].id);
    }
  }, []);

  const fetchOpenRouterModels = async () => {
    setIsLoadingModels(true);
    setModelsError(null);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao buscar modelos");
      }

      const data = await response.json();
      
      // Ordenar: modelos gratuitos primeiro, depois por nome
      const sortedModels = data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => {
        const aIsFree = parseFloat(a.pricing.prompt) === 0 && parseFloat(a.pricing.completion) === 0;
        const bIsFree = parseFloat(b.pricing.prompt) === 0 && parseFloat(b.pricing.completion) === 0;
        
        if (aIsFree && !bIsFree) return -1;
        if (!aIsFree && bIsFree) return 1;
        return a.name.localeCompare(b.name);
      });

      setAvailableModels(sortedModels);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
      setModelsError("Não foi possível carregar os modelos. Usando modelos padrão.");
      setAvailableModels(defaultFreeModels);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const displayedModels = availableModels.length > 0 ? availableModels : defaultFreeModels;
  
  const selectedModelInfo = displayedModels.find(m => m.id === model);
  const isFreeModel = selectedModelInfo && 
    parseFloat(selectedModelInfo.pricing.prompt) === 0 && 
    parseFloat(selectedModelInfo.pricing.completion) === 0;

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">OpenRouter</h2>
          <p className="text-neutral-400 mb-4">Acesse múltiplos modelos via OpenRouter.ai</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenRouter" ? (
             <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
               <CheckIcon size={16} color="#22c55e"/>
               Ativo
             </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("OpenRouter")}
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
        Chave de API para usar modelos via OpenRouter.ai
      </p>

      {/* Nota sobre Whisper */}
      <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 mb-6 flex items-start gap-2">
        <CircleAlertIcon size={24}/>
        <p className="text-sm text-blue-300">
          Nota: Whisper (entrada de voz) requer uma chave de API da OpenAI ou Google para transcrição de áudio. OpenRouter lida apenas com respostas de texto.
        </p>
      </div>

      {/* Modelo */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Modelo</h3>
        <button
          onClick={fetchOpenRouterModels}
          disabled={isLoadingModels}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-2"
        >
          {isLoadingModels ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Carregando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Carregar Modelos
            </>
          )}
        </button>
      </div>

      {modelsError && (
        <div className="mb-4 p-3 bg-yellow-950/30 border border-yellow-900/50 rounded-lg">
          <p className="text-sm text-yellow-300">{modelsError}</p>
        </div>
      )}

      <div className="mb-6">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none"
        >
          {displayedModels.map((m) => {
            const isFree = parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0;
            return (
              <option key={m.id} value={m.id}>
                {m.name} {isFree ? "⭐ FREE" : `($${m.pricing.prompt}/${m.pricing.completion})`}
              </option>
            );
          })}
        </select>
        <p className="text-neutral-500 text-xs mt-2">
          {availableModels.length > 0 
            ? `${availableModels.length} modelos disponíveis. Modelos gratuitos aparecem primeiro.`
            : "Clique em 'Carregar Modelos' para ver todos os modelos disponíveis."
          }
        </p>
      </div>

      {/* Informações do modelo selecionado */}
      {selectedModelInfo && (
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-neutral-200">{selectedModelInfo.name}</h4>
            {isFreeModel && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                GRATUITO
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Prompt:</span>
              <span className="ml-2 text-neutral-300">
                {isFreeModel ? "Grátis" : `$${selectedModelInfo.pricing.prompt}`}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Completion:</span>
              <span className="ml-2 text-neutral-300">
                {isFreeModel ? "Grátis" : `$${selectedModelInfo.pricing.completion}`}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500">Context:</span>
              <span className="ml-2 text-neutral-300">
                {selectedModelInfo.context_length.toLocaleString()} tokens
              </span>
            </div>
          </div>

          {selectedModelInfo.description && (
            <p className="mt-3 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
              {selectedModelInfo.description}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <a 
          href="https://openrouter.ai/models" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Ver detalhes do modelo no OpenRouter →
        </a>
      </div>
    </div>
  );
}
