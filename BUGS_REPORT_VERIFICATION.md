# Verifica 18 punti – Eternal Memory Bugs (PDF)

Riferimento: **Eternal memory bugs.pdf**. Stato di ogni punto dopo le correzioni applicate.  
I numeri seguono l’ordine del report (1–18).

---

## 1. Users are unable to leave tributes

**Stato:** ✅ Corretto (codice + DB).

- **Frontend:** `src/components/TributeSelector.tsx` — insert in `tributes`; in caso di errore mostra `getFriendlyErrorMessage(error, "tribute")`; rate limit 3/giorno gestito con messaggio dedicato; `console.error` per debug.
- **Backend:** migration `supabase/migrations/20260313120000_explicit_tribute_insert_policy.sql` — policy "Anyone can insert tributes with valid data" per `anon` e `authenticated` con `WITH CHECK (length(trim(sender_name)) > 0)`.
- **Se ancora fallisce:** verificare che le migration siano applicate, RLS su `tributes` e che l’edge function `notify-tribute` non blocchi (chiamata in fire-and-forget).

---

## 2. Guest can see "Create Memorial" but cannot create or save draft

**Stato:** ✅ Corretto.

- **Redirect se non loggato:**  
  - `src/components/Header.tsx`: `handleCreate` → `/auth?redirect=%2Fcreate`  
  - `src/components/Footer.tsx`: link Create Memorial → `createMemorialTo` = `/auth?redirect=%2Fcreate`  
  - `src/components/HeroSection.tsx`: "Start" con nome/cognome → `/auth?redirect=/create?first_name=...` (encodeURIComponent)
- **Route:** `src/App.tsx` — `/create` è wrappata in `<ProtectedRoute>`; dopo il login si torna alla URL in `redirect`.
- Create Memorial e salvataggio draft richiedono utente autenticato.

---

## 3. Unable to access protected memorial – password does not work

**Stato:** ✅ Corretto (backend + frontend).

- **Frontend:** `src/pages/MemorialDetail.tsx` — se `visibility === "password"` e `has_password`, mostra `PasswordGate`; `onUnlock` chiama RPC `verify_memorial_password(_memorial_id, _attempt)`; se `data === true` imposta `passwordUnlocked`.
- **Backend:** `supabase/migrations/20260313120100_fix_verify_memorial_password_bug3.sql` — funzione `verify_memorial_password` con supporto bcrypt (`crypt(_attempt, stored_hash)`) e plain-text; `search_path` include `extensions` per pgcrypto.
- **Nota:** in creazione/modifica memorial (visibility = password) la password può essere salvata in chiaro o in hash; la RPC gestisce entrambi i casi.

---

## 4. Stripe integration (PRD 3.4) not working

**Stato:** ✅ Corretto in codice; ⚙️ configurazione obbligatoria.

- **Edge function `create-checkout`:** fallback prices (Bug #4) quando `store_items` non ha righe o non c’è match; controllo `STRIPE_SECRET_KEY` con messaggio chiaro se mancante; lettura prezzi da `store_items` con fallback.
- **Edge function `create-plan-checkout`:** stesso controllo su `STRIPE_SECRET_KEY` con risposta 500 user-friendly.
- **Migration:** `supabase/migrations/20260313120200_seed_tribute_store_items_bug4.sql` — seed di Candle, Flowers, Eternal Candle in `store_items` (solo se non esistono già tribute items).
- **Configurazione:** impostare `STRIPE_SECRET_KEY` (e eventualmente altre variabili Stripe) nei secrets delle Edge Functions; verificare webhook e dominio Stripe.

---

## 5. Friendly error handling when there is no internet

**Stato:** ✅ Corretto.

- **Messaggio unico:** `src/lib/networkError.ts` — `FRIENDLY_NETWORK_MESSAGE` e `isNetworkError()`.
- **Utility:** `src/lib/utils.ts` — `getFriendlyErrorMessage(error, context)` usa prima `isNetworkError()`; contesti: `memorial_save`, `image_upload`, `payment`, `tribute`, `auth`, `report`, `export`, `password_reset`, `delete_account`.
- **Utilizzo:** Auth, UserSettings, B2BDashboard, StoreItemsTab, UsersTab, TributeSelector, MemorialDetail (report), ResetPassword, PricingPage, ecc.

---

## 6. Email-shared memorial link opens HTML page instead of web app

**Stato:** ✅ Corretto.

- **File:** `src/components/ShareButtons.tsx`.  
- **Email:** body del link usa `appUrl` = `window.location.origin + "/memorial/" + memorialId` (non l’URL OG).  
- **Social (Facebook/Twitter/WhatsApp):** continuano a usare `ogUrl` (edge function og-memorial) per l’anteprima.

---

## 7. Facebook share shares different content instead of memorial

**Stato:** ✅ Corretto.

- **File:** `src/components/ShareButtons.tsx`.  
- **ogUrl:** `${supabaseUrl}/functions/v1/og-memorial?id=${memorialId}`; `supabaseUrl` da `VITE_SUPABASE_URL` o `DEFAULT_SUPABASE_URL`.  
- I crawler aprono l’URL OG e ricevono l’HTML con meta tag del memorial.

---

## 8. Switching Human/Pet Memorials – missing progress bar / smooth navigation

**Stato:** ✅ Corretto.

- **File:** `src/components/RouteChangeProgress.tsx` — `NProgress.configure({ showSpinner: false, minimum: 0.15 })` così la barra è visibile anche su switch rapidi.
- **File:** `src/pages/Directory.tsx` — tab People/Pet sono `<Link to="...">` (React Router) con `onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })`, non `<a href>`, quindi navigazione SPA senza reload.

---

## 9. About Us does not open, stays on Home, not highlighted as active

**Stato:** ✅ Corretto.

- **Route:** `src/App.tsx` — `/about` → `<AboutUs />`.  
- **Header:** `src/components/Header.tsx` — `NAV_LINKS` include `{ to: "/about", label: "About Us" }`; `isActive(link.to)` (pathname === path) evidenzia il link; stesso per menu mobile.  
- **Pagina:** `src/pages/AboutUs.tsx` — renderizza `<AboutSection asPageTitle />` (h1 per outline).  
- **Footer:** link "About Us" con `scrollToTop`.

---

## 10. Failed to submit report

**Stato:** ✅ Corretto.

- **Frontend:** `src/pages/MemorialDetail.tsx` — `handleSubmitReport` chiama `supabase.functions.invoke("submit-report", { body: { memorial_id, reason, details } })`; errore mostrato con `getFriendlyErrorMessage(err, "report")`.  
- **Backend:** edge function `supabase/functions/submit-report/index.ts` — legge IP da `x-forwarded-for` / `x-real-ip`, inserisce in `memorial_reports` con `reporter_ip`.  
- **Deploy:** `supabase functions deploy submit-report`.

---

## 11. After banning a user, Admin page becomes blank

**Stato:** ✅ Corretto.

- **File:** `src/components/admin/UsersTab.tsx`.  
- Query `banned_users`: uso di `isError: bannedUsersError`; se errore si mostra "Unable to load banned users list" invece di lasciare la UI vuota/crash.  
- `onError` di updateRole e banMutation: `getFriendlyErrorMessage(err/e)`.  
- Impedito il ban di sé stessi: confronto `emailToBan === currentUser.email.toLowerCase()` prima di `banMutation.mutate`.  
- **File:** `src/pages/AdminPanel.tsx` — gestione `profilesError` con messaggio e pulsante Retry.

---

## 12. Bulleted and numbered lists not functional in biography

**Stato:** ✅ Corretto.

- **Editor:** `src/components/RichTextEditor.tsx` — classi prose: `[&_ul]:list-disc`, `[&_ul]:pl-6`, `[&_ol]:list-decimal`, `[&_ol]:pl-6`, `[&_li]:my-0.5`.  
- **Card/visualizzazione:** `src/components/MemorialCard.tsx` — stesse classi su bio (line-clamp) per elenchi.

---

## 13. Bold text in biography shows HTML tags instead of formatting

**Stato:** ✅ Corretto.

- **Stesso contesto del #12:** in RichTextEditor e MemorialCard (e `MemorialDetail` bio): `[&_strong]:font-bold`, `[&_b]:font-bold`, `[&_em]:italic`, `[&_i]:italic`.  
- Il bio è salvato come HTML (TipTap) e renderizzato con `dangerouslySetInnerHTML`, quindi non si vedono tag grezzi.

---

## 14. Clicking bottom links does not scroll page to top

**Stato:** ✅ Corretto.

- **File:** `src/components/ScrollToTop.tsx` — `history.scrollRestoration = "manual"`; su cambio `pathname`/hash scroll in `requestAnimationFrame` a `(0, 0)`; gestione hash per ancoraggio.  
- **Footer:** tutti i link hanno `onClick={scrollToTop}`.  
- **CookieConsentBanner:** link Cookie Policy con `onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}`.

---

## 15. Did not receive confirmation email and was able to log in without verifying

**Stato:** ✅ Parzialmente corretto (lato app); ⚙️ resto in Supabase.

- **Redirect dopo conferma:** `src/contexts/AuthContext.tsx` — signUp con `emailRedirectTo: origin/auth?confirmed=1`.  
- **Auth:** `src/pages/Auth.tsx` — se `confirmed=1` e `!user` mostra "Confirming your email..."; quando arriva `user` fa toast "Email confirmed" e `navigate(redirectTo)`.  
- **Email non ricevuta:** Supabase → Authentication → Email Templates e SMTP.  
- **Login senza verificare:** Supabase → Authentication → Providers → Email → abilitare **Confirm email** per richiedere la conferma prima del login.

---

## 16. "Export My Data" in settings not functional

**Stato:** ✅ Corretto (flusso + messaggi).

- **File:** `src/pages/UserSettings.tsx` — `handleExportData`: `supabase.functions.invoke("export-data", { headers: { Authorization } })`, poi download `my-data.json`; errori (invoke e `data?.error`) gestiti con `getFriendlyErrorMessage(error, "export")`.  
- In produzione serve la edge function **export-data** deployata e autorizzata.

---

## 17. Password reset link does not work – site unreachable

**Stato:** ✅ Corretto (codice); ⚙️ configurazione obbligatoria.

- **File:** `src/pages/Auth.tsx` — `resetPasswordForEmail(email, { redirectTo: origin + "/reset-password" })`; commento che ricorda di aggiungere l’URL in Supabase → Auth → URL Configuration → Redirect URLs.  
- **File:** `src/pages/ResetPassword.tsx` — lettura token da hash; se non ci sono token (`hasValidLink === false`) messaggio + link "Go to sign in"; errore submit con `getFriendlyErrorMessage(err, "password_reset")`.  
- **Configurazione:** in Supabase aggiungere `https://tuodominio.com/reset-password` (e `/auth` se serve) nelle Redirect URLs.

---

## 18. Admin unable to edit other users’ memorials

**Stato:** ✅ Corretto.

- **Route:** `src/App.tsx` — `/memorial/:id/edit` è wrappata in `<ProtectedRoute>` (solo loggati).  
- **File:** `src/pages/EditMemorial.tsx` — caricamento ruolo con `has_role` RPC; se `memorial.user_id !== user.id` ma `isAdminUser` (admin), la modifica è consentita e il submit fa update su `memorials`.  
- **RLS:** migration con policy "Admins can update all memorials" / "Admin full access on memorials" consentono UPDATE per admin.  
- **Admin Panel:** `src/components/admin/MemorialsTab.tsx` — pulsante Edit → `<Link to={/memorial/${m.id}/edit}>`.

---

## Riepilogo

| Categoria | Punti |
|-----------|--------|
| **Implementati in codice/repo** | 1, 2, 3, 4 (fallback + seed), 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 (redirect/UX), 16, 17 (redirect + messaggi), 18 |
| **Configurazione/ambiente ancora da verificare** | 4 (STRIPE_SECRET_KEY, webhook), 15 (SMTP, Confirm email), 17 (Redirect URLs in Supabase) |

- **Bug 4:** oltre alla config, nel repo ci sono già fallback prezzi, controllo chiave Stripe e seed `store_items`.  
- **Bug 15 e 17:** comportamento corretto in app; per email e link reset serve configurazione Supabase (SMTP, Confirm email, Redirect URLs).
