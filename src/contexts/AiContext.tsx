import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "./AuthContext";

export type ProviderType = "Google" | "OpenAI" | "OpenRouter" | "Custom";

interface ApiKeyDto {
  provider: string;
  api_key: string;
  selected_model?: string;
}

interface AiContextType {
  activeProvider: ProviderType;
  setActiveProvider: (provider: ProviderType) => void;
  activeModel: string;
  setActiveModel: (model: string) => void;
  refreshConfig: () => Promise<void>;
  getModelForProvider: (provider: ProviderType) => string | undefined;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  
  // Load initial state from localStorage or default
  const [activeProvider, setActiveProviderState] = useState<ProviderType>(() => {
    return (localStorage.getItem("ai_active_provider") as ProviderType) || "Google";
  });

  const [activeModel, setActiveModelState] = useState<string>(() => {
    return localStorage.getItem("ai_active_model") || "gemini-1.5-flash";
  });

  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);

  useEffect(() => {
    if (userId) {
      refreshConfig();
    }
  }, [userId]);

  // When active provider changes, try to switch active model to that provider's saved model
  useEffect(() => {
    localStorage.setItem("ai_active_provider", activeProvider);
    
    // Find saved model for this provider
    const providerKey = activeProvider === "Google" ? "gemini" : activeProvider.toLowerCase();
    const keyData = apiKeys.find(k => k.provider === providerKey);
    
    if (keyData?.selected_model) {
      setActiveModel(keyData.selected_model);
    } else {
      // Defaults
      if (activeProvider === "Google") setActiveModel("gemini-1.5-flash");
      if (activeProvider === "OpenAI") setActiveModel("gpt-4o");
    }

  }, [activeProvider, apiKeys]);

  const refreshConfig = async () => {
    if (!userId) return;
    try {
      const res = await invoke<{ api_keys: ApiKeyDto[] }>("get_api_keys", { 
        dto: { user_id: userId } 
      });
      setApiKeys(res.api_keys);
      
      // Update current model if needed
      const providerKey = activeProvider === "Google" ? "gemini" : activeProvider.toLowerCase();
      const currentKey = res.api_keys.find(k => k.provider === providerKey);
      if (currentKey?.selected_model) {
        setActiveModel(currentKey.selected_model);
      }
    } catch (e) {
      console.error("Failed to fetch API keys in AiContext", e);
    }
  };

  const setActiveProvider = (provider: ProviderType) => {
    setActiveProviderState(provider);
  };

  const setActiveModel = (model: string) => {
    setActiveModelState(model);
    localStorage.setItem("ai_active_model", model);
  };

  const getModelForProvider = (provider: ProviderType) => {
     const providerKey = provider === "Google" ? "gemini" : provider.toLowerCase();
     return apiKeys.find(k => k.provider === providerKey)?.selected_model;
  }

  return (
    <AiContext.Provider value={{ 
      activeProvider, 
      setActiveProvider, 
      activeModel, 
      setActiveModel,
      refreshConfig,
      getModelForProvider
    }}>
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const context = useContext(AiContext);
  if (context === undefined) {
    throw new Error("useAi must be used within an AiProvider");
  }
  return context;
}
