import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/hooks/useAuth'

// Rientro via fallback SPA (public/404.html): refresh/riapertura su una route
// profonda (es. /album). Per scelta UX si torna sempre alla home, non si
// ripristina la pagina precedente.
const _p = new URLSearchParams(location.search).get('p')
if (_p !== null) {
  history.replaceState(null, '', '/FiguBook/app/dashboard')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/FiguBook/app">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
