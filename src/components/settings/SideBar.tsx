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

  const itemClass = (isActive: boolean) => `
    relative flex items-center gap-3 p-2 w-full text-sm font-medium rounded-lg transition
    ${isActive 
      ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white" 
      : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
    }
  `;

  return (
    <aside className="w-52 bg-white dark:bg-[#181719] border-r border-gray-200 dark:border-neutral-700 h-full flex flex-col">
      <div className="flex items-center justify-between p-3 shrink-0">
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-colors"
        >
          <CloseIcon size={20}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <nav className="flex flex-col h-full space-y-1">
          <div className="flex-1 space-y-1">
            <button
              onClick={() => onSelectItem("General")}
              className={itemClass(activeItem === "General")}
            >
              <SettingsIcon size={18}/>
              General
            </button>

            <button
              onClick={() => onSelectItem("Calendar")}
              className={itemClass(activeItem === "Calendar")}
            >
              <CalendarIcon size={18}/>
              Calendar
            </button>

            <button
              onClick={() => onSelectItem("API e Modelos")}
              className={itemClass(activeItem === "API e Modelos")}
            >
              <NetworkIcon size={18}/>
              API e Modelos
            </button>

            <button
              onClick={() => onSelectItem("Recursos")}
              className={itemClass(activeItem === "Recursos")}
            >
              <BoxesIcon size={18}/>
              Recursos
            </button>

            <button
              onClick={() => onSelectItem("Keybinds")}
              className={itemClass(activeItem === "Keybinds")}
            >
              <KeyboardIcon size={18}/>
              Keybinds
            </button>

            <button
              onClick={() => onSelectItem("Profile")}
              className={itemClass(activeItem === "Profile")}
            >
              <CircleUserIcon size={20} className={activeItem === "Profile" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-[#9D9DA3]"} />
              <span>
                Profile
              </span>
            </button>

            <button
              onClick={() => onSelectItem("Languages")}
              className={itemClass(activeItem === "Languages")}
            >
              <LanguagesIcon size={18}/>
              Languages
            </button>


            <button
              onClick={() => onSelectItem("Billing")}
              className={itemClass(activeItem === "Billing")}
            >
              <CreditCardIcon size={18}/>
              Billing
            </button>

            <div className="py-2">
              <span className="text-xs font-medium text-gray-400 dark:text-neutral-500 px-2 uppercase tracking-wider">Support</span>
            </div>

            <button
              onClick={() => onSelectItem("Changelog")}
              className={itemClass(activeItem === "Changelog")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18" 
                height="18"
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 7v14"/>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
              </svg>
              Changelog
            </button>


            <button
              onClick={() => onSelectItem("Help Center")}
              className={itemClass(activeItem === "Help Center")}
            >
              <CircleQuestionMarkIcon size={20} className={activeItem === "Help Center" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-[#9D9DA3]"} />
              <span className="font-medium">
                Help Center
              </span>
            </button>

            <a
              href="https://form.typeform.com"
              className={`group ${itemClass(activeItem === "Report a bug")} justify-between`}
            >

              <div className="flex items-center gap-3">
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
                  className="text-gray-400 dark:text-[#9D9DA3]" 
                >
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
                  <path d="M7 11h10"/>
                  <path d="M7 15h6"/>
                  <path d="M7 7h8"/>
                </svg>

                <span className="font-medium">
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
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-neutral-500"
              >
                <path d="M7 7h10v10"/>
                <path d="M7 17 17 7"/>
              </svg>
            </a>

          </div>

          <div className="flex flex-col items-start gap-1 pt-4 mt-auto border-t border-gray-100 dark:border-neutral-800">
            <button className="flex items-center gap-3 p-2 w-full text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
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
              >
                <path d="m16 17 5-5-5-5"/>
                <path d="M21 12H9"/>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              <span >Sign Out</span>
            </button>


            <button 
              className="group flex items-center gap-3 p-2 w-full text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
              onClick={handleQuit}
            >
              <CircleUserIcon size={20} className="text-gray-400 dark:text-[#9D9DA3] group-hover:text-gray-600 dark:group-hover:text-white"/>
              <span>Quit Primer</span>
            </button>
          </div> 
         
        </nav>
      </div>
    </aside>
  );
}
