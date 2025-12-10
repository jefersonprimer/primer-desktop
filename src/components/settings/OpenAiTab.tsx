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

export default function OpenAiTab({ apiKey, setApiKey, model, setModel, savedKey, savedModel }: Props) {
  const { activeProvider, setActiveProvider } = useAi();

  const models = [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "o1", label: "o1" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    // Full list from user request
    { id: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
    { id: "gpt-5.1-codex-max", label: "gpt-5.1-codex-max" },
    { id: "gpt-5.1-2025-11-13", label: "gpt-5.1-2025-11-13" },
    { id: "gpt-5.1", label: "gpt-5.1" },
    { id: "gpt-5.1-codex", label: "gpt-5.1-codex" },
    { id: "gpt-5.1-codex-mini", label: "gpt-5.1-codex-mini" },
    { id: "davinci-002", label: "davinci-002" },
    { id: "babbage-002", label: "babbage-002" },
    { id: "gpt-3.5-turbo-instruct", label: "gpt-3.5-turbo-instruct" },
    { id: "gpt-3.5-turbo-instruct-0914", label: "gpt-3.5-turbo-instruct-0914" },
    { id: "dall-e-3", label: "dall-e-3" },
    { id: "dall-e-2", label: "dall-e-2" },
    { id: "gpt-3.5-turbo-1106", label: "gpt-3.5-turbo-1106" },
    { id: "tts-1-hd", label: "tts-1-hd" },
    { id: "tts-1-1106", label: "tts-1-1106" },
    { id: "tts-1-hd-1106", label: "tts-1-hd-1106" },
    { id: "text-embedding-3-small", label: "text-embedding-3-small" },
    { id: "text-embedding-3-large", label: "text-embedding-3-large" },
    { id: "gpt-3.5-turbo-0125", label: "gpt-3.5-turbo-0125" },
    { id: "gpt-4o", label: "gpt-4o" },
    { id: "gpt-4o-2024-05-13", label: "gpt-4o-2024-05-13" },
    { id: "gpt-4o-mini-2024-07-18", label: "gpt-4o-mini-2024-07-18" },
    { id: "gpt-4o-mini", label: "gpt-4o-mini" },
    { id: "gpt-4o-2024-08-06", label: "gpt-4o-2024-08-06" },
    { id: "gpt-4o-audio-preview", label: "gpt-4o-audio-preview" },
    { id: "omni-moderation-latest", label: "omni-moderation-latest" },
    { id: "omni-moderation-2024-09-26", label: "omni-moderation-2024-09-26" },
    { id: "gpt-4o-audio-preview-2024-12-17", label: "gpt-4o-audio-preview-2024-12-17" },
    { id: "gpt-4o-mini-audio-preview-2024-12-17", label: "gpt-4o-mini-audio-preview-2024-12-17" },
    { id: "o1-2024-12-17", label: "o1-2024-12-17" },
    { id: "o1", label: "o1" },
    { id: "gpt-4o-mini-audio-preview", label: "gpt-4o-mini-audio-preview" },
    { id: "o3-mini", label: "o3-mini" },
    { id: "o3-mini-2025-01-31", label: "o3-mini-2025-01-31" },
    { id: "gpt-4o-2024-11-20", label: "gpt-4o-2024-11-20" },
    { id: "gpt-4o-search-preview-2025-03-11", label: "gpt-4o-search-preview-2025-03-11" },
    { id: "gpt-4o-search-preview", label: "gpt-4o-search-preview" },
    { id: "gpt-4o-mini-search-preview-2025-03-11", label: "gpt-4o-mini-search-preview-2025-03-11" },
    { id: "gpt-4o-mini-search-preview", label: "gpt-4o-mini-search-preview" },
    { id: "gpt-4o-transcribe", label: "gpt-4o-transcribe" },
    { id: "gpt-4o-mini-transcribe", label: "gpt-4o-mini-transcribe" },
    { id: "gpt-4o-mini-tts", label: "gpt-4o-mini-tts" },
    { id: "o3-2025-04-16", label: "o3-2025-04-16" },
    { id: "o4-mini-2025-04-16", label: "o4-mini-2025-04-16" },
    { id: "o3", label: "o3" },
    { id: "o4-mini", label: "o4-mini" },
    { id: "gpt-4.1-2025-04-14", label: "gpt-4.1-2025-04-14" },
    { id: "gpt-4.1", label: "gpt-4.1" },
    { id: "gpt-4.1-mini-2025-04-14", label: "gpt-4.1-mini-2025-04-14" },
    { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
    { id: "gpt-4.1-nano-2025-04-14", label: "gpt-4.1-nano-2025-04-14" },
    { id: "gpt-4.1-nano", label: "gpt-4.1-nano" },
    { id: "gpt-image-1", label: "gpt-image-1" },
    { id: "gpt-4o-audio-preview-2025-06-03", label: "gpt-4o-audio-preview-2025-06-03" },
    { id: "gpt-4o-transcribe-diarize", label: "gpt-4o-transcribe-diarize" },
    { id: "gpt-5-chat-latest", label: "gpt-5-chat-latest" },
    { id: "gpt-5-2025-08-07", label: "gpt-5-2025-08-07" },
    { id: "gpt-5", label: "gpt-5" },
    { id: "gpt-5-mini-2025-08-07", label: "gpt-5-mini-2025-08-07" },
    { id: "gpt-5-mini", label: "gpt-5-mini" },
    { id: "gpt-5-nano-2025-08-07", label: "gpt-5-nano-2025-08-07" },
    { id: "gpt-5-nano", label: "gpt-5-nano" },
    { id: "gpt-audio-2025-08-28", label: "gpt-audio-2025-08-28" },
    { id: "gpt-audio", label: "gpt-audio" },
    { id: "gpt-5-codex", label: "gpt-5-codex" },
    { id: "gpt-image-1-mini", label: "gpt-image-1-mini" },
    { id: "gpt-5-pro-2025-10-06", label: "gpt-5-pro-2025-10-06" },
    { id: "gpt-5-pro", label: "gpt-5-pro" },
    { id: "gpt-audio-mini", label: "gpt-audio-mini" },
    { id: "gpt-audio-mini-2025-10-06", label: "gpt-audio-mini-2025-10-06" },
    { id: "gpt-5-search-api", label: "gpt-5-search-api" },
    { id: "sora-2", label: "sora-2" },
    { id: "sora-2-pro", label: "sora-2-pro" },
    { id: "gpt-5-search-api-2025-10-14", label: "gpt-5-search-api-2025-10-14" },
    { id: "gpt-5.1-chat-latest", label: "gpt-5.1-chat-latest" },
    { id: "whisper-1", label: "whisper-1" },
    { id: "tts-1", label: "tts-1" },
    { id: "gpt-3.5-turbo-16k", label: "gpt-3.5-turbo-16k" },
    { id: "text-embedding-ada-002", label: "text-embedding-ada-002" }
  ];

  // Deduping the list (since I added some manual ones at top that might be in the list)
  const uniqueModels = Array.from(new Map(models.map(m => [m.id, m])).values());
  const currentStatus = savedKey && savedKey === apiKey ? "success" : "idle";

  return (
    <div className="px-6 py-4 pb-8 bg-black text-neutral-300">
      <div className="flex justify-between items-center border-t border-b border-neutral-700">
        <div>
          <h2 className="text-xl font-semibold my-2">OpenAI</h2>
          <p className="text-neutral-400 mb-4">GPT-4o e outros modelos da OpenAI</p>
        </div>
        <div className="flex items-center">
          {activeProvider === "OpenAI" ? (
             <span className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
               <CheckIcon size={16} color="#22c55e"/>
               Ativo
             </span>
          ) : (
            <button 
              onClick={() => setActiveProvider("OpenAI")}
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
          {currentStatus === "success" ? "Pronto" : "Chave necessária"}
        </span>
      </button>

      <label className="flex flex-col gap-1 mb-6 relative">
        <div className="flex justify-between items-center">
          <span className="text-sm text-neutral-400">Chave de API</span>
        </div>
        <input
          type="password"
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-blue-500"
          placeholder="sk-..."
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
