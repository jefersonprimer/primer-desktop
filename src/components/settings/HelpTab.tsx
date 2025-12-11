
export default function HelpTab() {
  return (
    <div className="w-full bg-black p-6 text-white flex flex-col gap-6 pb-8">
      <h2 className="text-2xl font-semibold mb-6">Ajuda</h2>
      <div className="w-full gap-6">
        <div className="col-span-9 bg-black/30 rounded-2xl p-6 border border-white/10 space-y-8">
            <h3 className="text-xl font-semibold mb-4">Comunidade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-white text-white rounded-2xl">
                <div className="p-4 space-y-4">
                  <p className="text-lg font-medium flex items-center gap-2">💬 Discord</p>
                  <p className="text-sm text-gray-300">Junte-se à nossa comunidade no Discord para obter ajuda, compartilhar feedback e conectar-se.</p>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Entrar no Discord</button>
                </div>
              </div>

              <div className="bg-black/40 border border-white text-white rounded-2xl">
                <div className="p-4 space-y-4">
                  <p className="text-lg font-medium flex items-center gap-2">🔧 Suporte</p>
                  <p className="text-sm text-gray-300">Precisa de ajuda com algo específico? Confira nossa documentação.</p>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors">Obter Ajuda</button>
                </div>
              </div>
            </div>

          {/* Primeiros Passos */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Primeiros Passos</h3>
            <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg w-full sm:w-auto transition-colors">
              Reiniciar Integração
            </button>
          </div>

          {/* Logs de Depuração */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Logs de Depuração</h3>
            <p className="text-sm text-gray-300 mb-2 font-mono bg-black/50 p-2 rounded border border-white/5 overflow-x-auto">
              /home/primer/.config/primer/logs/main.log
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Abrir Pasta de Logs
              </button>

              <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Copiar Logs para Área de Transferência
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
