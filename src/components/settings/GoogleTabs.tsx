import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";

export default function GoogleTab() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { userId } = useAuth();

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
      setApiKey(""); // Clear input after save
    } catch (error) {
      console.error("Failed to save API key:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-4 text-neutral-300 overflow-y-auto h-full">

      <h2 className="text-xl font-semibold mb-2">Google</h2>
      <p className="text-neutral-400 mb-4">Modelos Gemini</p>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-3 h-3 rounded-full ${status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-neutral-500"}`}></span>
        <span className={`${status === "success" ? "text-green-500" : status === "error" ? "text-red-500" : "text-neutral-500"}`}>
          {status === "success" ? "Salvo" : status === "error" ? "Erro" : "Aguardando configuração"}
        </span>
      </div>

      {/* API Key */}
      <label className="flex flex-col gap-1 mb-6">
        <span className="text-sm text-neutral-400">Chave de API</span>
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

      <div className="flex gap-3">
        <button className="bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-700">
          ⚡
        </button>

        <button className="bg-blue-600 px-4 py-3 rounded-xl border border-blue-600">
          ⭕
        </button>

        <button className="bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-700">
          ✨
        </button>

        <button className="bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-700">
          ⚙️
        </button>
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