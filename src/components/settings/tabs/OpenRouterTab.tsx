import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAi } from "../../../contexts/AiContext";

import CheckIcon from "@/components/ui/icons/CheckIcon";
import CloseIcon from "@/components/ui/icons/CloseIcon";

import WhisperManager from "./WhisperManager";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string;
  onSave: () => void;
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

export default function OpenRouterTab({ apiKey, setApiKey, model, setModel, savedKey, onSave }: Props) {
  const { t } = useTranslation();
  const { activeProvider, setActiveProvider, getTranscriptionModelForProvider, setTranscriptionModelForProvider } = useAi();

  const transcriptionModel = getTranscriptionModelForProvider("OpenRouter");

  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Track specific whisper model selection
  const [activeWhisperModel, setActiveWhisperModel] = useState<string>(() => localStorage.getItem("whisper_model") || "tiny");
  const [showWhisperConfig, setShowWhisperConfig] = useState(transcriptionModel === "whisper_cpp");

  useEffect(() => {
    if (transcriptionModel === "whisper_cpp") {
      setShowWhisperConfig(false);
    }
  }, [transcriptionModel]);

  const isMacOrWin = /Mac|Win/.test(navigator.platform);
  const transcriptionModels = [
    { id: "whisper_cpp", label: "Whisper Local (cpp)", description: "Offline, private transcription running on your device" },
    ...(isMacOrWin ? [{ id: "web_speech_api", label: "Web Speech API", description: "Browser built-in speech recognition (Fast, Free)" }] : [])
  ];

  const handleSetWhisperModel = (name: string) => {
    localStorage.setItem("whisper_model", name);
    setActiveWhisperModel(name);
  };

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
    } else {
      // Se já temos um modelo salvo, mas ele não está na lista padrão,
      // tentamos buscar os modelos para exibir as informações corretas.
      const isDefault = defaultFreeModels.some(m => m.id === model);
      if (!isDefault && availableModels.length === 0) {
        fetchOpenRouterModels();
      }
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
        throw new Error(t("openrouter.errors.fetchFailed"));
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
      console.error("Error fetching models:", error);
      setModelsError(t("openrouter.errors.loadFailed"));
      setAvailableModels(defaultFreeModels);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const displayedModels = availableModels.length > 0 ? availableModels : defaultFreeModels;

  // Encontrar info do modelo. Se não estiver na lista, cria um placeholder
  let selectedModelInfo = displayedModels.find(m => m.id === model);
  if (!selectedModelInfo && model) {
    selectedModelInfo = {
      id: model,
      name: model,
      pricing: { prompt: "?", completion: "?" },
      context_length: 0,
      description: t("openrouter.savedModelPlaceholder")
    };
  }

  const isFreeModel = selectedModelInfo &&
    selectedModelInfo.pricing.prompt !== "?" &&
    parseFloat(selectedModelInfo.pricing.prompt) === 0 &&
    parseFloat(selectedModelInfo.pricing.completion) === 0;

  const handleSave = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="px-6 py-4 pb-8 bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-300">
      <div className="flex justify-between items-center bg-neutral-100 dark:bg-[#242425] px-4 py-3 rounded-xl">
        <div>
          <h2 className="text-neutral-900 dark:text-white text-base font-semibold">OpenRouter</h2>
          <p className="text-neutral-500 dark:text-gray-400 text-sm">{t("openrouter.subtitle")}</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenRouter" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e" />
              {t("openrouter.active")}
            </span>
          ) : (
            <button
              onClick={() => setActiveProvider("OpenRouter")}
              className="text-sm bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 transition"
            >
              {t("openrouter.useThisModel")}
            </button>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 my-6 relative bg-neutral-100 dark:bg-[#242425] py-2 px-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-900 dark:text-white">{t("openrouter.apiKey.label")}</span>

          <button className={`flex items-center gap-2 rounded-lg text-sm border py-1 px-2 ${currentStatus === "success"
              ? "border-green-500/50 dark:border-[#5BBF4B] bg-green-100 dark:bg-[#071C0B]"
              : "border-red-500/50 bg-red-100 dark:bg-red-500/10"
            }`}>
            <span className={`rounded-full p-0.5 ${currentStatus === "success"
                ? "bg-green-500 dark:bg-[#5BBF4B] text-white dark:text-[#071C0B]"
                : "bg-red-500 text-white"
              }`}>
              {currentStatus === "success" ? (
                <CheckIcon size={12} color={currentStatus === "success" ? "#FFFFFF" : "#071C0B"} />
              ) : (
                <CloseIcon size={12} color="#FFFFFF" />
              )}
            </span>
            <span className={`${currentStatus === "success" ? "text-green-700 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
              {currentStatus === "success" ? t("openrouter.apiKey.ready") : t("openrouter.apiKey.required")}
            </span>
          </button>

        </div>
        <input
          type="password"
          className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />

        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {t("openrouter.apiKey.description")}
        </p>
      </label>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{t("openrouter.transcription.title")}</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">{t("openrouter.transcription.description")}</p>

        <select
          value={transcriptionModel}
          onChange={(e) => {
            setTranscriptionModelForProvider("OpenRouter", e.target.value);
            if (e.target.value === "whisper_cpp") {
              setShowWhisperConfig(true);
            }
          }}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none "
        >
          {transcriptionModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {transcriptionModel === "whisper_cpp" && (
          <button
            onClick={() => setShowWhisperConfig(!showWhisperConfig)}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors group"
          >
            <div className={`p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-transform ${showWhisperConfig ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            {showWhisperConfig ? t("openrouter.whisper.hideConfig") : t("openrouter.whisper.manageModels")}
          </button>
        )}

        {transcriptionModel === "whisper_cpp" && showWhisperConfig && (
          <div className="mt-4 bg-neutral-50 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 dark:text-blue-400 border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{t("openrouter.whisper.localModelsCenter")}</h4>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{t("openrouter.whisper.status")}: <span className="text-blue-500 dark:text-blue-400">{activeWhisperModel} {t("openrouter.active")}</span></p>
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

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{t("openrouter.model.title")}</h3>
        <button
          onClick={fetchOpenRouterModels}
          disabled={isLoadingModels}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-2"
        >
          {isLoadingModels ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("openrouter.model.loading")}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {t("openrouter.model.loadModels")}
            </>
          )}
        </button>
      </div>

      {modelsError && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">{modelsError}</p>
        </div>
      )}

      <div className="mb-6">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none"
        >
          {model && !displayedModels.find(m => m.id === model) && (
            <option key={model} value={model}>
              {model} ({t("openrouter.model.saved")})
            </option>
          )}

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
            ? t("openrouter.model.availableCount", { count: availableModels.length })
            : t("openrouter.model.clickToLoad")
          }
        </p>
      </div>

      {selectedModelInfo && (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-neutral-900 dark:text-neutral-200">{selectedModelInfo.name}</h4>
            {isFreeModel && (
              <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                {t("openrouter.model.free")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">{t("openrouter.model.prompt")}:</span>
              <span className="ml-2 text-neutral-900 dark:text-neutral-300">
                {isFreeModel ? t("openrouter.model.freePrice") : `$${selectedModelInfo.pricing.prompt}`}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">{t("openrouter.model.completion")}:</span>
              <span className="ml-2 text-neutral-900 dark:text-neutral-300">
                {isFreeModel ? t("openrouter.model.freePrice") : `$${selectedModelInfo.pricing.completion}`}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500">{t("openrouter.model.context")}:</span>
              <span className="ml-2 text-neutral-900 dark:text-neutral-300">
                {selectedModelInfo.context_length.toLocaleString()} tokens
              </span>
            </div>
          </div>

          {selectedModelInfo.description && (
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-3">
              {selectedModelInfo.description}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 mb-8">
        <a
          href="https://openrouter.ai/models"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline"
        >
          {t("openrouter.viewModelDetails")}
        </a>

        <button
          onClick={handleSave}
          className={`px-6 py-2 font-semibold rounded-lg transition ${isSaved
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
            }`}
        >
          {isSaved ? t("openrouter.changesSaved") : t("openrouter.saveChanges")}
        </button>

      </div>
    </div>
  );
}
