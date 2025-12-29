import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../lib/tauri";
import { useAuth } from "../../contexts/AuthContext";
import { invoke } from "@tauri-apps/api/core";
import { useNotification } from "../../contexts/NotificationContext";

import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import ChevronUpIcon from "../ui/icons/ChevronUpIcon";
import DeleteAccountModal from "../modals/DeleteAccountModal";
import ClearLocalAccountDataModal from "../modals/ClearLocalAccountDataModal";

export default function AccountTab() {
  const { t, i18n } = useTranslation();
  const { userEmail, userId, userName, userPicture, logout } = useAuth();
  const { addNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearLocalAccountDataModalOpen, setIsClearLocalAccountDataModalOpen] = useState(false);
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
    setIsClearLocalAccountDataModalOpen(true);
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
      
      setIsClearLocalAccountDataModalOpen(false);
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
    <div className="w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400 p-8 overflow-y-auto transition-colors">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t("account.title")}</h1>
      <p className="text-sm mb-2">
        {t("account.description")}
      </p>

      <div className="bg-gray-50 dark:bg-[#242425] rounded-xl p-5 mb-8 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-lg font-semibold overflow-hidden transition-colors">
            {userPicture ? (
              <img src={userPicture} alt={userName || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-600 dark:text-white">{userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>

          <div className="flex-1">
            <p className="text-base font-medium text-gray-900 dark:text-white">{userName || "User"}</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400">{userEmail}</p>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm  text-gray-700 dark:text-white"
          >
            {t("account.signOut")}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t("account.language.title")}
        </h3>
        <p className="text-sm mb-2">
          {t("account.language.description")}
        </p>

        <div className="relative w-fit">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center justify-between text-gray-900 dark:text-white bg-gray-50 dark:bg-[#242425] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 gap-3 text-sm focus:outline-none  hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <span>{currentLangLabel}</span>
            <div className="text-gray-400 dark:text-neutral-400">
              {isLanguageDropdownOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
            </div>
          </button>

          {isLanguageDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsLanguageDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 min-w-[180px] mt-2 bg-white dark:bg-[#242425] border border-gray-200 dark:border-white/10 overflow-hidden z-20 shadow-lg">
                <button
                  onClick={() => handleLanguageChange("pt-BR")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-white ${currentLang === 'pt-BR' ? 'bg-gray-100 dark:bg-white/5' : ''}`}
                >
                  Português (Brasil)
                </button>
                <button
                  onClick={() => handleLanguageChange("en-US")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-white ${currentLang === 'en-US' ? 'bg-gray-100 dark:bg-white/5' : ''}`}
                >
                  English (US)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t("account.dataManagement.title")}
        </h3>
        <p className="text-sm mb-4">
          {t("account.dataManagement.description")}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-[#242425] rounded-xl p-4 flex flex-col items-center transition-colors">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.sessions}</h3>
            <p className="text-xs">{t("account.dataManagement.sessions")}</p>
          </div>

          <div className="bg-gray-50 dark:bg-[#242425] rounded-xl p-4 flex flex-col items-center transition-colors">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.messages}</h3>
            <p className="text-xs">{t("account.dataManagement.messages")}</p>
          </div>

          <div className="bg-gray-50 dark:bg-[#242425] rounded-xl p-4 flex flex-col items-center transition-colors">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.active}</h3>
            <p className="text-xs">{t("account.dataManagement.active")}</p>
          </div>
        </div>

        <button 
          onClick={handleClearAllDataClick}
          disabled={isClearingData}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm  text-gray-700 dark:text-white ${isClearingData ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isClearingData ? "..." : t("account.dataManagement.clearAll")}
        </button>
      </div>

      <div className="pt-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t("account.deleteAccount.title")}</h3>
        <p className="text-sm mb-4">
          {t("account.deleteAccount.description")}
        </p>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-500/20 transition text-sm "
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
      
      <ClearLocalAccountDataModal
        isOpen={isClearLocalAccountDataModalOpen}
        onClose={() => setIsClearLocalAccountDataModalOpen(false)}
        onConfirm={confirmClearData}
        isLoading={isClearingData}
      />
    </div>
  );
}

