import { useState } from "react";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../lib/tauri";
import { useAuth } from "../../contexts/AuthContext";
import DeleteAccountModal from "./DeleteAccountModal";
import { invoke } from "@tauri-apps/api/core";
import { useNotification } from "../../contexts/NotificationContext";

export default function AccountTab() {
  const { t, i18n } = useTranslation();
  const { userEmail, userId, logout } = useAuth();
  const { addNotification } = useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      await i18n.changeLanguage(lang);
      try {
          await setAppLanguage(lang);
      } catch (err) {
          console.error("Failed to save language preference:", err);
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

  return (
    <div className="w-full h-full bg-[#1D1D1F] p-6 pb-8 text-white overflow-y-auto">
      {/* CONTA */}
      <h2 className="text-base font-semibold">{t("account.title")}</h2>
      <p className="text-sm text-gray-300 mb-4">
        {t("account.description")}
      </p>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-semibold">
            {userEmail?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="flex-1">
            <p className="text-base font-medium">{userEmail || "User"}</p>
            <p className="text-sm text-gray-300">Plano Gratuito</p>
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
        <p className="text-sm text-gray-300 mb-2">
          {t("account.language.description")}
        </p>

        <select
          value={currentLang}
          onChange={handleLanguageChange}
          className="w-full text-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>

      {/* GERENCIAMENTO DE DADOS */}
      <div className="mb-8">
        <h3 className="text-base font-semibold">{t("account.dataManagement.title")}</h3>
        <p className="text-sm text-gray-300 mb-4">
          {t("account.dataManagement.description")}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-gray-300">{t("account.dataManagement.sessions")}</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">4</p>
            <p className="text-xs text-gray-300">{t("account.dataManagement.messages")}</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-gray-300">{t("account.dataManagement.active")}</p>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer">
          {t("account.dataManagement.clearAll")}
        </button>
      </div>

      {/* DELETE ACCOUNT */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-base font-semibold text-red-500">{t("account.deleteAccount.title")}</h3>
        <p className="text-sm text-gray-300 mb-4">
          {t("account.deleteAccount.description")}
        </p>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition text-sm cursor-pointer"
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

