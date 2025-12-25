import { useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../lib/tauri";
import { useAuth } from "../../contexts/AuthContext";
import DeleteAccountModal from "./DeleteAccountModal";
import { invoke } from "@tauri-apps/api/core";
import { useNotification } from "../../contexts/NotificationContext";

import ChevronDownIcon from "../ui/icons/ChevronDownIcon";
import ChevronUpIcon from "../ui/icons/ChevronUpIcon";

export default function AccountTab() {
  const { t, i18n } = useTranslation();
  const { userEmail, userId, userName, userPicture, logout } = useAuth();
  const { addNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const handleLanguageChange = async (value: string) => {
      await i18n.changeLanguage(value);
      try {
          await setAppLanguage(value);
      } catch (err) {
          console.error("Failed to save language preference:", err);
      }
      setIsLanguageDropdownOpen(false);
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

        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="w-full flex items-center justify-between text-white bg-[#242425] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#242425] border border-white/10 rounded-xl overflow-hidden z-20 shadow-lg">
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
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.sessions")}</p>
          </div>

          <div className="bg-[#242425] rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">4</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.messages")}</p>
          </div>

          <div className="bg-[#242425] rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-neutral-400">{t("account.dataManagement.active")}</p>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer">
          {t("account.dataManagement.clearAll")}
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
    </div>
  );
}

