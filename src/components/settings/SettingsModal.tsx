import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";
import Sidebar from "./SideBar";
import ApiTabs from "./ApiTabs";
import GoogleTab from "./GoogleTabs";
import Footer from "./Footer";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ApiKeyDto {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  created_at: string;
}

interface GetApiKeysResponse {
  api_keys: ApiKeyDto[];
}

export default function SettingsModal({ open, onClose }: Props) {
  const { userId } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  useEffect(() => {
    if (open && userId) {
      fetchApiKeys();
    }
  }, [open, userId]);

  const fetchApiKeys = async () => {
    try {
      const response = await invoke<GetApiKeysResponse>("get_api_keys", {
        dto: { user_id: userId },
      });
      setApiKeys(response.api_keys);
      setConfiguredProviders(response.api_keys.map((k) => k.provider));
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  };

  const getApiKey = (provider: string) => {
    return apiKeys.find((k) => k.provider === provider)?.api_key;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full">

        {/* sidebar */}
        <Sidebar />

        {/* conteúdo */}
        <div className="flex-1 flex flex-col bg-neutral-900">
          <ApiTabs configuredProviders={configuredProviders} />
          <GoogleTab savedKey={getApiKey("gemini")} />
        </div>

        <Footer/>

      </div>
    </Modal>
  );
}

