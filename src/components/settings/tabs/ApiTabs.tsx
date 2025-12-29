import { useAi, type ProviderType } from "../../../contexts/AiContext";
import CheckIcon from "@/components/ui/icons/CheckIcon";

const tabs: ProviderType[] = ["OpenAI", "Google", "OpenRouter", "Custom"];

interface Props {
  active: string;
  onTabChange: (tab: string) => void;
}

export default function ApiTabs({ active, onTabChange }: Props) {
  const { activeProvider } = useAi();

  return (
    <div className="flex gap-2 bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8">
      {tabs.map((tab) => (
        <div 
          key={tab}
          className={`relative group flex items-center rounded-lg transition  border
            ${active === tab 
              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700" 
              : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400"}
          `}
        >
          <button
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 flex items-center gap-2 ${
              active === tab
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
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

