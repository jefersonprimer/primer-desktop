import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { useAuth } from "@/contexts/AuthContext";
import { useAi } from "@/contexts/AiContext";

import Sidebar from "./Sidebar";
import GeneralTab from "./tabs/GeneralTab";
import CalendarTab from "./tabs/CalendarTab";
import NotionTab from "./tabs/NotionTab";
import ApiTabs from "./tabs/ApiTabs";
import GoogleTab from "./tabs/GoogleTab";
import OpenAiTab from "./tabs/OpenAiTab";
import OpenRouterTab from "./tabs/OpenRouterTab";
import CustomTab from "./tabs/CustomTab";
import LanguagesTab from "./tabs/LanguagesTab";
import ResourcesTab from "./tabs/ResourcesTab";
import ShortcutsTab from "./tabs/ShortcutsTab";
import AccountTab from "./tabs/AccountTab";
import PremiumTab from "./tabs/PremiumTab";
import ChangelogTab from "./tabs/ChangelogTab";
import HelpTab from "./tabs/HelpTab";

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: string;
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

interface TabState {
  apiKey: string;
  model: string;
}

export default function SettingsModal({ open, onClose, initialTab }: Props) {
  const { userId, isAuthenticated } = useAuth();
  const { refreshConfig, activeProvider } = useAi();
  const [activeItem, setActiveItem] = useState("API e Modelos");
  const [activeApiTab, setActiveApiTab] = useState("Google");
  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);

  useEffect(() => {
    if (!isAuthenticated && open) {
      onClose();
    }
  }, [isAuthenticated, open, onClose]);

  useEffect(() => {
    if (initialTab) {
      setActiveItem(initialTab);
    }
  }, [initialTab]);

  // Independent state for each tab to prevent shared state issues
  const [drafts, setDrafts] = useState<Record<string, TabState>>({});

  useEffect(() => {
    if (open && userId) {
      fetchApiKeys();
      setActiveApiTab(activeProvider);
    }
  }, [open, userId]);

  // Sync state when keys are loaded
  useEffect(() => {
    const newDrafts: Record<string, TabState> = {};
    const tabs = ["Google", "OpenAI", "OpenRouter", "Custom"];

    tabs.forEach((tab) => {
      const provider = getProviderFromTab(tab);
      const keyData = apiKeys.find((k) => k.provider === provider);

      newDrafts[tab] = {
        apiKey: keyData?.api_key || "",
        model: keyData?.selected_model || getDefaultModel(tab),
      };
    });

    setDrafts(newDrafts);
  }, [apiKeys]);

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
      case "Google": return "gemini-2.5-flash";
      case "OpenAI": return "gpt-4o";
      case "OpenRouter": return "mistralai/mistral-7b-instruct";
      case "Custom": return "llama3";
      default: return "";
    }
  };

  const handleUpdateDraft = (tab: string, field: keyof TabState, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  };

  const handleSaveCurrentApiTab = async () => {
    if (!userId) return;

    const provider = getProviderFromTab(activeApiTab);
    if (!provider) return;

    const currentDraft = drafts[activeApiTab];
    if (!currentDraft) return;

    try {
      await invoke("add_api_key", {
        dto: {
          user_id: userId,
          provider,
          api_key: currentDraft.apiKey,
          selected_model: currentDraft.model,
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
        // Ensure we always have a valid draft object, even if state is initializing
        const currentDraft = drafts[activeApiTab] || {
          apiKey: "",
          model: getDefaultModel(activeApiTab)
        };

        return (
          <>
            <ApiTabs
              active={activeApiTab}
              onTabChange={setActiveApiTab}
            />
            {activeApiTab === "Google" && (
              <GoogleTab
                apiKey={currentDraft.apiKey}
                setApiKey={(val) => handleUpdateDraft("Google", "apiKey", val)}
                model={currentDraft.model}
                setModel={(val) => handleUpdateDraft("Google", "model", val)}
                savedKey={apiKeys.find((k) => k.provider === "gemini")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "OpenAI" && (
              <OpenAiTab
                apiKey={currentDraft.apiKey}
                setApiKey={(val) => handleUpdateDraft("OpenAI", "apiKey", val)}
                model={currentDraft.model}
                setModel={(val) => handleUpdateDraft("OpenAI", "model", val)}
                savedKey={apiKeys.find((k) => k.provider === "openai")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "OpenRouter" && (
              <OpenRouterTab
                apiKey={currentDraft.apiKey}
                setApiKey={(val) => handleUpdateDraft("OpenRouter", "apiKey", val)}
                model={currentDraft.model}
                setModel={(val) => handleUpdateDraft("OpenRouter", "model", val)}
                savedKey={apiKeys.find((k) => k.provider === "openrouter")?.api_key}
                onSave={handleSaveCurrentApiTab}
              />
            )}
            {activeApiTab === "Custom" && (
              <CustomTab
                apiKey={currentDraft.apiKey}
                setApiKey={(val) => handleUpdateDraft("Custom", "apiKey", val)}
                model={currentDraft.model}
                setModel={(val) => handleUpdateDraft("Custom", "model", val)}
                savedKey={apiKeys.find((k) => k.provider === "ollama")?.api_key}
                savedModel={apiKeys.find((k) => k.provider === "ollama")?.selected_model}
                onSave={handleSaveCurrentApiTab}
              />
            )}
          </>
        );
      case "General":
        return <GeneralTab />;
      case "Calendar":
        return <CalendarTab />;
      case "Notion":
        return <NotionTab />;
      case "Recursos":
        return <ResourcesTab />;
      case "Keybinds":
        return <ShortcutsTab />;
      case "Languages":
        return <LanguagesTab />;
      case "Profile":
        return <AccountTab />;
      case "Billing":
        return <PremiumTab />;
      case "Changelog":
        return <ChangelogTab />;
      case "Help Center":
        return <HelpTab />;
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
