import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CookieBanner } from '@/components/CookieBanner'
import { initConsentedAnalytics } from '@/lib/consent'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import VerificaEmail from '@/pages/VerificaEmail'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import Termini from '@/pages/legal/Termini'
import CookiePolicy from '@/pages/legal/CookiePolicy'
import Home from '@/pages/Home'
import Album from '@/pages/Album'
import AlbumList from '@/pages/AlbumList'
import Scambi from '@/pages/Scambi'
import Community from '@/pages/Community'
import Cerca from '@/pages/Cerca'
import Notifiche from '@/pages/Notifiche'

export default function App() {
  useEffect(() => {
    initConsentedAnalytics()
  }, [])

  return (
    <>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verifica" element={<VerificaEmail />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/termini" element={<Termini />} />
      <Route path="/cookie" element={<CookiePolicy />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/album" element={<AlbumList />} />
        <Route path="/album/:albumId" element={<Album />} />
        <Route path="/scambi" element={<Scambi />} />
        <Route path="/community" element={<Community />} />
        <Route path="/cerca" element={<Cerca />} />
        <Route path="/notifiche" element={<Notifiche />} />
      </Route>
    </Routes>
    <CookieBanner />
    </>
  )
}
