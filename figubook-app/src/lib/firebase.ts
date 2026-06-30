import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Stessa config del sito vecchio (firebase-init.js). Progetto Firestore invariato.
const firebaseConfig = {
  apiKey: 'AIzaSyBdalsaKEhbwYEFLXXXfCJfe--R2kNTqmQ',
  authDomain: 'figubook.firebaseapp.com',
  projectId: 'figubook',
  storageBucket: 'figubook.firebasestorage.app',
  messagingSenderId: '965305828400',
  appId: '1:965305828400:web:11415617115f66b45119f5',
  measurementId: 'G-J6H0D7GHM7',
}

export const app = initializeApp(firebaseConfig)

// App Check (reCAPTCHA v3): attesta che le richieste arrivino dalla nostra app.
// Site key pubblica per design (sta nell'HTML client, non è un segreto).
// In dev abilita un debug token (registralo in Console → App Check → Debug tokens).
if (import.meta.env.DEV) {
  // @ts-expect-error proprietà non tipizzata usata dal SDK App Check in locale
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
}
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lf4NT4tAAAAAGjEPZV-DuHzKJfIjrQmIOWKk_J6'),
  isTokenAutoRefreshEnabled: true,
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Uid dell'utente corrente o errore: nessuna chiamata dati con utente null (fix B4).
export function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Utente non autenticato')
  return uid
}
