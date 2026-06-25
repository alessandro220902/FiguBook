import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Album from '@/pages/Album'
import AlbumList from '@/pages/AlbumList'
import Scambi from '@/pages/Scambi'
import Community from '@/pages/Community'
import Cerca from '@/pages/Cerca'
import Notifiche from '@/pages/Notifiche'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/album" element={<AlbumList />} />
        <Route path="/album/:albumId" element={<Album />} />
        <Route path="/scambi" element={<Scambi />} />
        <Route path="/community" element={<Community />} />
        <Route path="/cerca" element={<Cerca />} />
        <Route path="/notifiche" element={<Notifiche />} />
      </Route>
    </Routes>
  )
}
