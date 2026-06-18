import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Album from '@/pages/Album'
import Scambi from '@/pages/Scambi'
import Community from '@/pages/Community'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/album" element={<ProtectedRoute><Album /></ProtectedRoute>} />
      <Route path="/scambi" element={<ProtectedRoute><Scambi /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
    </Routes>
  )
}
