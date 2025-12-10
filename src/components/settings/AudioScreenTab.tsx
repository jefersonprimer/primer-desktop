import React, { useState } from "react";

export default function AudioScreenTab() {
  const [tab, setTab] = useState<"input" | "output">("input");
  const [microphone, setMicrophone] = useState("Microfone Padrão");

  return (
    <div className="w-full bg-zinc-900 text-white p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700">

        <h2 className="text-2xl font-semibold mb-6">Configurações</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("input")}
            className={`px-4 py-2 rounded-xl border ${
              tab === "input"
                ? "border-zinc-500 bg-zinc-700"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            🎤 Seu Áudio
          </button>

          <button
            onClick={() => setTab("output")}
            className={`px-4 py-2 rounded-xl border ${
              tab === "output"
                ? "border-zinc-500 bg-zinc-700"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            🔊 Áudio Recebido
          </button>
        </div>

        {/* Conteúdo tab */}
        {tab === "input" && (
          <div className="space-y-6">

            <h3 className="text-lg font-semibold">Seu Microfone</h3>

            {/* Dropdown */}
            <div className="relative">
              <button className="w-full flex justify-between items-center px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-xl text-left">
                <span className="flex items-center gap-2">
                  🎤 {microphone}
                </span>
              </button>

              {/* Exemplo de Menu (opcional) */}
              {/* 
              <div className="absolute left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl p-2">
                <button onClick={() => setMicrophone("Microfone Padrão")} className="block w-full px-3 py-2 text-left hover:bg-zinc-700 rounded-lg">
                  Microfone Padrão
                </button>
              </div>
              */}
            </div>

            {/* Barra verde */}
            <div className="w-full h-1.5 bg-green-500 rounded-full"></div>

            {/* Rodapé */}
            <div className="flex justify-between text-sm">
              <p className="text-zinc-300">
                Selecione seu microfone para capturar o que você diz durante reuniões
              </p>

              <p className="text-green-400">
                2 dispositivos disponíveis
              </p>
            </div>
          </div>
        )}

        {tab === "output" && (
          <div className="text-zinc-300">
            <p>Configurações de saída de áudio aqui…</p>
          </div>
        )}
      </div>
    </div>
  );
}

