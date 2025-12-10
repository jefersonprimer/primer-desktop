import CheckIcon from "../ui/icons/CheckIcon";
import { useAi, type ProviderType } from "../../contexts/AiContext";

const tabs: ProviderType[] = ["OpenAI", "Google", "OpenRouter", "Custom"];

interface Props {
  active: string;
  onTabChange: (tab: string) => void;
}

export default function ApiTabs({ active, onTabChange }: Props) {
  const { activeProvider } = useAi();

  return (
    <div className="flex gap-2 bg-black px-6 pt-6 pb-2">
      {tabs.map((tab) => (
        <div 
          key={tab}
          className={`relative group flex items-center rounded-lg transition cursor-pointer border
            ${activeProvider === tab ? "bg-[#07071B]" : "hover:bg-neutral-800"}
            ${active === tab ? "border-[#2C3381]" : "border-neutral-700"}
          `}
        >
          {/* Tab Button */}
          <button
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 flex items-center gap-2 ${
              active === tab
                ? "text-white"
                : "text-neutral-400 group-hover:text-white"
            }`}
          >
            {tab === "Custom" ? "Custom API" : tab}
            {activeProvider === tab && (
              <span className="text-green-500 bg-green-500/10 p-0.5 rounded-full text-[10px]">
                <CheckIcon size={16} color="#22c55e"/>
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

