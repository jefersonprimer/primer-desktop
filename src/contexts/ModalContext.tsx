import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ModalType = "settings" | "history" | "chat" | "assistants" | null;

interface ModalContextType {
  activeModal: ModalType;
  settingsTab: string;
  openModal: (modal: ModalType, tab?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [settingsTab, setSettingsTab] = useState("API e Modelos");

  const openModal = (modal: ModalType, tab?: string) => {
    setActiveModal(modal);
    if (modal === "settings" && tab) {
      setSettingsTab(tab);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <ModalContext.Provider value={{ activeModal, settingsTab, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModals must be used within a ModalProvider");
  }
  return context;
}
