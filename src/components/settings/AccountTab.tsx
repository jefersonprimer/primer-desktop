import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../lib/tauri";
import { useAuth } from "../../contexts/AuthContext";
import DeleteAccountModal from "./DeleteAccountModal";
import { invoke } from "@tauri-apps/api/core";
import { useNotification } from "../../contexts/NotificationContext";
import { createPortal } from "react-dom";

import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import ChevronUpIcon from "../ui/icons/ChevronUpIcon";

export default function AccountTab() {
  const { t, i18n } = useTranslation();
  const { userEmail, userId, userName, userPicture, logout } = useAuth();
  const { addNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [stats, setStats] = useState({ sessions: 0, messages: 0, active: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await invoke<{ sessions: number, messages: number, active: number }>("get_user_stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const handleLanguageChange = async (value: string) => {
      await i18n.changeLanguage(value);
      try {
          await setAppLanguage(value);
      } catch (err) {
          console.error("Failed to save language preference:", err);
      }
      setIsLanguageDropdownOpen(false);
  };

  const handleClearAllDataClick = () => {
    if (!userId || isClearingData) return;
    setIsClearDataModalOpen(true);
  };

  const confirmClearData = async () => {
    if (!userId) return;
    
    setIsClearingData(true);
    try {
      await invoke("clear_all_data", {
        dto: {
          user_id: userId,
        },
      });
      
      addNotification({
        type: 'success',
        message: t("account.dataManagement.successClear")
      });
      
      setIsClearDataModalOpen(false);
      logout();

    } catch (error) {
      console.error("Failed to clear data:", error);
      addNotification({
        type: 'error',
        message: t("account.dataManagement.errorClear")
      });
    } finally {
      setIsClearingData(false);
    }
  };
  
  const handleDeleteAccount = async (password: string) => {
    if (!userId) return;
    
    setIsDeleting(true);
    try {
      await invoke("delete_account", {
        dto: {
          user_id: userId,
          password: password,
        },
      });
      
      addNotification({
        type: 'success',
        message: t("account.deleteAccount.success")
      });
      
      setIsDeleteModalOpen(false);
      logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      addNotification({
        type: 'error',
        message: t("account.deleteAccount.error")
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const currentLang = (i18n.language === 'pt' || i18n.language === 'pt-BR') ? 'pt-BR' : 'en-US';
  const currentLangLabel = currentLang === 'pt-BR' ? 'Português (Brasil)' : 'English (US)';

  return (
    <div className="w-full h-full bg-[#1D1D1F] p-8 pb-8 text-white overflow-y-auto">
      {/* CONTA */}
      <h2 className="text-base font-semibold">{t("account.title")}</h2>
      <p className="text-sm text-neutral-400 mb-4">
        {t("account.description")}
      </p>

      <div className="bg-[#242425] rounded-xl p-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold overflow-hidden">
            {userPicture ? (
              <img src={userPicture} alt={userName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span>{userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>

          <div className="flex-1">
            <p className="text-base font-medium">{userName || "User"}</p>
            <p className="text-sm text-neutral-400">{userEmail}</p>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer"
          >
            {t("account.signOut")}
          </button>
        </div>
      </div>

      {/* IDIOMA */}
      <div className="mb-6">
        <h3 className="text-base font-semibold">{t("account.language.title")}</h3>
        <p className="text-sm text-neutral-400 mb-2">
          {t("account.language.description")}
        </p>

        <div className="relative w-fit">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center justify-between text-white bg-[#242425] border border-white/10 rounded-xl px-4 py-3 gap-4 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
          >
            <span>{currentLangLabel}</span>
            <div className="text-neutral-400">
              {isLanguageDropdownOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
            </div>
          </button>

          {isLanguageDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsLanguageDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 min-w-[180px] mt-2 bg-[#242425] border border-white/10 overflow-hidden z-20 shadow-lg">
                <button
                  onClick={() => handleLanguageChange("pt-BR")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${currentLang === 'pt-BR' ? 'bg-white/5' : ''}`}
                >
                  Português (Brasil)
                </button>
                <button
                  onClick={() => handleLanguageChange("en-US")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${currentLang === 'en-US' ? 'bg-white/5' : ''}`}
                >
                  English (US)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* GERENCIAMENTO DE DADOS */}
      <div className="mb-8">
        <h3 className="text-base font-semibold">{t("account.dataManagement.title")}</h3>
        <p className="text-sm text-neutral-400 mb-4">
          {t("account.dataManagement.description")}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-[#242425] rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">{stats.sessions}</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.sessions")}</p>
          </div>

          <div className="bg-[#242425] rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">{stats.messages}</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.messages")}</p>
          </div>

          <div className="bg-[#242425] rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">{stats.active}</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.active")}</p>
          </div>
        </div>

        <button 
          onClick={handleClearAllDataClick}
          disabled={isClearingData}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer ${isClearingData ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isClearingData ? "..." : t("account.dataManagement.clearAll")}
        </button>
      </div>

      {/* DELETE ACCOUNT */}
      <div className="pt-4">
        <h3 className="text-base font-semibold text-white">{t("account.deleteAccount.title")}</h3>
        <p className="text-sm text-neutral-400 mb-4">
          {t("account.deleteAccount.description")}
        </p>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-900 rounded-xl text-white hover:bg-red-500/20 transition text-sm cursor-pointer"
        >
          {t("account.deleteAccount.button")}
        </button>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
      
      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={confirmClearData}
        isLoading={isClearingData}
      />
    </div>
  );
}

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

function ClearDataModal({ isOpen, onClose, onConfirm, isLoading }: ClearDataModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1D1D1F] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-2">
           {t("account.dataManagement.clearAll")}
        </h2>
        <p className="text-sm text-gray-300 mb-6">
          {t("account.dataManagement.confirmClear")}
        </p>

        <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition font-medium cursor-pointer"
              disabled={isLoading}
            >
              {t("account.deleteAccount.cancelButton")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition font-medium flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {t("account.dataManagement.clearAll")}
            </button>
          </div>
      </div>
    </div>,
    document.body
  );
}

