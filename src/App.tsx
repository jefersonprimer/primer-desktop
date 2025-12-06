import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes";

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="w-full max-w-[1440px] mx-auto h-screen relative">
          <AppRoutes />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

