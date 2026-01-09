import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { To } from 'react-router-dom';

interface NavigationContextType {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  push: (to: To) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // We use a custom stack because browser history API doesn't expose future stack
  // and we want precise control over the UI buttons.
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(location.pathname + location.search);

  // Sync current path on mount (in case of refresh)
  useEffect(() => {
    const path = location.pathname + location.search;
    if (currentPath !== path) {
        // If external change (like redirect), we might want to just reset or append?
        // For simplicity, if the path changes and it wasn't via our push/back/forward,
        // we assume it's a new entry if it's different.
        // But handling external navigation (like browser back button) is tricky to sync with custom stack.
        // Since this is a custom TitleBar app, users mostly use our buttons.
        // We will trust our internal methods primarily.
    }
  }, [location]);

  const push = (to: To) => {
    const path = typeof to === 'string' ? to : (to.pathname + (to.search || ''));
    
    // Don't push if same path
    if (path === currentPath) return;

    setPast(prev => [...prev, currentPath]);
    setFuture([]); // Clear future on new push
    setCurrentPath(path);
    navigate(to);
  };

  const goBack = () => {
    if (past.length === 0) return;

    const newPast = [...past];
    const previous = newPast.pop();
    
    if (previous) {
      setFuture(prev => [currentPath, ...prev]);
      setPast(newPast);
      setCurrentPath(previous);
      navigate(previous);
    }
  };

  const goForward = () => {
    if (future.length === 0) return;

    const newFuture = [...future];
    const next = newFuture.shift();

    if (next) {
      setPast(prev => [...prev, currentPath]);
      setFuture(newFuture);
      setCurrentPath(next);
      navigate(next);
    }
  };

  return (
    <NavigationContext.Provider value={{
      canGoBack: past.length > 0,
      canGoForward: future.length > 0,
      goBack,
      goForward,
      push
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
