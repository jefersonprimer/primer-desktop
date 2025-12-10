import CheckIcon from "../ui/icons/CheckIcon";
import CircleAlertIcon from "../ui/icons/CircleAlertIcon";
import { useAi } from "../../contexts/AiContext";

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedKey?: string; // Re-introduced
  savedModel?: string; // Re-introduced
}

export default function OpenRouterTab({ apiKey, setApiKey, model, setModel, savedKey, savedModel }: Props) {
  const { activeProvider, setActiveProvider } = useAi();

  const models = [
    // A small, representative list of OpenRouter models. This can be expanded later.
    { id: "mistralai/mistral-7b-instruct", label: "Mistral 7B Instruct" },
    { id: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo (OpenRouter)" },
    { id: "openai/gpt-4-turbo", label: "GPT-4 Turbo (OpenRouter)" },
    { id: "google/gemini-pro", label: "Gemini Pro (OpenRouter)" },
    { id: "perplexity/pplx-7b-chat", label: "Perplexity PPLX 7B Chat" },
    { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku (OpenRouter)" },
    { id: "openrouter/cinematika-7b", label: "Cinematika 7B" },
    { id: "nousresearch/nous-hermes-2-mixtral-8x7b-sft", label: "Nous Hermes 2 Mixtral 8x7B SFT" },
  ];

  // Deduping the list (since I added some manual ones at top that might be in the list)
  const uniqueModels = Array.from(new Map(models.map(m => [m.id, m])).values());
  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">OpenRouter</h2>
          <p className="text-neutral-400 mb-4">Acesse múltiplos modelos via OpenRouter.ai</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenRouter" ? (
             <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
               <CheckIcon size={16} color="#22c55e"/>
               Ativo
             </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("OpenRouter")}
              className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg border border-neutral-700 transition"
            >
              Usar este modelo
            </button>
          )}
        </div>
      </div>

      <button 
        className={`flex items-center gap-2 my-6 rounded-lg  py-2 px-4 
        ${currentStatus === "success" ? "border border-[#5BBF4B] bg-[#071C0B]" : "border border-[#F34326] bg-[#260506]"}`}>
        <span className="rounded-full">
          {currentStatus === "success" ? <CheckIcon size={18} color="#5BBF4B"/> : <CircleAlertIcon size={18} color="#F34326"/>}
        </span>
        <span className={`${currentStatus === "success" ? "text-green-500" : "text-[#F34326]"}`}>
          {currentStatus === "success" ? "Pronto" : "Chave necessária"}
        </span>
      </button>

      {/* API Key */}
      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
          {currentStatus === "success" ? (
            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckIcon size={12} color="#4ade80"/>
              READY
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-[#F34326]/20 text-[#F34326] px-2 py-0.5 rounded-full flex items-center gap-1">
              <CircleAlertIcon size={12} color="#F34326"/>
              NECESSARY
            </span>
          )}
        </div>
        <input
          type="password"
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500"
          placeholder="sk-or-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>
      {/* Desempenho / Modelos */}
      <h3 className="text-lg font-semibold mb-3">Modelo</h3>

      <div className="mb-6">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500 appearance-none"
        >
          {uniqueModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-neutral-500 text-xs mt-2">
          Selecione o modelo que deseja utilizar para as interações.
        </p>
      </div>
    </div>
  );
}
