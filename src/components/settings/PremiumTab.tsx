import CircleStarIcon from "../ui/icons/CircleStarIcon";
import LockKeyHoleIcon from "../ui/icons/LockKeyHoleIcon";

export default function PremiumTab() {
  return (
    <div className="w-full bg-[#1D1D1F] h-full p-6 pb-8 text-white">
      <div className="flex items-center mb-6 gap-2">
        <CircleStarIcon size={24} color="#FAC936"/>
        <h2 className="text-2xl font-semibold">Assinatura</h2>
      </div>

      <div className="bg-[#141414] border border-neutral-700 rounded-2xl w-full max-w-3xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F9F9F9] text-xl font-semibold">
              Plano Grátis
            </div>
            <div className="px-3 py-1 text-sm bg-[#27292D] rounded-lg border border-white/10 text-gray-300 flex items-center gap-1">
              Grátis
            </div>
          </div>

          <p className="text-gray-300 text-sm max-w-lg">
            Assine para desbloquear todos os recursos premium.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-gray-300 text-sm">
            <div className="flex items-center gap-2">
              <LockKeyHoleIcon size={18} />
              Uso ilimitado
            </div>
            <div className="flex items-center gap-2">
              <LockKeyHoleIcon size={18} />
              Assistentes personalizados
            </div>
            <div className="flex items-center gap-2">
              <LockKeyHoleIcon size={18} />
              Histórico de sessões
            </div>
            <div className="flex items-center gap-2">
              <LockKeyHoleIcon size={18} />
              Modo furtivo
            </div>
          </div>

          {/* button */}
          <button className="w-full bg-[#262626] hover:bg-[#262626]/40 border border-neutral-700 rounded-xl py-5 text-base">
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}

