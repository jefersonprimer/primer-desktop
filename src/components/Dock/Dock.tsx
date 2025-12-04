import DockItem from "./DockItem";

interface DockProps {
  onOpenModal: (modal: string) => void;
}

export default function Dock({ onOpenModal }: DockProps) {
  return (
    <div
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2
        flex items-center gap-3
        bg-black/40 backdrop-blur-xl
        px-5 py-3 rounded-2xl
        border border-white/10
        shadow-lg
        z-[9999]
      "
    >
      <DockItem
        label="Apps"
        icon="Grid"
        onClick={() => onOpenModal("apps")}
      />

      <DockItem
        label="Settings"
        icon="Settings"
        onClick={() => onOpenModal("settings")}
      />

      <DockItem
        label="Ask"
        icon="MessageSquare"
        onClick={() => onOpenModal("chat")}
      />

      <DockItem
        label="Mic"
        icon="Mic"
        onClick={() => onOpenModal("audio")}
      />

      <DockItem
        label="Listen"
        icon="Ear"
        onClick={() => onOpenModal("listen")}
      />
    </div>
  );
}

