// functions/src/albo/pointValues.ts
// Valori punteggio Albo d'Oro. Tarabili senza toccare la logica.
export const PT = {
  albumComplete: 50,        // album al 100%
  milestone: 5,             // per soglia 25/50/75% superata
  albumStarted: 2,          // >=1 figurina in un album
  perSticker: 0.1,          // per figurina posseduta
  derbyBonusFactor: 0.5,    // extra sulle figurine della squadra del cuore
  tradeCompleted: 5,        // scambio completato con partner diverso
  newPartner: 3,            // primo scambio con un nuovo partner
  invite: 20,               // amico invitato iscritto
  friendship: 1,            // amicizia accettata
  activeDay: 1,             // giorno di attività
  profileComplete: 5,       // una tantum
} as const
