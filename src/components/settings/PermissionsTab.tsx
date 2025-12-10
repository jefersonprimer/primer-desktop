import React from "react";

export default function PermissionsTab() {
  return (
    <div className="w-full bg-zinc-900 text-white p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700">

        <h2 className="text-2xl font-semibold mb-6">Configurações</h2>

        <div className="space-y-8">

          {/* Acesso ao Microfone */}
          <div className="flex items-start justify-between border-b border-zinc-700 pb-4">
            <div>
              <h3 className="text-lg font-semibold">Acesso ao Microfone</h3>
              <p className="text-sm text-zinc-300">
                Necessário para recursos de gravação de voz.
              </p>
            </div>

            <span className="text-green-400 text-xl">✔</span>
          </div>

          {/* Captura de Tela */}
          <div className="flex items-start justify-between border-b border-zinc-700 pb-4">
            <div>
              <h3 className="text-lg font-semibold">Captura de Tela</h3>
              <p className="text-sm text-zinc-300">
                Necessário para tirar capturas de tela.
              </p>
            </div>

            <span className="text-green-400 text-xl">✔</span>
          </div>

          <p className="text-sm text-zinc-300 mt-2">
            O aplicativo é executado em modo Furtivo (oculto da barra de tarefas).
            Use <strong>Ctrl+⇧B</strong> para mostrar/ocultar.
          </p>
        </div>
      </div>
    </div>
  );
}

