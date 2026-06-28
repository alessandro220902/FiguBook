// Avatar preset: solo oggetti calcio illustrati (niente volti => niente
// problemi di IP/privacy). Ogni voce è il contenuto interno di un <svg>
// viewBox 0 0 100 100, sfondo incluso. Gli id dei gradienti vengono resi
// unici a runtime (uniquifyIds) per evitare collisioni quando più avatar
// stanno sulla stessa pagina (picker + intestazione).
export interface AvatarPreset {
  id: string
  label: string
  inner: string
}

export const AVATARS: AvatarPreset[] = [
  {
    id: 'pallone',
    label: 'Pallone',
    inner: `<defs><radialGradient id="pb" cx="42%" cy="35%" r="75%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d7ddcf"/></radialGradient><radialGradient id="pbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#pbg)"/><circle cx="50" cy="50" r="27" fill="url(#pb)"/><circle cx="50" cy="50" r="27" fill="none" stroke="#b9c0ad" stroke-width="1"/><path d="M50,37 L60,44.5 L56.2,56 L43.8,56 L40,44.5 Z" fill="#16210d"/><g stroke="#16210d" stroke-width="2" stroke-linecap="round"><path d="M50,37 L50,29"/><path d="M60,44.5 L67,41"/><path d="M56.2,56 L61,64"/><path d="M43.8,56 L39,64"/><path d="M40,44.5 L33,41"/></g><ellipse cx="42" cy="42" rx="7" ry="4" fill="#fff" opacity=".5"/>`,
  },
  {
    id: 'scarpino',
    label: 'Scarpino',
    inner: `<defs><radialGradient id="sbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#caf26a"/><stop offset="100%" stop-color="#8fc436"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#sbg)"/><path d="M22,44 C30,42 40,42 50,46 C60,50 70,52 76,56 C80,59 80,64 75,66 C71,68 64,68 58,68 L28,68 C24,68 21,65 21,60 L21,48 C21,46 21,44 22,44 Z" fill="url(#bt)"/><path d="M27,69 L75,67" stroke="#5f8a1f" stroke-width="2"/><g fill="#16210d"><circle cx="33" cy="72" r="2.6"/><circle cx="44" cy="73" r="2.6"/><circle cx="55" cy="73" r="2.6"/><circle cx="66" cy="72" r="2.6"/></g><g stroke="#16210d" stroke-width="2" stroke-linecap="round"><path d="M40,52 l5,-6"/><path d="M49,55 l5,-6"/><path d="M58,57 l5,-6"/></g><path d="M22,46 C30,45 38,45 46,47" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>`,
  },
  {
    id: 'guantoni',
    label: 'Guantoni',
    inner: `<defs><radialGradient id="gbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f4f7ef"/><stop offset="100%" stop-color="#cdd4c5"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#gbg)"/><path d="M32,74 L31,46 C31,40 38,39 39,45 L40,38 C40,32 47,32 47,38 L48,40 C48,34 55,34 55,40 L55,46 C61,43 67,48 64,57 L60,74 Z" fill="url(#gl)"/><path d="M39,46 L39,60 M47,42 L47,60 M55,46 L55,60" stroke="#9aa48c" stroke-width="1.6" stroke-linecap="round"/><path d="M31,66 L64,64" stroke="#b6e84f" stroke-width="4" stroke-linecap="round"/><path d="M33,70 L62,68" stroke="#9aa48c" stroke-width="1.4"/>`,
  },
  {
    id: 'scudetto',
    label: 'Scudetto',
    inner: `<defs><radialGradient id="dbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="shd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#caf26a"/><stop offset="100%" stop-color="#7fb52e"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#dbg)"/><path d="M50,22 L73,31 L73,52 C73,67 62,76 50,81 C38,76 27,67 27,52 L27,31 Z" fill="url(#shd)"/><path d="M50,30 L66,36 L66,52 C66,63 58,70 50,74 C42,70 34,63 34,52 L34,36 Z" fill="#142208"/><path d="M50,42 l2.6,5.4 6,0.6 -4.5,4 1.4,5.8 -5.5,-3.2 -5.5,3.2 1.4,-5.8 -4.5,-4 6,-0.6 Z" fill="#caf26a"/><path d="M50,22 L73,31 C66,30 56,28 50,28 Z" fill="#fff" opacity=".25"/>`,
  },
  {
    id: 'coppa',
    label: 'Coppa',
    inner: `<defs><radialGradient id="cbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe07a"/><stop offset="50%" stop-color="#f4c020"/><stop offset="100%" stop-color="#c8920e"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#cbg)"/><path d="M36,28 L64,28 L62,46 C62,55 56,60 50,60 C44,60 38,55 38,46 Z" fill="url(#gd)"/><path d="M36,31 C27,31 27,45 38,46" fill="none" stroke="#f4c020" stroke-width="4"/><path d="M64,31 C73,31 73,45 62,46" fill="none" stroke="#f4c020" stroke-width="4"/><rect x="46" y="59" width="8" height="9" fill="url(#gd)"/><path d="M38,68 L62,68 L66,76 L34,76 Z" fill="url(#gd)"/><rect x="40" y="76" width="20" height="4" rx="2" fill="#c8920e"/><path d="M44,30 L46,44 C46,50 48,53 50,54" stroke="#fff" stroke-width="2" opacity=".4" fill="none" stroke-linecap="round"/>`,
  },
  {
    id: 'fischietto',
    label: 'Fischietto',
    inner: `<defs><radialGradient id="fbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f4f7ef"/><stop offset="100%" stop-color="#c9d0c1"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#fbg)"/><path d="M30,46 L58,46 C69,46 74,52 74,58 C74,67 66,71 58,71 C49,71 44,64 44,58 L30,58 C26,58 25,55 25,51 C25,47 26,46 30,46 Z" fill="url(#fw)"/><circle cx="58" cy="58" r="5.5" fill="#16210d"/><circle cx="58" cy="58" r="2.4" fill="#3f5a28"/><path d="M30,46 C28,40 30,34 36,33" fill="none" stroke="#b6e84f" stroke-width="4" stroke-linecap="round"/><path d="M30,49 L42,49" stroke="#9aa48c" stroke-width="1.6"/>`,
  },
  {
    id: 'porta',
    label: 'Porta',
    inner: `<defs><radialGradient id="ggbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#ggbg)"/><g stroke="#3f5a28" stroke-width="1.3"><path d="M30,34 L30,68 M37,34 L37,68 M44,34 L44,68 M51,34 L51,68 M58,34 L58,68 M65,34 L65,68 M70,34 L70,68"/><path d="M26,42 L74,42 M26,50 L74,50 M26,58 L74,58"/></g><path d="M26,32 L74,32 L74,68 L26,68" fill="none" stroke="#e8ece0" stroke-width="4.5" stroke-linejoin="round"/><circle cx="62" cy="62" r="6.5" fill="#f4f7ef"/><path d="M58,60 L62,57 L66,60 L64.5,64 L59.5,64 Z" fill="#16210d"/>`,
  },
  {
    id: 'bandierina',
    label: 'Bandierina',
    inner: `<defs><radialGradient id="bbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1d2b11"/><stop offset="100%" stop-color="#0f1808"/></radialGradient><linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ff5a5a"/><stop offset="100%" stop-color="#e23b3b"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#bbg)"/><path d="M38,22 L38,74" stroke="#e8ece0" stroke-width="4.5" stroke-linecap="round"/><path d="M38,25 C50,28 62,30 72,28 C68,34 68,40 72,46 C62,44 50,46 38,49 Z" fill="url(#fl)"/><path d="M28,74 q10,-6 20,0" fill="none" stroke="#5f8a1f" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="22" r="3" fill="#caf26a"/>`,
  },
]

export function avatarById(id?: string | null): AvatarPreset | undefined {
  return id ? AVATARS.find((a) => a.id === id) : undefined
}

// Rende unici gli id dei gradienti dentro un blocco svg, così più istanze
// sulla stessa pagina non si "rubano" i gradienti (id duplicati).
export function uniquifyIds(inner: string, uid: string): string {
  return inner
    .replace(/id="([\w-]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#$1-${uid})`)
}
