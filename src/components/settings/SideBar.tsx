import { invoke } from "@tauri-apps/api/core";

import CloseIcon from "../ui/icons/CloseIcon";
import SettingsIcon from "../ui/icons/SettingsIcon";
import CalendarIcon from "../ui/icons/CalendarIcon";
import NetworkIcon from "../ui/icons/NetworkIcon";
import BoxesIcon from "../ui/icons/BoxesIcon";
import KeyboardIcon from "../ui/icons/KeyboardIcon";
import ShieldIcon from "../ui/icons/ShieldIcon";
import UserIcon from "../ui/icons/UserIcon";
import CreditCardIcon from "../ui/icons/CreditCardIcon";
import CircleQuestionMarkIcon from "../ui/icons/CircleQuestionMarkIcon";

const items = [
  { label: "General", icon: <SettingsIcon size={18}/>},
  { label: "Calendar", icon: <CalendarIcon size={18}/> },
  { label: "API e Modelos", icon: <NetworkIcon size={18}/>  },
  { label: "Recursos", icon: <BoxesIcon size={18}/> },
  { label: "Keybinds", icon: <KeyboardIcon size={18}/> },
  { label: "Privacidade", icon: <ShieldIcon size={18}/> },
  { label: "Profile", icon: <UserIcon size={14} stroke="#181719"/> },
  { label: "Billing", icon: <CreditCardIcon size={18}/> },
  { label: "Help Center", icon: <CircleQuestionMarkIcon size={20} color="#181719" fill="#9D9DA3" /> },
];

interface Props {
  activeItem: string;
  onSelectItem: (item: string) => void;
  onClose: () => void;
}

export default function Sidebar({ activeItem, onSelectItem, onClose }: Props) {
  const handleQuit = async () => {
    await invoke("close_app");
  };

  return (
    <aside className="w-52 bg-[#181719] border-r border-neutral-700 h-full flex flex-col">
      <div className="flex items-center justify-between p-3 shrink-0">
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-md transition-colors"
        >
          <CloseIcon size={20}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <nav className="flex flex-col h-full space-y-2">
          <div className="flex-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => onSelectItem(item.label)}
                className={`
                  relative flex items-center gap-3 p-2 w-full 
                  text-sm font-medium rounded-lg
                  transition
                  text-neutral-300 hover:bg-neutral-800 hover:text-white
                  ${activeItem === item.label ? "bg-neutral-800 text-white" : ""}
                `}
              >
                <span className={`text-lg ${activeItem === item.label ? "text-white" : ""}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-start gap-1 pt-4 mt-auto">
            <button className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round" 
                stroke-linejoin="round"
              >
                <path d="m16 17 5-5-5-5"/>
                <path d="M21 12H9"/>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              <span >Sign Out</span>
            </button>


            <button 
              className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              onClick={handleQuit}
            >
              <UserIcon size={14} stroke="#181719"/>
              <span>Quit PrimerAI</span>
            </button>
          </div> 
         
        </nav>
      </div>
    </aside>
  );
}

