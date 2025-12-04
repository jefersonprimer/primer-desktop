import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";
import { Check } from "lucide-react";

interface Props {
  savedKey?: string;
}

export default function GoogleTab({ savedKey }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedModel, setSelectedModel] = useState("flash"); // Default model
  const { userId } = useAuth();

  useEffect(() => {
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [savedKey]);

  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);
    setStatus("idle");

    try {
      await invoke("add_api_key", {
        dto: {
          user_id: userId,
          provider: "gemini",
          api_key: apiKey,
        },
      });
      setStatus("success");
      // Don't clear input, keep it filled as requested
    } catch (error) {
      console.error("Failed to save API key:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const models = [
    { id: "flash", icon: "⚡", label: "Flash" },
    { id: "pro", icon: "⭕", label: "Pro" },
    { id: "ultra", icon: "✨", label: "Ultra" },
    { id: "nano", icon: "⚙️", label: "Nano" },
  ];

  return (
    <div className="px-6 py-4 text-neutral-300 overflow-y-auto h-full">

      <h2 className="text-xl font-semibold mb-2">Google</h2>
      <p className="text-neutral-400 mb-4">Modelos Gemini</p>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-3 h-3 rounded-full ${savedKey || status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-neutral-500"}`}></span>
        <span className={`${savedKey || status === "success" ? "text-green-500" : status === "error" ? "text-red-500" : "text-neutral-500"}`}>
          {savedKey || status === "success" ? "Salvo" : status === "error" ? "Erro" : "Aguardando configuração"}
        </span>
      </div>

      {/* API Key */}
      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
          {(savedKey || status === "success") && (
            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check size={10} strokeWidth={3} />
              READY
            </span>
          )}
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

      <div className="grid grid-cols-2 gap-3">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
              ${selectedModel === model.id 
                ? "bg-blue-600/10 border-blue-500/50" 
                : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"}
            `}
          >
            <span className="text-xl">{model.icon}</span>
            <span className={`font-medium ${selectedModel === model.id ? "text-blue-400" : "text-neutral-400"}`}>
              {model.label}
            </span>
            
            {selectedModel === model.id && (
              <span className="absolute top-2 right-2 text-[10px] font-bold bg-green-500 text-black px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Botão salvar */}
      <div className="mt-6">
        <button 
          onClick={handleSave}
          disabled={loading || !apiKey}
          className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}