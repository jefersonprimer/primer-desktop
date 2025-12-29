import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAi } from "../../../contexts/AiContext";

import CheckIcon from "@/components/ui/icons/CheckIcon";
import ZapIcon from "@/components/ui/icons/ZapIcon";
import BoxIcon from "@/components/ui/icons/BoxIcon";
import SparklesIcon from "@/components/ui/icons/SparklesIcon";
import WrenchIcon from "@/components/ui/icons/WrenchIcon";
import CloseIcon from "@/components/ui/icons/CloseIcon";
import CircleAlertIcon from "@/components/ui/icons/CircleAlertIcon";

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
  const { t } = useTranslation();
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
    rapido: { model: "gpt-4o-mini", label: t("openai.performance.fast") },
    padrao: { model: "gpt-4o", label: t("openai.performance.standard") },
    qualidade: { model: "gpt-4.1", label: t("openai.performance.quality") },
    personalizado: { model: model, label: t("openai.performance.custom") }
  };

  const getInitialPerformanceMode = (currentModel: string): PerformanceMode => {
    if (currentModel === performanceModes.rapido.model) return "rapido";
    if (currentModel === performanceModes.padrao.model) return "padrao";
    if (currentModel === performanceModes.qualidade.model) return "qualidade";
    return "personalizado";
  };

  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => getInitialPerformanceMode(model));
  const [isSaved, setIsSaved] = useState(false);

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

  const handleSave = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="px-6 py-4 pb-8 bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400">
      <div className="flex justify-between items-center bg-neutral-100 dark:bg-[#242425] px-4 py-3 rounded-xl">
        <div>
          <h2 className="text-neutral-900 dark:text-white text-base font-semibold">OpenAI</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t("openai.subtitle")}</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenAI" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e" />
              {t("openai.active")}
            </span>
          ) : (
            <button
              onClick={() => setActiveProvider("OpenAI")}
              className="text-sm bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 transition"
            >
              {t("openai.useThisModel")}
            </button>
          )}
        </div>
      </div>


      <label className="flex flex-col gap-1 my-6 relative bg-neutral-100 dark:bg-[#242425] py-2 px-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-900 dark:text-white">{t("openai.apiKey.label")}</span>

          <button className={`flex items-center gap-2 rounded-lg text-sm border py-1 px-2 ${currentStatus === "success"
              ? "border-[#5BBF4B] bg-[#071C0B]"
              : "border-red-500/50 bg-red-500/10"
            }`}>
            <span className={`rounded-full p-0.5 ${currentStatus === "success"
                ? "bg-[#5BBF4B] text-[#071C0B]"
                : "bg-red-500 text-white"
              }`}>
              {currentStatus === "success" ? (
                <CheckIcon size={12} color="#071C0B" />
              ) : (
                <CloseIcon size={12} color="#FFFFFF" />
              )}
            </span>
            <span className={`${currentStatus === "success" ? "text-green-500" : "text-red-500"}`}>
              {currentStatus === "success" ? t("openai.apiKey.ready") : t("openai.apiKey.required")}
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
          {t("openai.apiKey.description")}
        </p>
      </label>

      <div className="mb-8">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{t("openai.transcription.title")}</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">{t("openai.transcription.description")}</p>

        <select
          value={transcriptionModel}
          onChange={(e) => {
            setTranscriptionModelForProvider("OpenAI", e.target.value);
            if (e.target.value === "whisper_cpp") {
              setShowWhisperConfig(true);
            }
          }}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-900 dark:text-neutral-400 focus:outline-none focus:border-blue-500 appearance-none "
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
            {showWhisperConfig ? t("openai.whisper.hideConfig") : t("openai.whisper.manageModels")}
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
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{t("openai.whisper.localModelsCenter")}</h4>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{t("openai.whisper.status")}: <span className="text-blue-500 dark:text-blue-400">{activeWhisperModel} {t("openai.active")}</span></p>
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

      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{t("openai.performance.title")}</h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
        {t("openai.performance.description")}
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => handlePerformanceChange("rapido")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition relative ${performanceMode === "rapido"
              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700"
              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-800"
            }`}
        >
          {performanceMode === "rapido" && (
            <div className="absolute top-2 right-2">
              <CheckIcon size={16} color="#818cf8" />
            </div>
          )}
          <ZapIcon size={32} /> 
          <span className="font-medium mb-1">{t("openai.performance.fast")}</span>
          <span className="font-medium text-xs">{t("openai.performance.fastDescription")}</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("padrao")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition relative ${performanceMode === "padrao"
              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700"
              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-800"
            }`}
        >
          {performanceMode === "padrao" && (
            <div className="absolute top-2 right-2">
              <CheckIcon size={16} color="#818cf8" />
            </div>
          )}
          <BoxIcon size={32}/>
          <span className="font-medium mb-1">{t("openai.performance.standard")}</span>
          <span className="font-medium text-xs">{t("openai.performance.standardDescription")}</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("qualidade")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition relative ${performanceMode === "qualidade"
              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700"
              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-800"
            }`}
        >
          {performanceMode === "qualidade" && (
            <div className="absolute top-2 right-2">
              <CheckIcon size={16} color="#818cf8" />
            </div>
          )}
          <SparklesIcon size={32}/>
          <span className="font-medium mb-1">{t("openai.performance.quality")}</span>
          <span className="font-medium text-xs">{t("openai.performance.qualityDescription")}</span>
        </button>

        <button
          onClick={() => handlePerformanceChange("personalizado")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition relative ${performanceMode === "personalizado"
              ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700"
              : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-800"
            }`}
        >
          {performanceMode === "personalizado" && (
            <div className="absolute top-2 right-2">
              <CheckIcon size={16} color="#818cf8" />
            </div>
          )}
          <WrenchIcon size={32}/>
          <span className="font-medium mb-1">{t("openai.performance.custom")}</span>
          <span className="text-xs">{t("openai.performance.customDescription")}</span>
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg p-3 mb-6 flex items-start gap-2">
        <CircleAlertIcon size={18} />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t("openai.performance.autoOptimize")}
        </p>
      </div>

      {performanceMode === "personalizado" && (
        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{t("openai.analysisModel.title")}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">{t("openai.analysisModel.description")}</p>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none "
            >
              {allModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{t("openai.imageModel.title")}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">{t("openai.imageModel.description")}</p>

            <select
              value={imageModel}
              onChange={(e) => setImageModel?.(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none "
            >
              {imageModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 mb-8">
        <a
          href="https://platform.openai.com/docs/models"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline"
        >
          {t("openai.viewModelDetails")}
        </a>

        <button
          onClick={handleSave}
          className={`px-6 py-2 font-semibold rounded-lg transition ${isSaved
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
            }`}
        >
          {isSaved ? t("openai.changesSaved") : t("openai.saveChanges")}
        </button>

      </div>
    </div>
  );
}
