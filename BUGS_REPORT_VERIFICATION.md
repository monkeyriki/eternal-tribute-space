# Verifica 18 punti – Eternal Memory Bugs (PDF)

Riferimento: `Eternal memory bugs.pdf`. Stato di ogni punto dopo le correzioni applicate.

---

## 1. Users are unable to leave tributes
**Stato:** Corretto (codice + DB).  
- Frontend: `TributeSelector` inserisce in `tributes` con messaggio user-friendly in caso di errore; rate limit 3/giorno gestito.  
- Backend: migration `20260313120000_explicit_tribute_insert_policy.sql` consente INSERT per anon/authenticated.  
- Se ancora fallisce: verificare RLS su `tributes` e che la edge function `notify-tribute` non blocchi (viene chiamata in fire-and-forget).

---

## 2. Guest can see "Create Memorial" but cannot create or save draft
**Stato:** Corretto.  
- Header, Footer, Hero: se non loggato, "Create Memorial" porta a `/auth?redirect=%2Fcreate` (o con query name).  
- Route `/create` è protetta con `ProtectedRoute`; dopo login si torna su Create.  
- Create Memorial e salvataggio draft richiedono utente autenticato.

---

## 3. Unable to access protected memorial – password does not work
**Stato:** Corretto lato backend.  
- `MemorialDetail` usa `PasswordGate` e RPC `verify_memorial_password`.  
- Migration `20260313120100_fix_verify_memorial_password_bug3.sql`: supporto bcrypt e plain-text.  
- In creazione/modifica memorial (visibility = password) verificare che la password venga salvata in hash (trigger o app) in modo coerente con `verify_memorial_password`.

---

## 4. Stripe integration (PRD 3.4) not working
**Stato:** Configurazione / ambiente.  
- Nessuna modifica codice per Stripe nel set di fix.  
- Controllare: variabili d’ambiente Stripe, webhook, abbonamenti B2B e pagamento tributi nel frontend (Stripe SDK, chiavi corrette).

---

## 5. Friendly error handling when there is no internet
**Stato:** Corretto.  
- `FRIENDLY_NETWORK_MESSAGE` in `networkError.ts`.  
- `getFriendlyErrorMessage()` in `utils.ts`: usa `isNetworkError()` e contesti (auth, export, tribute, payment, delete_account, ecc.).  
- Utilizzato in Auth, UserSettings, B2BDashboard, StoreItemsTab, UsersTab, TributeSelector, ecc.

---

## 6. Email-shared memorial link opens HTML page instead of web app
**Stato:** Corretto.  
- `ShareButtons`: link Email usa `appUrl` = `window.location.origin/memorial/${memorialId}` nel body della mail, non l’URL OG.  
- Facebook/Twitter/WhatsApp continuano a usare `ogUrl` (og-memorial) per l’anteprima.

---

## 7. Facebook share shares different content instead of memorial
**Stato:** Corretto.  
- `ShareButtons`: `ogUrl` punta all’edge function `og-memorial?id=...` (Supabase).  
- Fallback `DEFAULT_SUPABASE_URL` se `VITE_SUPABASE_URL` non è impostato.  
- I crawler aprono l’URL OG e ricevono HTML con meta tag del memorial.

---

## 8. Switching Human/Pet Memorials – missing progress bar / smooth navigation
**Stato:** Corretto.  
- `RouteChangeProgress`: NProgress con `minimum: 0.15`; barra visibile anche su switch rapidi.  
- `Directory`: tab People/Pet sono `<Link>` (React Router) con `onClick` scroll to top, non `<a href>`, quindi SPA senza reload.

---

## 9. About Us does not open, stays on Home, not highlighted as active
**Stato:** Corretto.  
- Route `/about` → `AboutUs` (con `AboutSection asPageTitle`).  
- `NAV_LINKS` in Header include `{ to: "/about", label: "About Us" }`; `isActive(link.to)` evidenzia quando `pathname === "/about"`.  
- Footer: link "About Us" con `scrollToTop`.

---

## 10. Failed to submit report
**Stato:** Corretto.  
- Invio report non più con insert diretto da client (che poteva fallire per IP).  
- Edge function `submit-report`: riceve `memorial_id`, `reason`, `details`; legge IP da header (`x-forwarded-for` / `x-real-ip`) e inserisce in `memorial_reports`.  
- `MemorialDetail`: `handleSubmitReport` chiama `supabase.functions.invoke("submit-report", { body: ... })`.  
- Deploy: `supabase functions deploy submit-report`.

---

## 11. After banning a user, Admin page becomes blank
**Stato:** Corretto.  
- `UsersTab`: query `banned_users` con `isError: bannedUsersError`; in caso di errore si mostra "Unable to load banned users list" invece di crash.  
- `onError` di ban/role mutation usa `getFriendlyErrorMessage(e)`.  
- Impedito il ban di sé stessi (confronto email).

---

## 12. Bulleted and numbered lists not functional in biography
**Stato:** Corretto.  
- `RichTextEditor`: classi prose per `ul`, `ol`, `li` (list-disc, list-decimal, pl-6, my-0.5).  
- `MemorialCard`: stesse classi su bio (line-clamp) per elenchi e grassetto/corsivo.

---

## 13. Bold text in biography shows HTML tags instead of formatting
**Stato:** Corretto.  
- Stesso contesto del #12: prose con `[&_strong]:font-bold`, `[&_b]:font-bold`, `[&_em]:italic`, `[&_i]:italic` in RichTextEditor e MemorialCard.  
- Il bio è renderizzato con `dangerouslySetInnerHTML`; il contenuto è HTML da TipTap, non markup grezzo.

---

## 14. Clicking bottom links does not scroll page to top
**Stato:** Corretto.  
- `ScrollToTop`: `history.scrollRestoration = "manual"`; su cambio route scroll in `requestAnimationFrame`.  
- Footer: tutti i link hanno `onClick={scrollToTop}`.  
- CookieConsentBanner: link Cookie Policy con `onClick` scroll to top.

---

## 15. Did not receive confirmation email and was able to log in without verifying
**Stato:** Parzialmente corretto lato app.  
- Redirect dopo conferma: `emailRedirectTo: origin/auth?confirmed=1` in signUp; pagina Auth mostra "Confirming..." e poi toast + redirect.  
- **Email non ricevuta:** dipende da Supabase (SMTP, Email Templates). Configurare in Supabase → Authentication → Email Templates e SMTP.  
- **Login senza verificare:** in Supabase → Authentication → Providers → Email: abilitare "Confirm email" se si vuole bloccare il login fino alla conferma (comportamento server-side).

---

## 16. "Export My Data" in settings not functional
**Stato:** Corretto (flusso + messaggi).  
- `UserSettings`: chiamata a `supabase.functions.invoke("export-data", { headers: { Authorization } })`, poi download `my-data.json`.  
- Errori gestiti con `getFriendlyErrorMessage(error, "export")`.  
- Per funzionare in produzione serve la edge function `export-data` deployata e autorizzata.

---

## 17. Password reset link does not work – site unreachable
**Stato:** Corretto lato codice; configurazione obbligatoria.  
- `Auth.tsx`: `resetPasswordForEmail` con `redirectTo: origin/reset-password`.  
- Commento in codice ricorda di aggiungere in Supabase → Auth → URL Configuration → Redirect URLs: `https://tuodominio.com/reset-password`.  
- `ResetPassword`: gestione hash da email, messaggio se link non valido/scaduto, `getFriendlyErrorMessage(err, "password_reset")`.

---

## 18. Admin unable to edit other users’ memorials
**Stato:** Corretto.  
- Route `/memorial/:id/edit` protetta con `ProtectedRoute` (solo utenti loggati).  
- `EditMemorial`: se `memorial.user_id !== user.id` ma `isAdminUser` (RPC `has_role` admin), la modifica è consentita e il submit va a buon fine.  
- RLS: policy "Admins can update all memorials" / "Admin full access on memorials" nelle migration consentono UPDATE per admin.  
- Admin Panel → Memorials: pulsante Edit porta a `/memorial/:id/edit`.

---

## Riepilogo
- **Implementati in codice/repo:** 1, 2, 3 (backend), 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 (redirect/UX), 16, 17 (redirect + messaggi), 18.  
- **Solo configurazione/ambiente:** 4 (Stripe), 15 (email confirm/Confirm email in Supabase), 17 (Redirect URLs in Supabase).
