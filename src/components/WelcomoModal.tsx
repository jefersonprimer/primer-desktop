import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../lib/tauri";

const WelcomeModal: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageSelect = async (lang: string) => {
    await i18n.changeLanguage(lang);
    try {
      await setAppLanguage(lang);
    } catch (e) {
      console.error("Failed to save language preference:", e);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const isEnglish = i18n.language === 'en-US' || i18n.language === 'en';
  const isPortuguese = i18n.language === 'pt-BR' || i18n.language === 'pt';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
      <div className="bg-neutral-900 text-white w-[420px] p-8 rounded-xl shadow-xl border border-neutral-800">
        <div className="w-20 h-20 rounded-xl border border-neutral-700 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold">P</span>
        </div>

        <h1 className="text-2xl text-center font-semibold mb-2">
          {t("welcome.title")}
        </h1>

        <p className="text-center text-neutral-400 mb-8 leading-relaxed">
          {t("welcome.description")}
        </p>

        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => handleLanguageSelect('en-US')}
            className={`flex-1 py-3 rounded-lg border transition ${isEnglish ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'}`}
          >
            🇺🇸 English
          </button>

          <button 
            onClick={() => handleLanguageSelect('pt-BR')}
            className={`flex-1 py-3 rounded-lg border transition ${isPortuguese ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'}`}
          >
            🇧🇷 Português (Brasil)
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition"
        >
          {t("welcome.loginButton")}
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;

