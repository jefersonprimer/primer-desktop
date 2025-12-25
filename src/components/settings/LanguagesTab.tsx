import React, { useState } from 'react';
import { useAi } from '../../contexts/AiContext';
import LanguagesIcon from "../ui/icons/LanguagesIcon";
import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import CheckIcon from "../ui/icons/CheckIcon";

export default function LanguagesTab() {
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
    <div className="p-8 pb-8 bg-[#1D1D1F] text-neutral-400 font-medium w-full h-full overflow-y-auto">
      <div className="flex flex-col mb-4">
        <h3 className="text-white text-base font-semibold">Languages</h3>
        <p className="text-sm">Select the languages for audio interaction and AI responses.</p>
      </div> 

      {/* Transcription Language */}
      <div className="flex flex-col py-3 mb-6">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 bg-[#272628] rounded flex items-center justify-center shrink-0">
            <LanguagesIcon size={24}/>
          </div>
          
          <div className="my-2">
            <h3 className="text-sm font-medium text-white">Transcription language</h3>
            <p className="text-sm text-neutral-400">The language you will be speaking during meetings.</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsTranscriptionDropdownOpen(!isTranscriptionDropdownOpen);
              setIsOutputDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors border border-zinc-700 justify-between min-w-[180px]"
          >
            <span>{currentTranscriptionLanguage.nativeName}</span>
            <ChevronDownIcon size={16} />
          </button>

          {isTranscriptionDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 bg-[#272628] border border-zinc-700 rounded shadow-lg z-20 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setTranscriptionLanguage(lang.code);
                    setIsTranscriptionDropdownOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <span>{lang.nativeName}</span>
                  {transcriptionLanguage === lang.code && <CheckIcon size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Output Language */}
      <div className="flex flex-col py-3 ">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 bg-[#272628] rounded flex items-center justify-center shrink-0">
            <LanguagesIcon size={24}/>
          </div>
          
            <div className="my-2">
            <h3 className="text-sm font-medium text-white">Output language</h3>
            <p className="text-sm text-neutral-400">The language Primer will use for responses and notes.</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsOutputDropdownOpen(!isOutputDropdownOpen);
              setIsTranscriptionDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors border border-zinc-700 justify-between min-w-[180px]"
          >
            <span>{currentOutputLanguage.nativeName}</span>
            <ChevronDownIcon size={16} />
          </button>

          {isOutputDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 bg-[#272628] border border-zinc-700 rounded shadow-lg z-20 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setOutputLanguage(lang.code);
                    setIsOutputDropdownOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors"
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
