# Orar 1104A

Aplicație pentru iPhone cu orarul grupei 1104A (AIA, anul I, semestrul I 2026–2027) și notificări înainte de fiecare oră.

## Teme

Le schimbi din **Setări** (clopoțelul la v2, tab-ul Setări la celelalte):

| Temă | Cum arată |
|---|---|
| **Bilet** (v2) | bandă cu toate zilele semestrului, bilet mare pentru ora curentă, axă de timp |
| **Marker** (v4) | ecrane Azi / Săptămâna / Setări, listă cu sala „trasă cu markerul” |
| **Bilet + listă** (v2+v4) | ecranele din Marker, cu aspectul și biletul din Bilet |

Toate au mod luminos și întunecat, după setarea telefonului.

---

## Pasul 1: Pune aplicația online (GitHub Pages, ~5 min)

1. Intră pe github.com → **New repository**.
2. Nume `orar`, alege **Public** → Create.
3. **Add file → Upload files**, trage tot conținutul arhivei → **Commit**.
4. **Settings → Pages**: Branch `main`, folder `/ (root)` → **Save**.
5. După un minut: `https://numele-tau.github.io/orar/`.

## Pasul 2: Instalează pe iPhone

1. Deschide linkul în **Safari** → **Partajare** → **Adaugă pe ecranul principal**.
2. Deschide **Orar** de pe ecranul principal.
3. Setări → **Pornește notificările** → Permite.
4. Apasă **Copiază codul**.

## Pasul 3: Robotul care trimite notificările (Cloudflare, la minut, ~5 min)

Totul se face din site, fără terminal. Merge și de pe telefon, dar e mai comod de pe calculator.

1. Fă-ți cont gratuit pe **dash.cloudflare.com**.
2. **Workers & Pages** (sau Compute → Workers) → **Create** → **Start with Hello World** → numele `orar-1104a` → **Deploy**.
3. **Edit code**. Șterge tot ce e acolo, lipește tot conținutul fișierului `cloudflare/worker.js` din arhivă și apasă **Deploy**.
4. Mergi la robot → **Settings → Variables and Secrets → Add**:
   - Type: **Secret**
   - Name: `NOTIFY_CONFIG`
   - Value: codul copiat din aplicație
   - apoi **Deploy**.
5. **Settings → Triggers → Cron Triggers → Add**, scrie `* * * * *` (în fiecare minut) → **Add**.
6. **Test:** deschide în browser adresa robotului cu `/test` la final, de exemplu `https://orar-1104a.numele-tau.workers.dev/test`. În câteva secunde trebuie să-ți apară pe telefon „Notificările merg ✓”.

Dacă deschizi adresa robotului fără `/test`, vezi ce notificări mai urmează azi.

> Cloudflare spune că un Cron Trigger nou poate avea nevoie de până la 15 minute ca să pornească prima dată. Testul cu `/test` merge imediat.

Planul gratuit ajunge din belșug: permite 5 programări pe cont și 100.000 de cereri pe zi, iar robotul folosește ~1.440 pe zi.

### Alternativa: GitHub Actions (mai puțin precisă)

Dacă nu vrei cont de Cloudflare, poți pune același cod ca secret `NOTIFY_CONFIG` în repo-ul de GitHub:
1. Settings → Secrets and variables → Actions.
2. Creezi fișierul `.github/workflows/notify.yml`: Add file → Create new file, lipești conținutul din arhivă.

GitHub pornește însă job-urile cu întârzieri, deci notificările pot veni cu câteva minute mai târziu. **Nu le folosi pe amândouă**, că primești totul de două ori.

---

## Bine de știut

- **Ai schimbat setările** (minutele, rezumatele)? Apare un punct roșu pe Setări. Copiază din nou codul și înlocuiește secretul `NOTIFY_CONFIG` în Cloudflare.
- **Ai șters aplicația de pe ecranul principal?** Pornește din nou notificările și pune codul nou.
- **Concentrarea (Focus) de pe iPhone** poate ascunde notificările. Adaugă Orar la excepții.
- **Orar nou de la facultate?**
  1. Modifici `EVENTS` în `schedule.js`.
  2. Crești `VERSION` în `sw.js`.
  3. Pentru robot, regenerezi `cloudflare/worker.js` cu `sh tools/build.sh`, sau îmi spui mie, și îl lipești din nou în Cloudflare.

## Fișiere

| | |
|---|---|
| `index.html`, `app.js` | aplicația și cele 3 teme |
| `css/` | stilurile temelor (generate din `tools/`) |
| `schedule.js` | orarul, săptămânile pare/impare, vacanța, zilele libere |
| `sw.js`, `manifest.webmanifest`, `icons/` | instalare pe iPhone și mod offline |
| `cloudflare/worker.js` | robotul de notificări pentru Cloudflare (un singur fișier, de lipit) |
| `scripts/`, `.github/workflows/notify.yml` | varianta cu GitHub Actions |
| `tools/` | sursele CSS și scriptul care le regenerează |

Sursa orarului: `Orar_AC_2026-2027_sem_I_v04.xlsx`, foaia L-I-AIA, coloana 1104A.
