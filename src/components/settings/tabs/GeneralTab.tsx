import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStealthMode } from '../../../contexts/StealthModeContext';
import { useTheme } from '../../../contexts/ThemeContext';

import EyeIcon from "@/components/ui/icons/EyeIcon";
import HatGlassesIcon from "@/components/ui/icons/HatGlassesIcon";
import PaletteIcon from "@/components/ui/icons/PaletteIcon";
import BadgeCheckIcon from "@/components/ui/icons/BadgeCheckIcon";
import PowerIcon from "@/components/ui/icons/PowerIcon";
import MonitorIcon from "@/components/ui/icons/MonitorIcon";
import SunIcon from "@/components/ui/icons/SunIcon";
import MoonIcon from "@/components/ui/icons/MoonIcon";
import ChevronDownIcon from "@/components/ui/icons/ChevronDownIcon";
import HeadsetIcon from "@/components/ui/icons/HeadsetIcon";

export default function GeneralTab() {
  const { t } = useTranslation();
  const { isStealth, toggleStealth } = useStealthMode();
  const { theme, setTheme } = useTheme();

  const [openPrimerOnLogin, setOpenPrimerOnLogin] = useState(true);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [autoFocus, setAutoFocus] = useState(false);
  const [ambientAiChat, setAmbientAiChat] = useState(false);
  const [version] = useState('0.1.0');

  return (
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8">
      <div className="flex items-center justify-between mb-8 bg-gray-50 dark:bg-[#242425] px-4 py-3 rounded-xl">
        <div className="flex flex-col">
          {!isStealth ? (
            <>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <EyeIcon size={18} />
                <h1 className="text-lg font-semibold">{t('general.detectable')}</h1>
              </div>
              <p className="text-sm">
                {t('general.detectableDescription')}{' '}
                <a href="#" className="text-blue-500 dark:text-blue-400 hover:underline">
                  {t('general.supportedApps')}
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <HatGlassesIcon size={18} />
                <h1 className="text-lg font-semibold">{t('general.undetectable')}</h1>
              </div>
              <p className="text-sm">
                {t('general.undetectableDescription')}{' '}
                <a href="#" className="text-blue-500 dark:text-blue-400 hover:underline">
                  {t('general.supportedApps')}
                </a>
              </p>
            </>
          )}
        </div>

        <button
          onClick={toggleStealth}
          className={`relative w-11 h-6 rounded-full transition-colors ${isStealth ? 'bg-[#48CAE1]' : 'bg-gray-200 dark:bg-zinc-700'
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isStealth ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </button>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-white">{t('general.title')}</h2>
        <p className="text-sm mb-2">
          {t('general.description')}
        </p>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
              <PowerIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.openOnLogin')}</h3>
              <p className="text-sm">
                {t('general.openOnLoginDescription')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenPrimerOnLogin(!openPrimerOnLogin)}
            className={`relative w-11 h-6 rounded-full transition-colors ${openPrimerOnLogin ? 'bg-[#48CAE1]' : 'bg-gray-200 dark:bg-zinc-700'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${openPrimerOnLogin ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
              <PaletteIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.theme')}</h3>
              <p className="text-sm">
                {t('general.themeDescription')}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="flex items-center bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-sm text-gray-700 dark:text-gray-300 py-2 px-3 gap-3 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
            >
              <div className="flex items-center gap-2">
                {theme === 'system' && <MonitorIcon size={16} />}
                {theme === 'light' && <SunIcon size={16} />}
                {theme === 'dark' && <MoonIcon size={16} />}
                <span>
                  {theme === 'system' && t('general.systemPreference')}
                  {theme === 'light' && t('general.light')}
                  {theme === 'dark' && t('general.dark')}
                </span>
              </div>
              <ChevronDownIcon size={16} />
            </button>

            {isThemeDropdownOpen && (
              <div className="absolute top-full mt-1 p-1 rounded-xl right-0 min-w-[200px] bg-white dark:bg-[#272628] border border-gray-200 dark:border-zinc-700 z-10 overflow-hidden">
                <button
                  onClick={() => { setTheme('system'); setIsThemeDropdownOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#48CAE1] transition-colors"
                >
                  <MonitorIcon size={16} />
                  {t('general.systemPreference')}
                </button>
                <button
                  onClick={() => { setTheme('light'); setIsThemeDropdownOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#48CAE1] transition-colors"
                >
                  <SunIcon size={16} />
                  {t('general.light')}
                </button>
                <button
                  onClick={() => { setTheme('dark'); setIsThemeDropdownOpen(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#48CAE1] transition-colors"
                >
                  <MoonIcon size={16} />
                  {t('general.dark')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
              <BadgeCheckIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.version')}</h3>
              <p className="text-sm">
                {t('general.versionDescription')} {version}
              </p>
            </div>
          </div>
          <button className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg text-sm text-gray-700 dark:text-white font-semibold transition-colors border border-gray-200 dark:border-zinc-700">
            {t('general.checkForUpdates')}
          </button>
        </div>
      </div>

      <div className="pb-4">
        <div
          className="flex items-center justify-between "
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.advanced')}</h3>
          <div className={`transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isAdvancedOpen ? 'rotate-180' : ''}`}>
            <ChevronDownIcon size={18} />
          </div>
        </div>

        <p className="text-sm mb-2">
          {t('general.advancedDescription')}
        </p>

        {isAdvancedOpen && (
          <div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1" />
                    <path d="M7 22h1a4 4 0 0 0 4-4v-1" />
                    <path d="M7 2h1a4 4 0 0 1 4 4v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.autoFocus')}</h3>
                  <p className="text-sm">
                    {t('general.autoFocusDescription')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoFocus(!autoFocus)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoFocus ? 'bg-[#48CAE1]' : 'bg-gray-200 dark:bg-zinc-700'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${autoFocus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
                  <HeadsetIcon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('general.ambientAiChat')}</h3>
                  <p className="text-sm">
                    {t('general.ambientAiChatDescription')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAmbientAiChat(!ambientAiChat)}
                className={`relative w-11 h-6 rounded-full transition-colors ${ambientAiChat ? 'bg-[#48CAE1]' : 'bg-gray-200 dark:bg-zinc-700'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${ambientAiChat ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-4 text-xs text-zinc-500">
        {t('general.about')} {version}
      </div>
    </div>
  );
}
