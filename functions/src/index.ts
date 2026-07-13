import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { deleteAccountCascade } from './deleteAccountCascade.js'
export { nearbyCollectors } from './nearbyCollectors.js'

initializeApp()

export const deleteAccount = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto.')
  await deleteAccountCascade(getFirestore(), getAuth(), uid)
  return { ok: true }
})
