import { invoke } from "@tauri-apps/api/core";

import CloseIcon from "../ui/icons/CloseIcon";
import SettingsIcon from "../ui/icons/SettingsIcon";
import CalendarIcon from "../ui/icons/CalendarIcon";
import NetworkIcon from "../ui/icons/NetworkIcon";
import BoxesIcon from "../ui/icons/BoxesIcon";
import KeyboardIcon from "../ui/icons/KeyboardIcon";
import ShieldIcon from "../ui/icons/ShieldIcon";
import CircleUserIcon from "../ui/icons/CircleUserIcon";
import CreditCardIcon from "../ui/icons/CreditCardIcon";
import CircleQuestionMarkIcon from "../ui/icons/CircleQuestionMarkIcon";

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
          className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1 rounded-full transition-colors"
        >
          <CloseIcon size={20}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <nav className="flex flex-col h-full space-y-2">
          <div className="flex-1">
            <button
              onClick={() => onSelectItem("General")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "General" ? "bg-neutral-800 text-white" : ""}`}
            >
              <SettingsIcon size={18}/>
              General
            </button>

            <button
              onClick={() => onSelectItem("Calendar")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Calendar" ? "bg-neutral-800 text-white" : ""}`}
            >
              <CalendarIcon size={18}/>
              Calendar
            </button>

            <button
              onClick={() => onSelectItem("API e Modelos")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "API e Modelos" ? "bg-neutral-800 text-white" : ""}`}
            >
              <NetworkIcon size={18}/>
              API e Modelos
            </button>

            <button
              onClick={() => onSelectItem("Recursos")}
              className={`relative flex items-center text-neutral-400 hover:text-white gap-3 p-2 w-full text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Recursos" ? "bg-neutral-800 text-white" : ""}`}
            >
              <BoxesIcon size={18}/>
              Recursos
            </button>

            <button
              onClick={() => onSelectItem("Keybinds")}
              className={`relative flex items-center gap-3 text-neutral-400 hover:text-white p-2 w-full text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Keybinds" ? "bg-neutral-800 text-white" : ""}`}
            >
              <KeyboardIcon size={18}/>
              Keybinds
            </button>

            <button
              onClick={() => onSelectItem("Privacidade")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Privacidade" ? "bg-neutral-800 text-white" : ""}`}
            >
              <ShieldIcon size={18}/>
              Privacidade
            </button>

            <button
              onClick={() => onSelectItem("Profile")}
              className={`group relative flex items-center gap-3 p-2 w-full text-[#181719] hover:text-white text-sm font-medium rounded-lg transition
              text-[#181719] hover:bg-neutral-800 hover:text-white
              ${activeItem === "Profile" ? "bg-neutral-800 text-white" : ""}`}
            >

              <CircleUserIcon size={20} fill="#9D9DA3"/>
              <span className={`group-hover:text-white ${activeItem === "Profile" ? "text-white" : "text-neutral-400"}`}>
                Profile
              </span>
            </button>

            <button
              onClick={() => onSelectItem("Billing")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Billing" ? "bg-neutral-800 text-white" : ""}`}
            >
              <CreditCardIcon size={18}/>
              Billing
            </button>

            <button
              onClick={() => onSelectItem("Help Center")}
              className={`group relative flex items-center gap-3 p-2 w-full text-[#181719] hover:text-white text-sm font-medium rounded-lg transition
              hover:bg-neutral-800
              ${activeItem === "Help Center" ? "bg-neutral-800 text-white" : ""}`}
            >

              <CircleQuestionMarkIcon size={20} fill="#9D9DA3" />
              <span className={`group-hover:text-white font-medium ${activeItem === "Help Center" ? "text-white" : "text-neutral-400"}`}>
                Help Center
              </span>
            </button>
          </div>

          <div className="flex flex-col items-start gap-1 pt-4 mt-auto">
            <button className="flex items-center gap-3 p-2 w-full text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition">
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
              className="group flex items-center gap-3 p-2 w-full text-sm font-medium text-[#181719] hover:text-white hover:bg-neutral-800 rounded-lg transition"
              onClick={handleQuit}
            >
              <CircleUserIcon size={20} fill="#9D9DA3"/>
              <span className="text-neutral-400 group-hover:text-white">Quit PrimerAI</span>
            </button>
          </div> 
         
        </nav>
      </div>
    </aside>
  );
}
