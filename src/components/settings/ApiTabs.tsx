import { useState } from "react";
import { Check } from "lucide-react";

const tabs = ["OpenAI", "Google", "OpenRouter", "Custom API"];

interface Props {
  configuredProviders?: string[];
}

export default function ApiTabs({ configuredProviders = [] }: Props) {
  const [active, setActive] = useState("Google");

  const isConfigured = (tab: string) => {
    const providerMap: Record<string, string> = {
      "Google": "gemini",
      "OpenAI": "openai",
      "OpenRouter": "openrouter",
      "Custom API": "custom"
    };
    return configuredProviders.includes(providerMap[tab] || tab.toLowerCase());
  };

  return (
    <div className="flex gap-2 border-b border-neutral-700 px-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`px-4 py-2 rounded-t-lg transition flex items-center gap-2 ${
            active === tab
              ? "bg-neutral-800 text-blue-400 border-b-2 border-blue-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {tab}
          {isConfigured(tab) && (
            <span className="text-green-500 bg-green-500/10 p-0.5 rounded-full">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

