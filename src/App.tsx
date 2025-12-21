import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { StealthModeProvider } from "./contexts/StealthModeContext";
import { AiProvider } from "./contexts/AiContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationContainer from "./components/ui/NotificationContainer";
import AppRoutes from "./routes";
import StealthMirror from "./components/StealthMirror";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAppConfig } from "./lib/tauri";


function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const config = await getAppConfig();
        if (config.language) {
          await i18n.changeLanguage(config.language);
        }
      } catch (e) {
        console.error("Failed to load app config:", e);
      }
    };
    initLanguage();
  }, [i18n]);

  return (
    <AuthProvider>
      <StealthModeProvider>
        <AiProvider>
          <NotificationProvider>
            <HashRouter>
              <StealthMirror />
              <div className="w-full max-w-[1440px] mx-auto h-screen relative">
                <AppRoutes />
              </div>
              <NotificationContainer />
            </HashRouter>
          </NotificationProvider>
        </AiProvider>
      </StealthModeProvider>
    </AuthProvider>
  );
}

export default App;

