import { LegalPage, Section } from './LegalPage'

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="26 giugno 2026">
      <p>
        La presente informativa descrive come FiguBook tratta i dati personali degli utenti, ai
        sensi del Regolamento UE 2016/679 (GDPR). FiguBook è uno strumento per tracciare la propria
        collezione di figurine e scambiare doppioni con altri utenti.
      </p>

      <Section heading="Titolare del trattamento">
        <p>
          Il titolare del trattamento è [NOME E COGNOME], in qualità di persona fisica. Per qualsiasi
          richiesta relativa ai tuoi dati puoi scrivere a <b>[EMAIL_CONTATTO]</b>.
        </p>
      </Section>

      <Section heading="Quali dati raccogliamo">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><b>Dati di registrazione</b>: indirizzo email, nome utente, password (memorizzata in forma cifrata da Firebase, mai in chiaro).</li>
          <li><b>Dati del profilo</b>: eventuale città/zona e preferenze che decidi di aggiungere (facoltativi).</li>
          <li><b>Dati di utilizzo</b>: stato della tua collezione (figurine possedute, doppie), scambi avviati con altri utenti.</li>
          <li><b>Dati tecnici</b>: indirizzo IP, tipo di dispositivo e dati di navigazione raccolti per sicurezza e statistiche (vedi <a href="/cookie">Cookie Policy</a>).</li>
        </ul>
      </Section>

      <Section heading="Finalità e basi giuridiche">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><b>Gestione dell'account e del servizio</b> — base giuridica: esecuzione del contratto (art. 6.1.b GDPR).</li>
          <li><b>Funzione di scambio tra utenti</b> — base giuridica: esecuzione del contratto e legittimo interesse (art. 6.1.f).</li>
          <li><b>Sicurezza e prevenzione abusi</b> — base giuridica: legittimo interesse.</li>
          <li><b>Statistiche di utilizzo</b> — base giuridica: consenso (revocabile in qualsiasi momento).</li>
        </ul>
      </Section>

      <Section heading="Servizi terzi (responsabili del trattamento)">
        <p>
          Per funzionare, FiguBook si appoggia a servizi forniti da <b>Google Firebase</b>
          (autenticazione, database e invio email di verifica) e <b>Google Analytics</b> (statistiche).
          Questi servizi sono erogati da Google LLC e possono comportare il trasferimento di dati
          verso gli Stati Uniti, sulla base delle Clausole Contrattuali Standard approvate dalla
          Commissione Europea e del Data Privacy Framework UE-USA.
        </p>
      </Section>

      <Section heading="Minori">
        <p>
          FiguBook è destinato a utenti di almeno <b>14 anni</b>, età del consenso digitale in Italia.
          Registrandoti dichiari di avere almeno 14 anni. Se veniamo a conoscenza di un account
          intestato a un minore di 14 anni, lo rimuoviamo.
        </p>
      </Section>

      <Section heading="Conservazione dei dati">
        <p>
          Conserviamo i tuoi dati finché mantieni l'account attivo. Alla cancellazione dell'account
          i dati vengono eliminati entro un termine ragionevole, salvo obblighi di legge.
        </p>
      </Section>

      <Section heading="I tuoi diritti">
        <p>
          Hai diritto di accedere ai tuoi dati, rettificarli, cancellarli, limitarne il trattamento,
          opporti e richiederne la portabilità (artt. 15-22 GDPR). Per esercitarli scrivi a{' '}
          <b>[EMAIL_CONTATTO]</b>. Hai inoltre diritto di reclamo al Garante per la protezione dei
          dati personali (www.garanteprivacy.it).
        </p>
      </Section>

      <Section heading="Modifiche">
        <p>
          Possiamo aggiornare questa informativa. Le modifiche rilevanti saranno comunicate tramite
          l'app o via email.
        </p>
      </Section>

      <p className="border-t border-white/10 pt-6 text-[13px] text-muted-foreground">
        FiguBook non è affiliato a Panini S.p.A. né ad altri editori di figurine. È uno strumento
        indipendente di tracciamento e scambio tra collezionisti.
      </p>
    </LegalPage>
  )
}
