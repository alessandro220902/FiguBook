import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { CookieBanner } from '@/components/CookieBanner'
import { initConsentedAnalytics } from '@/lib/consent'
import { setAfterFlushHook, subscribeMyAlbumIds } from '@/lib/db/albums'
import { syncIndexForAlbum } from '@/lib/db/trade'
import { subscribeProfile, touchLastSeen } from '@/lib/db/profile'
import { AppLayout } from '@/components/layout/AppLayout'
import Landing from '@/pages/Landing'
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
import Profilo from '@/pages/Profilo'
import ProfiloImpostazioni from '@/pages/ProfiloImpostazioni'
import ProfiloPubblico from '@/pages/ProfiloPubblico'
import ProfiloPubblicoAlbum from '@/pages/ProfiloPubblicoAlbum'
import Squadra from '@/pages/Squadra'

export default function App() {
  const { user } = useAuth()

  useEffect(() => {
    initConsentedAnalytics()
  }, [])

  // Ogni album che possiedi è scambiabile in automatico: pubblica l'indice di
  // tutti i tuoi album (backfill al cambio lista) e risincronizza ad ogni flush.
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    touchLastSeen(uid)   // segna l'ultimo accesso (throttled)
    // Città dal profilo PRIVATO (reattiva): la città di scambio nel tradeIndex
    // non dipende da profilo pubblico/privato, e resta fresca ad ogni flush.
    let citta = ''
    const unsubCitta = subscribeProfile(uid, (p) => { citta = p?.citta ?? '' })
    const unsub = subscribeMyAlbumIds(uid, ({ ids }) => {
      for (const albumId of ids) syncIndexForAlbum(uid, albumId, citta)
    })
    setAfterFlushHook((u, albumId) => { syncIndexForAlbum(u, albumId, citta) })
    return () => { unsub(); unsubCitta(); setAfterFlushHook(null) }
  }, [user])

  return (
    <>
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Landing />} />
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
        <Route path="/profilo" element={<Profilo />} />
        <Route path="/profilo/impostazioni" element={<ProfiloImpostazioni />} />
        <Route path="/u/:username" element={<ProfiloPubblico />} />
        <Route path="/u/:username/album/:albumId" element={<ProfiloPubblicoAlbum />} />
        <Route path="/squadra/:teamId" element={<Squadra />} />
      </Route>
    </Routes>
    <CookieBanner />
    </>
  )
}
