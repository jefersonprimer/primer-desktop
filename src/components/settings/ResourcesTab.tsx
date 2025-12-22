import { useState } from "react";

export default function ResourcesTab() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectToPrompt, setSelectToPrompt] = useState(false);

  return (
    <div className="px-6 py-4 pb-8 bg-[#1D1D1F] text-neutral-300 h-full overflow-y-auto">
      {/* Rolagem Automática */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">Rolagem Automática</h3>
          <p className="text-sm uppercase bg-zinc-800 text-neutral-400 border border-neutral-700 py-1 px-4 rounded-2xl">
            comportamento
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-200">
              Rolar automaticamente para a resposta mais recente na conversa
            </span>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                autoScroll ? 'bg-gray-400' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`${
                  autoScroll ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Quando ativado, a conversa rolará automaticamente para a resposta da IA mais recente. A rolagem automática pausa temporariamente quando você rola para cima para ler o histórico e retoma quando você retorna ao final.
          </p>
        </div>
      </div>

      {/* Selecionar para Prompt */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">Selecionar para Prompt</h3>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-200 flex items-center gap-2">
              Analisar texto da área de transferência com Ctrl+Shift+C
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </span>
            <button
              onClick={() => setSelectToPrompt(!selectToPrompt)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                selectToPrompt ? 'bg-gray-400' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`${
                  selectToPrompt ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Quando ativado, selecionar texto e pressionar Command+C analisará automaticamente o conteúdo e fornecerá insights.
          </p>
        </div>
      </div>
    </div>
  );
}
