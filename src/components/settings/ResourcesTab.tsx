import React from "react";

export default function ResourcesTab() {
  return (
    <div className="w-full bg-zinc-900 text-white p-6 pb-8 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700">
        <h2 className="text-2xl font-semibold mb-6">Configurações</h2>

        <div className="space-y-10">
          {/* Rolagem Automática */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Rolagem Automática</h3>

            <div className="bg-zinc-700/40 border border-zinc-600 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span>Rolar automaticamente para a resposta mais recente na conversa</span>
                <button className="w-12 h-6 rounded-full bg-green-500 relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              <p className="text-sm text-zinc-300">
                Quando ativado, a conversa rolará automaticamente para a resposta da IA mais recente. A rolagem automática pausa temporariamente quando você rola para cima para ler o histórico e retoma quando você retorna ao final.
              </p>
            </div>
          </section>

          {/* Selecionar para Prompt */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Selecionar para Prompt</h3>

            <div className="bg-zinc-700/40 border border-zinc-600 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  Analisar texto da área de transferência com Ctrl+Shift+C
                  <span className="text-yellow-400 text-lg">🔒</span>
                </span>

                <button className="w-12 h-6 rounded-full bg-zinc-600 relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              <p className="text-sm text-zinc-300">
                Quando ativado, selecionar texto e pressionar Command+C analisará automaticamente o conteúdo e fornecerá insights.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

