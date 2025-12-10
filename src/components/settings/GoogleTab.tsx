import CheckIcon from "../ui/icons/CheckIcon";
import { useAi } from "../../contexts/AiContext";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string; // Re-introduced
  savedModel?: string; // Re-introduced
}

export default function GoogleTab({ apiKey, setApiKey, model, setModel, savedKey, savedModel }: Props) {
  const { activeProvider, setActiveProvider } = useAi();

  const models = [
    { id: "flash", icon: "⚡", label: "Flash" },
    { id: "pro", icon: "⭕", label: "Pro" },
    { id: "ultra", icon: "✨", label: "Ultra" },
    { id: "nano", icon: "⚙️", label: "Nano" },
  ];

  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle"; // Simplified status based on saved key

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">Google</h2>
          <p className="text-neutral-400 mb-4">Modelos Gemini</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "Google" ? (
             <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
               <CheckIcon size={16} color="#22c55e"/>
               Ativo
             </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("Google")}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-neutral-700 transition"
            >
              Usar este modelo
            </button>
          )}
        </div>
      </div>
     
      <button className="flex items-center gap-2 my-6 rounded-lg border border-[#5BBF4B] bg-[#071C0B] py-2 px-4">
        <span className="rounded-full bg-[#5BBF4B] text-[#071C0B]">
          <CheckIcon size={18} color="#071C0B"/>
        </span>
        <span className={`${currentStatus === "success" ? "text-green-500" : "text-neutral-500"}`}>
          {currentStatus === "success" ? "Pronto" : "Aguardando configuração"}
        </span>
      </button>

      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
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

      <p className="text-neutral-400 text-sm mb-6">
        Escolha o equilibrio preferido entre velocidade e qualidade. Selecionaremos os melhores modelos para você.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
              ${model === m.id 
                ? "bg-blue-600/10 border-blue-500/50" 
                : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"}
            `}
          >
            <span className="text-xl">{m.icon}</span>
            <span className={`font-medium ${model === m.id ? "text-blue-400" : "text-neutral-400"}`}>
              {m.label}
            </span>
            
            {model === m.id && (
              <span className="absolute top-2 right-2 text-[10px] font-bold bg-green-500 text-black px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
