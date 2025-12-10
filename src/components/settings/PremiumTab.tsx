export default function PremiumTab() {
  return (
    <div className="w-full p-6 pb-8 text-white">
      <h2 className="text-2xl font-semibold mb-8">Assinatura</h2>

      <div className="bg-black/30 border border-white/10 rounded-2xl w-full max-w-3xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 text-xl font-semibold">
              Plano Grátis
            </div>
            <div className="px-3 py-1 text-sm bg-gray-700 rounded-lg border border-white/10 text-gray-300 flex items-center gap-1">
              Grátis
            </div>
          </div>

          <p className="text-gray-300 text-sm max-w-lg">
            Assine para desbloquear todos os recursos premium.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-gray-300 text-sm">
            <div className="flex items-center gap-2">
               Uso ilimitado
            </div>
            <div className="flex items-center gap-2">
               Assistentes personalizados
            </div>
            <div className="flex items-center gap-2">
               Histórico de sessões
            </div>
            <div className="flex items-center gap-2">
               Modo furtivo
            </div>
          </div>

          {/* button */}
          <button className="w-full bg-gray-700 hover:bg-gray-600 border border-white/10 rounded-xl py-5 text-base">
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}

