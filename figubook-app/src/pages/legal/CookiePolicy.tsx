import { LegalPage, Section } from './LegalPage'

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy" updated="26 giugno 2026">
      <p>
        Questa pagina spiega quali cookie e tecnologie simili utilizza FiguBook e a cosa servono.
      </p>

      <Section heading="Cookie tecnici (necessari)">
        <p>
          Indispensabili per far funzionare il servizio: mantengono la sessione di accesso e le tue
          preferenze. Vengono usati da <b>Google Firebase</b> per l'autenticazione. Non richiedono
          consenso e non possono essere disattivati senza compromettere l'uso dell'app.
        </p>
      </Section>

      <Section heading="Cookie statistici (analitici)">
        <p>
          Usiamo <b>Google Analytics</b> per capire come viene utilizzata l'app (pagine visitate,
          dispositivi) in forma aggregata. Questi cookie vengono installati <b>solo con il tuo
          consenso</b> e puoi revocarlo in qualsiasi momento dalle impostazioni. I dati possono
          essere trasferiti verso gli Stati Uniti (vedi <a href="/privacy">Privacy Policy</a>).
        </p>
      </Section>

      <Section heading="Cookie di profilazione / marketing">
        <p>FiguBook <b>non</b> utilizza cookie di profilazione pubblicitaria.</p>
      </Section>

      <Section heading="Gestione del consenso">
        <p>
          Al primo accesso ti chiediamo se accettare i cookie statistici. Puoi modificare la tua
          scelta in qualsiasi momento. Puoi inoltre gestire o eliminare i cookie dalle impostazioni
          del tuo browser.
        </p>
      </Section>

      <Section heading="Contatti">
        <p>Per domande sui cookie scrivi a <b>[EMAIL_CONTATTO]</b>.</p>
      </Section>
    </LegalPage>
  )
}
