import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'

// Handle Google OAuth redirect which comes as #access_token=...
// We need to transform it to #/auth/callback?access_token=... for HashRouter
if (window.location.hash.startsWith("#access_token=")) {
  const params = window.location.hash.substring(1); // remove #
  window.location.hash = `#/auth/callback?${params}`;
}

// Handle Notion OAuth redirect which comes as /oauth/notion/callback?code=...
// We need to transform it to #/oauth/notion/callback?code=... for HashRouter
if (window.location.pathname === "/oauth/notion/callback") {
  const search = window.location.search;
  window.location.replace(`/#/oauth/notion/callback${search}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
