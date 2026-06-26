import { LegalPage, Section } from './LegalPage'

export default function Termini() {
  return (
    <LegalPage title="Termini di Servizio" updated="26 giugno 2026">
      <p>
        Utilizzando FiguBook accetti i presenti Termini di Servizio. Se non li accetti, non puoi
        usare il servizio.
      </p>

      <Section heading="Cos'è FiguBook">
        <p>
          FiguBook è uno strumento gratuito che consente di tracciare la propria collezione di
          figurine e di entrare in contatto con altri utenti per scambiare i doppioni. FiguBook è un
          progetto <b>indipendente</b> e <b>non è affiliato, sponsorizzato o approvato da Panini
          S.p.A.</b> o da altri editori di figurine. I nomi e i marchi citati appartengono ai
          rispettivi proprietari.
        </p>
      </Section>

      <Section heading="Account">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Devi avere almeno <b>14 anni</b> per registrarti.</li>
          <li>Sei responsabile della riservatezza delle tue credenziali e di ogni attività svolta dal tuo account.</li>
          <li>Devi fornire informazioni veritiere e mantenere aggiornato il tuo indirizzo email.</li>
        </ul>
      </Section>

      <Section heading="Scambi tra utenti">
        <p>
          FiguBook mette in contatto gli utenti ma <b>non è parte</b> degli scambi. Ogni accordo,
          spedizione, pagamento o controversia avviene <b>esclusivamente tra gli utenti coinvolti</b>.
          FiguBook non garantisce l'esito degli scambi e non è responsabile di figurine non ricevute,
          danneggiate o non conformi. Ti invitiamo a usare buon senso e cautela negli scambi,
          soprattutto se sei minorenne.
        </p>
      </Section>

      <Section heading="Comportamento degli utenti">
        <p>Usando FiguBook ti impegni a non:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>pubblicare contenuti offensivi, illegali, ingannevoli o lesivi di diritti altrui;</li>
          <li>molestare, truffare o danneggiare altri utenti;</li>
          <li>usare il servizio per scopi commerciali non autorizzati o fraudolenti;</li>
          <li>tentare di compromettere la sicurezza o il funzionamento della piattaforma.</li>
        </ul>
      </Section>

      <Section heading="Sospensione e chiusura">
        <p>
          Possiamo sospendere o chiudere un account che violi questi termini o la legge, anche senza
          preavviso. Puoi cancellare il tuo account in qualsiasi momento.
        </p>
      </Section>

      <Section heading="Limitazione di responsabilità">
        <p>
          FiguBook è fornito "così com'è", senza garanzie di disponibilità continua o assenza di
          errori. Nei limiti consentiti dalla legge, non siamo responsabili per danni derivanti
          dall'uso o dall'impossibilità di usare il servizio, né per gli scambi tra utenti.
        </p>
      </Section>

      <Section heading="Modifiche">
        <p>
          Possiamo aggiornare questi termini. L'uso continuato del servizio dopo le modifiche ne
          costituisce accettazione.
        </p>
      </Section>

      <Section heading="Contatti">
        <p>Per qualsiasi domanda scrivi a <b>figubook@outlook.com</b>.</p>
      </Section>
    </LegalPage>
  )
}
