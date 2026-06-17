import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Eye, EyeOff, Check } from 'lucide-react'

import { auth, db, googleProvider } from '@/lib/firebase'
import { mapFirebaseError } from '@/lib/authErrors'
import { useAuth } from '@/hooks/useAuth'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { ButtonColorful } from '@/components/ui/button-colorful'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const SLOGANS = [
  ['Ce l’ho, ce l’ho, manca…', 'ma non per molto.'],
  ['La tua collezione,', 'sempre in tasca.'],
  ['Trova le doppie,', 'chiudi l’album.'],
  ['Ogni figurina', 'al posto giusto.'],
  ['Scambia con chi', 'ce l’ha davvero.'],
  ['Dalla bustina', 'all’album, in un tocco.'],
]

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [slogIdx, setSlogIdx] = useState(0)

  // login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginErr, setLoginErr] = useState('')

  // register fields
  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regTerms, setRegTerms] = useState(false)
  const [regErr, setRegErr] = useState('')

  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)

  // gia' autenticato -> dashboard
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [loading, user, navigate])

  // slogan rotante
  useEffect(() => {
    const t = setInterval(() => setSlogIdx((i) => (i + 1) % SLOGANS.length), 5000)
    return () => clearInterval(t)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErr('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setLoginErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegErr('')
    if (regPass !== regConfirm) {
      setRegErr('Le password non coincidono.')
      return
    }
    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPass)
      await updateProfile(cred.user, { displayName: regUser.trim() })
      await setDoc(
        doc(db, 'users', cred.user.uid, 'meta', 'profile'),
        { displayName: regUser.trim(), username: regUser.trim(), ts: Date.now() },
        { merge: true },
      )
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setRegErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle(setErr: (m: string) => void) {
    setErr('')
    setBusy(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const u = cred.user
      const name = u.displayName || (u.email || '').split('@')[0]
      await setDoc(
        doc(db, 'users', u.uid, 'meta', 'profile'),
        { displayName: name, username: name, ts: Date.now() },
        { merge: true },
      )
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  const confirmMatch = regConfirm.length > 0 && regPass === regConfirm

  return (
    <AuroraBackground className="min-h-screen px-4 py-10">
      <div className="relative z-10 w-full max-w-md">
        {/* brand + slogan */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Figu<span className="text-lime">Book</span>
          </h1>
          <div className="mt-2 h-10 text-muted-foreground">
            <AnimatePresence mode="wait">
              <motion.p
                key={slogIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-sm"
              >
                {SLOGANS[slogIdx][0]}{' '}
                <em className="not-italic text-lime">{SLOGANS[slogIdx][1]}</em>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* card */}
        <div className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="loginPass">Password</Label>
                  <div className="relative">
                    <Input
                      id="loginPass"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? 'Nascondi password' : 'Mostra password'}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {loginErr && <p className="text-sm text-destructive">{loginErr}</p>}

                <ButtonColorful type="submit" label="Accedi" disabled={busy} className="w-full" />
              </form>

              <Divider />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={busy}
                onClick={() => handleGoogle(setLoginErr)}
              >
                <GoogleIcon /> Continua con Google
              </Button>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="regUser">Username</Label>
                  <Input id="regUser" required value={regUser} onChange={(e) => setRegUser(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input
                    id="regEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="regPass">Password</Label>
                  <div className="relative">
                    <Input
                      id="regPass"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? 'Nascondi password' : 'Mostra password'}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="regConfirm">Conferma password</Label>
                  <div className="relative">
                    <Input
                      id="regConfirm"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      className={confirmMatch ? 'border-lime' : ''}
                    />
                    {confirmMatch && (
                      <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-lime" />
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={regTerms} onCheckedChange={(v) => setRegTerms(v === true)} />
                  Accetto i termini e le condizioni
                </label>

                {regErr && <p className="text-sm text-destructive">{regErr}</p>}

                <ButtonColorful
                  type="submit"
                  label="Crea account"
                  disabled={busy || !regTerms}
                  className="w-full disabled:opacity-50"
                />
              </form>

              <Divider />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={busy}
                onClick={() => handleGoogle(setRegErr)}
              >
                <GoogleIcon /> Continua con Google
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuroraBackground>
  )
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      oppure
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
