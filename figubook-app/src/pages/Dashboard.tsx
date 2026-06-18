import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <main className="min-h-screen grid place-items-center gap-6">
      <h1 className="text-5xl font-bold text-lime">Dashboard</h1>
      <Button
        variant="outline"
        onClick={async () => {
          await signOut(auth)
          navigate('/login', { replace: true })
        }}
      >
        Esci
      </Button>
    </main>
  )
}
