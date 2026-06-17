import { initializeApp } from 'firebase/app'
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

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
