import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";
import Sidebar from "./SideBar";
import ApiTabs from "./ApiTabs";
import GoogleTab from "./GoogleTab";
import OpenAiTab from "./OpenAiTab";
import OpenRouterTab from "./OpenRouterTab";
import AudioScreenTab from "./AudioScreenTab";
import PrivacyTab from "./PrivacyTab";
import PermissionsTab from "./PermissionsTab";
import ResourcesTab from "./ResourcesTab";
import ShortcutsTab, { type ShortcutsTabHandle } from "./ShortcutsTab";
import AccountTab from "./AccountTab";
import PremiumTab from "./PremiumTab";
import HelpTab from "./HelpTab";
import { useAuth } from "../../contexts/AuthContext";
import { useAi } from "../../contexts/AiContext";

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
  const { refreshConfig } = useAi();
  const [activeItem, setActiveItem] = useState("API e Modelos");
  const [activeApiTab, setActiveApiTab] = useState("Google");
  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);
  const shortcutsRef = useRef<ShortcutsTabHandle>(null);

  // Form State
  const [activeApiKey, setActiveApiKey] = useState("");
  const [activeModel, setActiveModel] = useState("");

  useEffect(() => {
    if (open && userId) {
      fetchApiKeys();
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
      default: return "";
    }
  };

  const getDefaultModel = (tab: string) => {
    switch (tab) {
      case "Google": return "flash";
      case "OpenAI": return "gpt-4o";
      case "OpenRouter": return "mistralai/mistral-7b-instruct";
      default: return "";
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    // Only handle save for API tabs for now
    if (activeItem === "API e Modelos") {
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
        console.log("Saved successfully");
      } catch (error) {
        console.error("Failed to save:", error);
      }
    } else if (activeItem === "Atalhos" && shortcutsRef.current) {
      await shortcutsRef.current.save();
    } else {
      console.log("Save not implemented for this tab yet");
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
                savedModel={apiKeys.find((k) => k.provider === "gemini")?.selected_model}
              />
            )}
            {activeApiTab === "OpenAI" && (
              <OpenAiTab 
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "openai")?.api_key}
                savedModel={apiKeys.find((k) => k.provider === "openai")?.selected_model}
              />
            )}
            {activeApiTab === "OpenRouter" && (
              <OpenRouterTab
                apiKey={activeApiKey}
                setApiKey={setActiveApiKey}
                model={activeModel}
                setModel={setActiveModel}
                savedKey={apiKeys.find((k) => k.provider === "openrouter")?.api_key}
                savedModel={apiKeys.find((k) => k.provider === "openrouter")?.selected_model}
              />
            )}
            {activeApiTab === "Custom" && <div className="p-6 text-neutral-400">Custom API em breve...</div>}
          </>
        );
      case "Áudio e Tela":
        return <AudioScreenTab />;
      case "Permissões":
        return <PermissionsTab />;
      case "Recursos":
        return <ResourcesTab />;
      case "Atalhos":
        return <ShortcutsTab ref={shortcutsRef} />;
      case "Privacidade":
        return <PrivacyTab />;
      case "Conta":
        return <AccountTab/>;
      case "Premium":
        return <PremiumTab/>;
      case "Ajuda":
        return <HelpTab/>;
      default:
        return (
          <div className="p-6 text-neutral-400">
            Conteúdo para {activeItem} em breve...
          </div>
        );
    }
  };

  return (
    <Modal open={open} onClose={onClose} onSave={handleSave}>
      <div className="flex h-full">

        {/* sidebar */}
        <Sidebar activeItem={activeItem} onSelectItem={setActiveItem} />

        {/* conteúdo */}
        <div className="flex-1 flex flex-col bg-neutral-900 overflow-y-auto">
          {renderContent()}
        </div>

      </div>
    </Modal>
  );
}

