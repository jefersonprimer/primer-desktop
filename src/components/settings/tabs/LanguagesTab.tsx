import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAi } from '../../../contexts/AiContext';

import LanguagesIcon from "@/components/ui/icons/LanguagesIcon";
import ChevronDownIcon from "@/components/ui/icons/ChevronDownIcon";
import CheckIcon from "@/components/ui/icons/CheckIcon";

export default function LanguagesTab() {
  const { t } = useTranslation();
  const { 
    transcriptionLanguage, 
    setTranscriptionLanguage, 
    outputLanguage, 
    setOutputLanguage 
  } = useAi();
  
  const [isTranscriptionDropdownOpen, setIsTranscriptionDropdownOpen] = useState(false);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);

  const languages = [
    { code: 'en-US', name: 'English', nativeName: 'English' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
    { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr-FR', name: 'French', nativeName: 'Français' },
    { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
    { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  ];

  const currentTranscriptionLanguage = languages.find(lang => lang.code === transcriptionLanguage) || languages[1];
  const currentOutputLanguage = languages.find(lang => lang.code === outputLanguage) || languages[1];

  return (
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 font-medium p-8">
      <div className="flex flex-col mb-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t("languages.title")}</h1>
        <p className="text-sm">{t("languages.description")}</p>
      </div> 

      <div className="flex flex-col py-3 mb-6">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center shrink-0 transition-colors">
            <LanguagesIcon size={24}/>
          </div>
          
          <div className="my-2">
            <h3 className="text-gray-900 dark:text-white">{t("languages.transcription.title")}</h3>
            <p className="text-sm">{t("languages.transcription.description")}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsTranscriptionDropdownOpen(!isTranscriptionDropdownOpen);
              setIsOutputDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
          >
            <span>{currentTranscriptionLanguage.nativeName}</span>
            <ChevronDownIcon size={16} />
          </button>

          {isTranscriptionDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#272628] border border-gray-200 dark:border-zinc-700 rounded shadow-xl dark:shadow-lg z-20 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setTranscriptionLanguage(lang.code);
                    setIsTranscriptionDropdownOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white transition-colors"
                >
                  <span>{lang.nativeName}</span>
                  {transcriptionLanguage === lang.code && <CheckIcon size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col py-3 ">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 bg-gray-100 dark:bg-[#272628] rounded flex items-center justify-center shrink-0 transition-colors">
            <LanguagesIcon size={24}/>
          </div>
          
            <div className="my-2">
            <h3 className="text-gray-900 dark:text-white">{t("languages.output.title")}</h3>
            <p className="text-sm">{t("languages.output.description")}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsOutputDropdownOpen(!isOutputDropdownOpen);
              setIsTranscriptionDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
          >
            <span>{currentOutputLanguage.nativeName}</span>
            <ChevronDownIcon size={16} />
          </button>

          {isOutputDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#272628] border border-gray-200 dark:border-zinc-700 rounded shadow-xl dark:shadow-lg z-20 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setOutputLanguage(lang.code);
                    setIsOutputDropdownOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white transition-colors"
                >
                  <span>{lang.nativeName}</span>
                  {outputLanguage === lang.code && <CheckIcon size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
