import React, { useState } from 'react';

import EyeIcon from "../ui/icons/EyeIcon";
import PaletteIcon from "../ui/icons/PaletteIcon";
import BadgeCheckIcon from "../ui/icons/BadgeCheckIcon";
import PowerIcon from "../ui/icons/PowerIcon";
import MonitorIcon from "../ui/icons/MonitorIcon";
import ChevronDownIcon from "../ui/icons/ChevronDownIcon";

export default function GeneralTab() {
  const [openCladyOnLogin, setOpenCladyOnLogin] = useState(true);
  const [theme, setTheme] = useState('clady-dark');
  const [systemPreference, setSystemPreference] = useState('System Preference');
  const [version] = useState('0.1.0');

  return (
    <div className="h-full bg-[#1D1D1F] text-gray-200 p-6 relative">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-[#242425] py-2 px-4 rounded-lg">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <EyeIcon size={20} />
              <h1 className="text-xl font-semibold text-white">Detectable</h1>
            </div>
            <p className="text-sm text-gray-400">
              Primer is a personally detectable AI window covering.{' '}
              <a href="#" className="text-blue-400 hover:underline">
                I'd believe that
              </a>
            </p>
          </div>

          <button
              onClick={() => setOpenCladyOnLogin(!openCladyOnLogin)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                openCladyOnLogin ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  openCladyOnLogin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

        </div>

        {/* General Settings Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white">General settings</h2>
          <p className="text-sm text-gray-400 mb-2">
            Customize how Primer works for you.
          </p>

          {/* Open Clady when you log in */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#272628] rounded flex items-center justify-center">
                <PowerIcon size={24}/>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Open Primer when you log in</h3>
                <p className="text-sm text-gray-400">
                  Primer will automatically open when you log in to your computer
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenCladyOnLogin(!openCladyOnLogin)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                openCladyOnLogin ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  openCladyOnLogin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#272628] rounded flex items-center justify-center">  
                <PaletteIcon size={24}/>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Theme</h3>
                <p className="text-sm text-gray-400">
                  Customize how Primer looks on your device
                </p>

              </div>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-gray-300 transition-colors">
              <MonitorIcon size={18}/>
              System Preference
              <ChevronDownIcon size={18}/>
            </button>
          </div>

          {/* Version */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#272628] rounded flex items-center justify-center">
                <BadgeCheckIcon size={24}/>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Version</h3>
                <p className="text-sm text-gray-400">
                  You are currently using Primer version {version}
                </p>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-gray-300 transition-colors border border-zinc-700">
              Check for updates
            </button>
          </div>
        </div>

        {/* Advanced Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Advanced</h2>
            <ChevronDownIcon size={18}/> 
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Download some of Primer features.
          </p>
        </div>

      </div>
      <div className="absolute bottom-6 right-6 text-xs text-zinc-500">
        About {version}
      </div>
    </div>
  );
}
