import NetworkIcon from "../ui/icons/NetworkIcon";
import MicIcon from "../ui/icons/MicIcon";
import ShieldIcon from "../ui/icons/ShieldIcon";
import BoxesIcon from "../ui/icons/BoxesIcon";
import KeyboardIcon from "../ui/icons/KeyboardIcon";
import ShieldHalfIcon from "../ui/icons/ShieldHalfIcon";
import UserIcon from "../ui/icons/UserIcon";
import CircleStarIcon from "../ui/icons/CircleStarIcon";
import CircleQuestionMarkIcon from "../ui/icons/CircleQuestionMarkIcon";

const items = [
  { label: "API e Modelos", icon: <NetworkIcon size={18}/>  },
  { label: "Áudio e Tela", icon: <MicIcon size={18}/> },
  { label: "Permissões", icon: <ShieldIcon size={18}/> },
  { label: "Recursos", icon: <BoxesIcon size={18}/> },
  { label: "Atalhos", icon: <KeyboardIcon size={18}/> },
  { label: "Privacidade", icon: <ShieldHalfIcon size={18}/> },
  { label: "Conta", icon: <UserIcon size={18}/> },
  { label: "Premium", icon: <CircleStarIcon size={18}/> },
  { label: "Ajuda", icon: <CircleQuestionMarkIcon size={18}/> },
];

interface Props {
  activeItem: string;
  onSelectItem: (item: string) => void;
}

export default function Sidebar({ activeItem, onSelectItem }: Props) {
  return (
    <aside className="w-64 bg-[#141414] border-r border-neutral-700 h-full py-3 px-2">
      <nav className="flex flex-col space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectItem(item.label)}
            className={`
              relative flex items-center gap-3 px-4 py-2 w-full 
              text-sm font-medium rounded-lg
              transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === item.label ? "border border-[#3A409F] bg-neutral-800 text-white" : ""}
            `}
          >
            {activeItem === item.label && (
              <div className="absolute left-0 h-8 w-1 bg-[#3A409F] rounded-r-full" />
            )}
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

