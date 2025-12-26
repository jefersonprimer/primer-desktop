import { invoke } from "@tauri-apps/api/core";
import CloseIcon from "../ui/icons/CloseIcon";
import SettingsIcon from "../ui/icons/SettingsIcon";
import CalendarIcon from "../ui/icons/CalendarIcon";
import NetworkIcon from "../ui/icons/NetworkIcon";
import BoxesIcon from "../ui/icons/BoxesIcon";
import KeyboardIcon from "../ui/icons/KeyboardIcon";
import LanguagesIcon from "../ui/icons/LanguagesIcon";
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
              onClick={() => onSelectItem("Languages")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Languages" ? "bg-neutral-800 text-white" : ""}`}
            >
              <LanguagesIcon size={18}/>
              Languages
            </button>


            <button
              onClick={() => onSelectItem("Billing")}
              className={`relative mb-4 flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Billing" ? "bg-neutral-800 text-white" : ""}`}
            >
              <CreditCardIcon size={18}/>
              Billing
            </button>

            <span className="text-xs text-neutral-400 p-2">Support</span>

            <button
              onClick={() => onSelectItem("Changelog")}
              className={`relative flex items-center gap-3 p-2 w-full text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition
              text-neutral-300 hover:bg-neutral-800 hover:text-white
              ${activeItem === "Changelog" ? "bg-neutral-800 text-white" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" 
                height="18"
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 7v14"/>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
              </svg>
              Changelog
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

            <a
              href="https://form.typeform.com"
              className={`group relative flex items-center justify-between p-2 w-full text-[#181719] hover:text-white text-sm font-medium rounded-lg transition
              hover:bg-neutral-800
              ${activeItem === "Report a bug" ? "bg-neutral-800 text-white" : ""}`}
            >

              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24" 
                  fill="#9D9DA3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round" 
                >
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
                  <path d="M7 11h10"/>
                  <path d="M7 15h6"/>
                  <path d="M7 7h8"/>
                </svg>

                <span className="group-hover:text-white font-medium text-neutral-400">
                  Report a bug
                </span>
              </div>

              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <path d="M7 7h10v10"/>
                <path d="M7 17 17 7"/>
              </svg>
            </a>

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
              <span className="text-neutral-400 group-hover:text-white">Quit Primer</span>
            </button>
          </div> 
         
        </nav>
      </div>
    </aside>
  );
}
