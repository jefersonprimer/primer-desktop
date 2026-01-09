import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAppConfig } from "./lib/tauri";
import { HashRouter } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { StealthModeProvider } from "./contexts/StealthModeContext";
import { AiProvider } from "./contexts/AiContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CalendarPreviewProvider } from "./contexts/CalendarPreviewContext";
import { DockVisibilityProvider } from "./contexts/DockVisibilityContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { ModalProvider } from "./contexts/ModalContext";

import AppRoutes from "./routes";
import StealthMirror from "./components/StealthMirror";
import TitleBar from "./components/TitleBar";
import AppWrapper from "./components/AppWrapper";

import NotificationContainer from "./components/ui/NotificationContainer";
import EventCreatedToast from "./components/calendar/EventCreatedToast";
import { EventRemindersProvider } from "./components/calendar/EventRemindersProvider";
import SettingsModal from "./components/settings/SettingsModal";
import { useModals } from "./contexts/ModalContext";

function GlobalModals() {
  const { activeModal, settingsTab, closeModal } = useModals();

  return (
    <>
      <SettingsModal
        open={activeModal === "settings"}
        onClose={closeModal}
        initialTab={settingsTab}
      />
    </>
  );
}

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
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <CalendarPreviewProvider>
                <DockVisibilityProvider>
                  <EventRemindersProvider>
                    <ModalProvider>
                      <HashRouter>
                        <NavigationProvider>
                          <TitleBar />
                          <StealthMirror />
                          <AppWrapper>
                            <AppRoutes />
                          </AppWrapper>
                          <NotificationContainer />
                          <EventCreatedToast />
                          <GlobalModals />
                        </NavigationProvider>
                      </HashRouter>
                    </ModalProvider>
                  </EventRemindersProvider>
                </DockVisibilityProvider>
              </CalendarPreviewProvider>
            </ThemeProvider>
          </NotificationProvider>
        </AiProvider>
      </StealthModeProvider>
    </AuthProvider>
  );
}

export default App;
