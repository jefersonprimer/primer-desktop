import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { useAuth } from "../../contexts/AuthContext";
import { useAi } from "../../contexts/AiContext";

import Sidebar from "./SideBar";
import GeneralTab from "./GeneralTab";
import CalendarTab from "./CalendarTab";
import ApiTabs from "./ApiTabs";
import GoogleTab from "./GoogleTab";
import OpenAiTab from "./OpenAiTab";
import OpenRouterTab from "./OpenRouterTab";
import CustomTab from "./CustomTab";
import LanguagesTab from "./LanguagesTab";
import ResourcesTab from "./ResourcesTab";
import ShortcutsTab from "./ShortcutsTab";
import AccountTab from "./AccountTab";
import PremiumTab from "./PremiumTab";
import ChangelogTab from "./ChangelogTab";
import HelpTab from "./HelpTab";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ApiKeyDto {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  selected_model?: string;
  created_at: string;
}

interface GetApiKeysResponse {
  api_keys: ApiKeyDto[];
}

export default function SettingsModal({ open, onClose }: Props) {
  const { userId } = useAuth();
  const { refreshConfig, activeProvider } = useAi();
  const [activeItem, setActiveItem] = useState("API e Modelos");
  const [activeApiTab, setActiveApiTab] = useState("Google");
  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);

  // Form State
  const [activeApiKey, setActiveApiKey] = useState("");
  const [activeModel, setActiveModel] = useState("");

  useEffect(() => {
    if (open && userId) {
      fetchApiKeys();
      setActiveApiTab(activeProvider);
    }
  }, [open, userId]);

  // Sync state when tab or keys change
  useEffect(() => {
    const provider = getProviderFromTab(activeApiTab);
    const keyData = apiKeys.find((k) => k.provider === provider);
    
    if (keyData) {
      setActiveApiKey(keyData.api_key);
      setActiveModel(keyData.selected_model || getDefaultModel(activeApiTab));
    } else {
      setActiveApiKey("");
      setActiveModel(getDefaultModel(activeApiTab));
    }
  }, [activeApiTab, apiKeys]);

  const fetchApiKeys = async () => {
    try {
      const response = await invoke<GetApiKeysResponse>("get_api_keys", {
        dto: { user_id: userId },
      });
      setApiKeys(response.api_keys);
      refreshConfig();
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  };

  const getProviderFromTab = (tab: string) => {
    switch (tab) {
      case "Google": return "gemini";
      case "OpenAI": return "openai";
      case "OpenRouter": return "openrouter";
      case "Custom": return "ollama";
      default: return "";
    }
  };

  const getDefaultModel = (tab: string) => {
    switch (tab) {
      case "Google": return "flash";
      case "OpenAI": return "gpt-4o";
      case "OpenRouter": return "mistralai/mistral-7b-instruct";
      case "Custom": return "llama3";
      default: return "";
    }
  };

  const handleSaveCurrentApiTab = async () => {
    if (!userId) return;
    
    const provider = getProviderFromTab(activeApiTab);
    if (!provider) return;

    try {
      await invoke("add_api_key", {
        dto: {
          user_id: userId,
          provider,
          api_key: activeApiKey,
          selected_model: activeModel,
        },
      });
      // Refresh keys to ensure UI is in sync with backend
      await fetchApiKeys();
      // alert("Salvo com sucesso!"); // Optional feedback
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case "API e Modelos":
        return (
          <>
            <ApiTabs 
              active={activeApiTab}
              onTabChange={setActiveApiTab}
            />
            {activeApiTab === "Google" && (
              <GoogleTab 
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "gemini")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "OpenAI" && (
              <OpenAiTab 
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "openai")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "OpenRouter" && (
              <OpenRouterTab
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "openrouter")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "Custom" && (
              <CustomTab
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "ollama")?.api_key}
                savedModel={apiKeys.find((k) => k.provider === "ollama")?.selected_model}
                onSave={handleSaveCurrentApiTab}
              />
            )}
          </>
        );
      case "General":
        return <GeneralTab/>;
      case "Calendar":
        return <CalendarTab/>;
      case "Recursos":
        return <ResourcesTab />;
      case "Keybinds":
        return <ShortcutsTab />;
      case "Languages":
        return <LanguagesTab />;
      case "Profile":
        return <AccountTab/>;
      case "Billing":
        return <PremiumTab/>;
      case "Changelog":
        return <ChangelogTab/>;
      case "Help Center":
        return <HelpTab/>;
      default:
        return (
          <div className="p-6 text-neutral-400">
            Conteúdo para {activeItem} em breve...
          </div>
        );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-[99999]">
      <div className="relative bg-neutral-900 text-white rounded-xl shadow-xl w-[900px] h-[700px] overflow-hidden border border-neutral-700 flex flex-col">
        <div className="flex-1 min-h-0 relative w-full">
          <div className="flex h-full">
            <Sidebar activeItem={activeItem} onSelectItem={setActiveItem} onClose={onClose} />

            <div className="flex-1 flex flex-col bg-neutral-900 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

