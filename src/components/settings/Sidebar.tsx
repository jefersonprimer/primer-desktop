import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const handleQuit = async () => {
    await invoke("close_app");
  };

  const itemClass = (isActive: boolean) => `
    group relative flex items-center gap-3 p-2 w-full text-sm rounded-lg transition
    ${isActive
      ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white"
      : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
    }
  `;

  return (
    <aside className="w-52 bg-white dark:bg-[#181719] border-r border-gray-200 dark:border-neutral-700 h-full overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between p-3 shrink-0">
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-colors"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <nav className="flex flex-col h-full space-y-1">
          <div className="flex-1">
            <button
              onClick={() => onSelectItem("General")}
              className={itemClass(activeItem === "General")}
            >
              <SettingsIcon size={20} />
              {t('sidebar.general')}
            </button>

            <button
              onClick={() => onSelectItem("Calendar")}
              className={itemClass(activeItem === "Calendar")}
            >
              <CalendarIcon size={20} />
              {t('sidebar.calendar')}
            </button>

            <button
              onClick={() => onSelectItem("API e Modelos")}
              className={itemClass(activeItem === "API e Modelos")}
            >
              <NetworkIcon size={20} />
              {t('sidebar.apiAndModels')}
            </button>

            <button
              onClick={() => onSelectItem("Recursos")}
              className={itemClass(activeItem === "Recursos")}
            >
              <BoxesIcon size={20} />
              {t('sidebar.resources')}
            </button>

            <button
              onClick={() => onSelectItem("Keybinds")}
              className={itemClass(activeItem === "Keybinds")}
            >
              <KeyboardIcon size={20} />
              {t('sidebar.keybinds')}
            </button>

            <button
              onClick={() => onSelectItem("Profile")}
              className={itemClass(activeItem === "Profile")}
            >
              <CircleUserIcon size={20} className={activeItem === "Profile" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-[#9D9DA3] group-hover:text-black dark:group-hover:text-white"} />
              <span>
                {t('sidebar.profile')}
              </span>
            </button>

            <button
              onClick={() => onSelectItem("Languages")}
              className={itemClass(activeItem === "Languages")}
            >
              <LanguagesIcon size={20} />
              {t('sidebar.languages')}
            </button>


            <button
              onClick={() => onSelectItem("Billing")}
              className={itemClass(activeItem === "Billing")}
            >
              <CreditCardIcon size={20} />
              {t('sidebar.billing')}
            </button>

            <div className="py-2">
              <span className="text-xs text-gray-600 dark:text-neutral-400 px-2 tracking-wider">{t('sidebar.support')}</span>
            </div>

            <button
              onClick={() => onSelectItem("Changelog")}
              className={itemClass(activeItem === "Changelog")}
            >
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
                <path d="M12 7v14" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
              </svg>
              {t('sidebar.changelog')}
            </button>


            <button
              onClick={() => onSelectItem("Help Center")}
              className={itemClass(activeItem === "Help Center")}
            >
              <CircleQuestionMarkIcon size={20} className={activeItem === "Help Center" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-[#9D9DA3] group-hover:text-black dark:group-hover:text-white"} />
              <span className="font-medium">
                {t('sidebar.helpCenter')}
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
                >
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                  <path d="M7 11h10" />
                  <path d="M7 15h6" />
                  <path d="M7 7h8" />
                </svg>

                <span className="font-medium">
                  {t('sidebar.reportBug')}
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
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </a>

          </div>

          <div className="flex flex-col items-start gap-1 pt-4 mt-auto">
            <button className="flex items-center gap-3 p-2 w-full text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
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
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
              <span>{t('sidebar.signOut')}</span>
            </button>


            <button
              className="group flex items-center gap-3 p-2 w-full text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
              onClick={handleQuit}
            >
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
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
              <span>{t('sidebar.quitPrimer')}</span>
            </button>
          </div>

        </nav>
      </div>
    </aside>
  );
}
