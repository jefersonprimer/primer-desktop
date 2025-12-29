import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { useAi } from "../../contexts/AiContext";

import CheckIcon from "../ui/icons/CheckIcon";
import CloseIcon from "../ui/icons/CloseIcon";

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
  onSave, }: Props) {
  const { t } = useTranslation();
  const { activeProvider, setActiveProvider, getTranscriptionModelForProvider, setTranscriptionModelForProvider } = useAi();

  const transcriptionModel = getTranscriptionModelForProvider("Custom");

  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingOllama, setLoadingOllama] = useState(false);
  const [errorOllama, setErrorOllama] = useState("");
  const [activeWhisperModel, setActiveWhisperModel] = useState<string>(() => localStorage.getItem("whisper_model") || "tiny");
  const [showWhisperConfig, setShowWhisperConfig] = useState(transcriptionModel === "whisper_cpp");
  const [isSaved, setIsSaved] = useState(false);

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

  const handleSave = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="px-6 py-4 pb-8 bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-300">
      <div className="flex justify-between items-center bg-neutral-100 dark:bg-[#242425] px-4 py-3 rounded-xl">
        <div>
          <h2 className="text-neutral-900 dark:text-white text-base font-semibold">{t("custom.title")}</h2>
          <p className="text-neutral-500 dark:text-gray-400 text-sm">{t("custom.subtitle")}</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "Custom" ? (
            <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
              <CheckIcon size={16} color="#22c55e" />
              {t("custom.active")}
            </span>
          ) : (
            <button
              onClick={() => setActiveProvider("Custom")}
              className="text-sm bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 transition"
            >
              {t("custom.useThisModel")}
            </button>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 my-6 bg-neutral-100 dark:bg-[#242425] py-2 px-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Ollama URL</span>
          <button className={`flex items-center gap-2 text-sm rounded-lg border py-1 px-2 ${currentStatus === "success"
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
              {currentStatus === "success" ? t("custom.ollama.ready") : t("custom.ollama.waitingForSave")}
            </span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="http://localhost:11434"
          />
          <button
            onClick={fetchOllamaModels}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition"
          >
            {t("custom.ollama.refresh")}
          </button>
        </div>

        {errorOllama && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {t("custom.ollama.connectionError")} ({errorOllama})
          </div>
        )}
      </label>

      <label className="flex flex-col gap-1 my-6 bg-neutral-100 dark:bg-[#242425] py-2 px-4 rounded-lg">
        <span className="text-sm text-neutral-900 dark:text-white">{t("custom.model.selected")}</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none "
          disabled={loadingOllama || ollamaModels.length === 0}
        >
          {ollamaModels.length === 0 ? (
            <option value="">{loadingOllama ? t("custom.model.loading") : t("custom.model.noModels")}</option>
          ) : (
            ollamaModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.details.parameter_size}, {formatSize(m.size)})
              </option>
            ))
          )}
        </select>

        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {t("custom.model.description")}
        </p>
      </label>

      <div className="bg-neutral-100 dark:bg-[#242425] py-2 px-4 rounded-lg">
        <h3 className="text-base text-neutral-900 dark:text-white font-semibold">{t("custom.speech.title")}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          {t("custom.speech.description")}
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
            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none "
          >
            {sttStrategies.map((m) => (
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
              {showWhisperConfig ? t("custom.whisper.hideConfig") : t("custom.whisper.manageModels")}
            </button>
          )}
        </div>

        {transcriptionModel === "whisper_cpp" && showWhisperConfig && (
          <div className="mt-4 bg-neutral-50 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 dark:text-blue-400 border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{t("custom.whisper.localModelsCenter")}</h4>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{t("custom.whisper.status")}: <span className="text-blue-500 dark:text-blue-400">{activeWhisperModel} {t("custom.active")}</span></p>
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

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={handleSave}
          className={`px-6 py-2 font-semibold rounded-lg transition ${isSaved
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
            }`}
        >
          {isSaved ? t("custom.changesSaved") : t("custom.saveChanges")}
        </button>
      </div>

    </div>
  );
}
