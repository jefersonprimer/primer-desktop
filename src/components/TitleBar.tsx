import { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from "../contexts/AuthContext";
import { useDockVisibility } from '../contexts/DockVisibilityContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useModals } from '../contexts/ModalContext';

import CloseIcon from './ui/icons/CloseIcon';
import SearchIcon from './ui/icons/SearchIcon';
import ChevronLeftIcon from './ui/icons/ChevronLeftIcon';
import ChevronRightIcon from './ui/icons/ChevronRightIcon';
import UserIcon from './ui/icons/UserIcon';

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
  </svg>
);

const RestoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
  >
    <rect x="6" y="6" width="12" height="12" rx="0.5" ry="0.5" />

    <rect x="3" y="9" width="12" height="12" rx="0.5" ry="0.5" />
  </svg>
);

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { isFocusMode } = useDockVisibility();
  const { canGoBack, canGoForward, goBack, goForward } = useNavigation();
  // Get the window instance
  const appWindow = getCurrentWindow();

  const { userEmail, userName, userPicture, isAuthenticated } = useAuth();
  const { openModal } = useModals();

  useEffect(() => {
    const updateState = async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch (e) {
        console.error("Failed to get window state", e);
      }
    };

    updateState();

    const unlisten = appWindow.onResized(async () => {
      try {
        setIsMaximized(await appWindow.isMaximized());
      } catch (e) {
        console.error("Failed to update window state on resize", e);
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (e) {
      console.error("Failed to minimize", e);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    } catch (e) {
      console.error("Failed to toggle maximize", e);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow.close();
    } catch (e) {
      console.error("Failed to close", e);
    }
  };

  // Hide TitleBar in focus mode (Ctrl+Shift+F)
  if (isFocusMode) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-12 flex items-center z-[9999] bg-gray-100/95 dark:bg-[#141414] px-4 backdrop-blur-md border-b border-gray-200 dark:border-transparent transition-colors duration-200">
      {/* Logo Area - Left */}
      {isAuthenticated && (
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-5 h-5 border-2 border-gray-400 dark:border-white/60 rounded-full select-none">
            <span className="text-gray-500 dark:text-white/60 font-bold text-xs">P</span>
          </div>

          {/* Navigation Chevrons */}
          <div className="flex items-center gap-1 z-50 drag-none" data-tauri-drag-region="false">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`p-1 rounded-xl transition-colors ${canGoBack
                  ? 'text-gray-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  : 'text-gray-300 dark:text-white/20 cursor-default'
                }`}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className={`p-1 rounded-xl transition-colors ${canGoForward
                  ? 'text-gray-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  : 'text-gray-300 dark:text-white/20 cursor-default'
                }`}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar - Center */}
      {isAuthenticated && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="flex items-center space-x-3 px-6 md:px-12 md:min-w-[320px] py-1.5 bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none rounded-full transition-all duration-200 justify-between pointer-events-auto cursor-text hover:bg-white/60 dark:hover:bg-white/10">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-white/50">
              <SearchIcon size={14} />
              <span className="text-xs font-medium hidden md:block">
                Search or Ask anything...
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px] text-gray-400 dark:text-white/30 font-sans border border-black/5 dark:border-white/5">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px] text-gray-400 dark:text-white/30 font-sans border border-black/5 dark:border-white/5">Shift</kbd>
              <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px] text-gray-400 dark:text-white/30 font-sans border border-black/5 dark:border-white/5">D</kbd>
            </div>
          </div>
        </div>
      )}

      {/* 
          Drag Region:
          It fills the space except for the buttons. 
          We use flex-grow to make it take up all available space between the logo and buttons.
      */}
      <div data-tauri-drag-region className="flex-grow h-full" />

      {/* 
          Buttons Area:
          No drag region here so clicks pass through to buttons easily.
      */}
      <div className="flex items-center gap-1">
        {/* Profile Menu */}
        {isAuthenticated && (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 mr-4 rounded-lg bg-gray-200 dark:bg-white/80 flex items-center justify-center text-sm font-semibold overflow-hidden transition-colors select-none hover:ring-2 hover:ring-black/5 dark:hover:ring-white/30"
            >
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName || "User"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon size={18} />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-[10000]"
                >
                  {/* User Info Header */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{userName || "User"}</p>
                        <p className="text-gray-500 dark:text-white/40 text-[11px] truncate tracking-wider font-medium">{userEmail || ""}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-black/5 dark:border-white/5 mx-2" />

                  {/* Menu Items */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowProfileMenu(false); openModal("settings", "API e Modelos"); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
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
                          <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Manage Models</span>
                    </button>

                    <button
                      onClick={() => { setShowProfileMenu(false); openModal("settings", "Billing"); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Billing</span>
                    </button>

                    <button
                      onClick={() => { setShowProfileMenu(false); openModal("settings", "Help Center"); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <path d="M12 17h.01" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Get Help</span>
                    </button>

                    <div className="my-1.5 border-t border-black/5 dark:border-white/5 mx-1.5" />

                    <button
                      onClick={() => { setShowProfileMenu(false); openModal("settings", "General"); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200 text-left group"
                    >
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={handleMinimize}
          className="pt-2 w-9 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md"
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-8 flex items-center justify-center hover:bg-red-500/80 text-gray-500 dark:text-white/70 hover:text-white transition-colors rounded-md"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}

