import * as Icons from "lucide-react";
import type { ElementType } from "react";

interface DockItemProps {
  label: string;
  icon: keyof typeof Icons;
  onClick: () => void;
  active?: boolean; // <- para indicar que o modal está aberto
}

export default function DockItem({ label, icon, onClick, active }: DockItemProps) {
  const Icon = Icons[icon] as ElementType;

  return (
    <button
      onClick={onClick}
      className={`
        relative group
        flex flex-col items-center justify-center
        p-3 rounded-xl
        transition
        ${active ? "bg-white/20" : "hover:bg-white/10"}
      `}
    >
      {/* Ícone */}
      <Icon
        className={`
          w-6 h-6 text-white transition-transform
          ${active ? "scale-110" : "group-hover:scale-125"}
        `}
      />

      {/* Tooltip */}
      <span
        className="
          absolute -top-8 px-2 py-1 rounded-md text-xs
          bg-black/80 text-white opacity-0
          group-hover:opacity-100 transition
          pointer-events-none
        "
      >
        {label}
      </span>
    </button>
  );
}


