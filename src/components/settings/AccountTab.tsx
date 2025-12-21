import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../lib/tauri";
import { useAuth } from "../../contexts/AuthContext";

export default function AccountTab() {
  const { t, i18n } = useTranslation();
  const { userEmail, logout } = useAuth();

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      await i18n.changeLanguage(lang);
      try {
          await setAppLanguage(lang);
      } catch (err) {
          console.error("Failed to save language preference:", err);
      }
  };
  
  const currentLang = (i18n.language === 'pt' || i18n.language === 'pt-BR') ? 'pt-BR' : 'en-US';

  return (
    <div className="w-full bg-[#1D1D1F] p-6 pb-8 text-white">
      {/* CONTA */}
      <h2 className="text-xl font-semibold mb-4">{t("account.title")}</h2>
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
        <h3 className="text-lg font-semibold mb-1">{t("account.language.title")}</h3>
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
      <div>
        <h3 className="text-lg font-semibold mb-1">{t("account.dataManagement.title")}</h3>
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

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm">
          {t("account.dataManagement.clearAll")}
        </button>
      </div>
    </div>
  );
}

