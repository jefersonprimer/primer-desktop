import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { StealthModeProvider } from "./contexts/StealthModeContext";
import { AiProvider } from "./contexts/AiContext";
import AppRoutes from "./routes";
import StealthMirror from "./components/StealthMirror";


function App() {
  return (
    <AuthProvider>
      <StealthModeProvider>
        <AiProvider>
          <HashRouter>
            <StealthMirror />
            <div className="w-full max-w-[1440px] mx-auto h-screen relative">
              <AppRoutes />
            </div>

          </HashRouter>
        </AiProvider>
      </StealthModeProvider>
    </AuthProvider>
  );
}

export default App;

