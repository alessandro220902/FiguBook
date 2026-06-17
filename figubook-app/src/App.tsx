import { Routes, Route, Navigate } from 'react-router-dom'
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/album" element={<Album />} />
      <Route path="/scambi" element={<Scambi />} />
      <Route path="/community" element={<Community />} />
    </Routes>
  )
}
