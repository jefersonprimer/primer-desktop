import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import HatGlassesIcon from "@/components/ui/icons/HatGlassesIcon"
import EnterIcon from "@/components/ui/icons/EnterIcon";
import MonitorIcon from "@/components/ui/icons/MonitorIcon";
import MicIcon from "@/components/ui/icons/MicIcon";
import BoxIcon from "@/components/ui/icons/BoxIcon";
import EyeIcon from "@/components/ui/icons/EyeIcon";
import SearchIcon from "@/components/ui/icons/SearchIcon";

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/40 font-sans border border-white/5 min-w-[20px] inline-flex items-center justify-center">
    {children}
  </kbd>
);

export default function ShortcutsTab() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8">
      <div className="mb-6 px-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t("shortcuts.title")}</h1>
        <p className="text-sm">
          {t("shortcuts.description")}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white px-4 mb-2">{t("shortcuts.general.title")}</h2>
        
        {/* Toggle Visibility */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="gap-2 flex items-center">
            <div className="text-gray-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="M6 8h.01"/>
                <path d="M10 8h.01"/>
                <path d="M14 8h.01"/>
              </svg>
            </div>
            <h3 className="text-sm text-gray-900 dark:text-white">{t("shortcuts.general.toggleVisibility")}</h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>\</Kbd>
          </div>
        </div>

        {/* Search or Ask anything */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <SearchIcon size={16}/>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.searchAsk")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>D</Kbd>
          </div>
        </div>

        {/* Toggle Dock */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <BoxIcon size={16}/>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.toggleDock")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>D</Kbd>
          </div>
        </div>

        {/* Toggle App */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <EyeIcon size={16}/>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.toggleApp")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>F</Kbd>
          </div>
        </div>

        {/* Ask Screen */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2">
            <div className="text-gray-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round" 
              >
                <path d="M12 18V5"/>
                <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/>
                <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/>
                <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/>
                <path d="M18 18a4 4 0 0 0 2-7.464"/>
                <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/>
                <path d="M6 18a4 4 0 0 1-2-7.464"/>
                <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
              </svg> 
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t("shortcuts.general.askScreen")}</h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd><EnterIcon size={12}/></Kbd>
          </div>
        </div>

        {/* Screenshot */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <MonitorIcon size={16}/>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.screenshot")}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd><EnterIcon size={12}/></Kbd>
            </div>
            <span className="text-[10px] opacity-50">+</span>
            <div className="flex items-center gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>E</Kbd>
            </div>
          </div>
        </div>

        {/* Audio */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <MicIcon size={16}/>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.audio")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>D</Kbd>
          </div>
        </div>

        {/* Clear Conversation */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2">
            <div className="text-gray-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/>
                <path d="m5.082 11.09 8.828 8.828"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.clearConversation")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>R</Kbd>
          </div>
        </div>

        {/* Stealth Mode */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
            <HatGlassesIcon size={16}/> 
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.general.stealthMode")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>S</Kbd>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white px-4 mb-2">{t("shortcuts.scroll.title")}</h3>
        
        {/* Scroll Up */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2">
            <div className="text-gray-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 8 4-4 4 4"/>
                <path d="M7 4v16"/>
                <path d="M11 12h4"/>
                <path d="M11 16h7"/>
                <path d="M11 20h10"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.scroll.up")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg> 
            </Kbd>
          </div>
        </div>

        {/* Scroll Down */}
        <div className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#232326] rounded-lg group">
          <div className="flex items-center gap-2">
            <div className="text-gray-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 16 4 4 4-4"/>
                <path d="M7 20V4"/>
                <path d="M11 4h4"/>
                <path d="M11 8h7"/>
                <path d="M11 12h10"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("shortcuts.scroll.down")}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14"/>
                <path d="m19 12-7 7-7-7"/>
              </svg>
            </Kbd>
          </div>
        </div>

      </div>
    </div>
  );
}