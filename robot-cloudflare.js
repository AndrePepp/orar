// Orar 1104A — robot de notificări pentru Cloudflare Workers.
// Fișier generat din schedule.js + scripts/webpush.js + tools/cf-worker.src.js. Lipește-l întreg în editorul Cloudflare.

// Orar 1104A — AIA anul I, semestrul I 2026-2027
// Sursa: Orar_AC_2026-2027_sem_I_v04.xlsx, foaia L-I-AIA, coloana I (1104A)
// + cursurile comune ale seriei (C:L), cu durata dată de celulele îmbinate.
// Fișierul e folosit și de PWA, și de serverul de notificări (worker/src/schedule.js e o copie).

const GROUP = '1104A';
const TZ = 'Europe/Bucharest';

const SUBJECTS = {
  CM1:  { name: 'Complemente de matematică I', color: '#8b5cf6' },
  AM:   { name: 'Analiză matematică', color: '#3b82f6' },
  ALGA: { name: 'Algebră liniară și geometrie analitică', color: '#06b6d4' },
  BFC:  { name: 'Bazele funcționării calculatoarelor', color: '#f59e0b' },
  PC1:  { name: 'Programarea calculatoarelor I', color: '#10b981' },
  Fiz:  { name: 'Fizică', color: '#ef4444' },
  SP1:  { name: 'Sport I', color: '#ec4899' },
};

const TYPES = { C: 'Curs', S: 'Seminar', L: 'Laborator', P: 'Proiect', SP: 'Sport' };
const PERIODICITY = { s: 'săptămânal', p: 'săptămâni pare', i: 'săptămâni impare' };

// day: 1 = Luni … 5 = Vineri
const EVENTS = [
  { day: 1, start: '08:00', end: '10:00', code: 'CM1',  type: 'C', per: 's', prof: 'lect. dr. G. Grosu',     room: 'T4' },
  { day: 1, start: '10:00', end: '12:00', code: 'AM',   type: 'C', per: 's', prof: 'lect. dr. G. Grosu',     room: 'T4' },
  { day: 1, start: '14:00', end: '16:00', code: 'Fiz',  type: 'S', per: 'p', prof: 'conf. dr. B. Ciobanu',   room: 'AC2-2' },

  { day: 2, start: '12:00', end: '14:00', code: 'SP1',  type: 'SP', per: 's', prof: 'asoc. dr. A. Ursaru',   room: 'Sport2' },
  { day: 2, start: '14:00', end: '16:00', code: 'BFC',  type: 'C', per: 's', prof: 'ș.l. dr. A. Ioan',       room: 'T4' },
  { day: 2, start: '16:00', end: '18:00', code: 'ALGA', type: 'C', per: 's', prof: 'prof. dr. D. Fetcu',     room: 'T4' },

  { day: 3, start: '10:00', end: '12:00', code: 'BFC',  type: 'L', per: 's', prof: 'ș.l. dr. A. Ioan',       room: 'A2-7' },
  { day: 3, start: '12:00', end: '14:00', code: 'Fiz',  type: 'L', per: 's', prof: 'ș.l. dr. T. Coman',      room: 'T-Et4-L1' },
  { day: 3, start: '14:00', end: '17:00', code: 'PC1',  type: 'L', per: 's', prof: 'asist. dr. A. Botezatu', room: 'A1-13' },

  { day: 4, start: '08:00', end: '11:00', code: 'AM',   type: 'S', per: 's', prof: 'lect. dr. G. Grosu',     room: 'AC3-3' },
  { day: 4, start: '11:00', end: '14:00', code: 'ALGA', type: 'S', per: 's', prof: 'lect. dr. G. Crețu',     room: 'AC0-3' },
  { day: 4, start: '14:00', end: '16:00', code: 'PC1',  type: 'C', per: 's', prof: 'asoc. dr. B. Burlacu',   room: 'T4' },

  { day: 5, start: '08:00', end: '10:00', code: 'Fiz',  type: 'C', per: 's', prof: 'conf. dr. B. Ciobanu',   room: 'T4' },
].map((e, i) => ({ ...e, id: `e${i}`, name: SUBJECTS[e.code].name, color: SUBJECTS[e.code].color }));

// Structura semestrului I 2026-2027 (TUIASI):
// 28.09–18.12.2026 activitate (săpt. 1–12), 19.12–03.01 vacanță, 04.01–15.01.2027 activitate (săpt. 13–14)
const TEACHING_BLOCKS = [
  { start: '2026-09-28', weeks: 12, first: 1 },
  { start: '2027-01-04', weeks: 2, first: 13 },
];
// Zile libere legale care cad în zile de curs
const HOLIDAYS = {
  '2026-11-30': 'Sfântul Andrei',
  '2026-12-01': 'Ziua Națională',
  '2027-01-06': 'Boboteaza',
  '2027-01-07': 'Sfântul Ioan',
};
const SEMESTER_START = '2026-09-28';
const SEMESTER_END = '2027-01-15';

// ---- utilitare pe date "YYYY-MM-DD" (fără fus orar, fără probleme de DST) ----
const toUTC = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (ymd, n) => fromUTC(toUTC(ymd) + n * 86400000);
const dayOfWeek = (ymd) => { const d = new Date(toUTC(ymd)).getUTCDay(); return d === 0 ? 7 : d; }; // 1=Luni … 7=Duminică
const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
const mondayOf = (ymd) => addDays(ymd, 1 - dayOfWeek(ymd));
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

function localYMD(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Ora curentă în Europe/Bucharest: { ymd, min } — folosit de server. */
function bucharestNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  return { ymd: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Numărul săptămânii didactice (1–14) sau null dacă data e în vacanță / în afara semestrului. */
function weekNumber(ymd) {
  for (const b of TEACHING_BLOCKS) {
    const d = diffDays(b.start, ymd);
    if (d >= 0 && d < b.weeks * 7) return b.first + Math.floor(d / 7);
  }
  return null;
}

const isEven = (week) => week % 2 === 0;

/** Activitățile dintr-o zi anume, ținând cont de săptămâna pară/impară, vacanțe și sărbători. */
function eventsForDate(ymd) {
  const week = weekNumber(ymd);
  if (!week || HOLIDAYS[ymd]) return [];
  const dow = dayOfWeek(ymd);
  return EVENTS
    .filter((e) => e.day === dow)
    .filter((e) => e.per === 's' || (e.per === 'p' && isEven(week)) || (e.per === 'i' && !isEven(week)))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

/** Descrie ce fel de zi e (pentru mesaje în interfață). */
function dayStatus(ymd) {
  if (HOLIDAYS[ymd]) return { kind: 'holiday', label: HOLIDAYS[ymd] };
  if (diffDays(ymd, SEMESTER_START) > 0) return { kind: 'before', label: 'Semestrul începe luni, 28 septembrie' };
  if (diffDays(SEMESTER_END, ymd) > 0) return { kind: 'after', label: 'Activitatea didactică s-a încheiat' };
  if (!weekNumber(ymd)) return { kind: 'vacation', label: 'Vacanța de Crăciun' };
  if (dayOfWeek(ymd) > 5) return { kind: 'weekend', label: 'Weekend' };
  return { kind: 'normal' };
}

/** Următoarea zi (inclusiv azi) care are ore. */
function nextClassDay(fromYmd, maxDays = 120) {
  for (let i = 0; i < maxDays; i++) {
    const d = addDays(fromYmd, i);
    if (eventsForDate(d).length) return d;
  }
  return null;
}

const typeLabel = (e) => TYPES[e.type] || e.type;

// ---- export calendar (.ics) cu alarme ----
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Bucharest',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0300', 'TZNAME:EEST', 'DTSTART:19700329T030000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0300', 'TZOFFSETTO:+0200', 'TZNAME:EET', 'DTSTART:19701025T040000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fold = (line) => { // RFC 5545: max 75 octeți pe linie
  const out = []; let cur = ''; let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 73) { out.push(cur); cur = ' '; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
};

function buildICS(alarmMinutes = 15) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Orar 1104A//RO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:Orar ${GROUP}`, 'X-WR-TIMEZONE:Europe/Bucharest', 'REFRESH-INTERVAL;VALUE=DURATION:P1D', ...VTIMEZONE];
  for (let d = SEMESTER_START; diffDays(d, SEMESTER_END) >= 0; d = addDays(d, 1)) {
    for (const e of eventsForDate(d)) {
      const dt = (hhmm) => `${d.replace(/-/g, '')}T${hhmm.replace(':', '')}00`;
      lines.push('BEGIN:VEVENT',
        `UID:${GROUP}-${d}-${e.id}@orar-1104a`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Bucharest:${dt(e.start)}`,
        `DTEND;TZID=Europe/Bucharest:${dt(e.end)}`,
        `SUMMARY:${esc(`${e.code} · ${typeLabel(e)}`)}`,
        `LOCATION:${esc(e.room)}`,
        `DESCRIPTION:${esc(`${e.name}\n${typeLabel(e)} · ${e.prof}\nSala ${e.room}`)}`);
      if (alarmMinutes > 0) {
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${e.code} în ${e.room}`)}`, `TRIGGER:-PT${alarmMinutes}M`, 'END:VALARM');
      }
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) doar cu WebCrypto — merge în Cloudflare Workers și Node 20+.

const enc = new TextEncoder();

const b64u = {
  encode(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(str) {
    const s = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  },
};

const concat = (...arrs) => {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
};

async function hkdf(salt, ikm, info, bits) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bits));
}

/** Criptează payload-ul pentru abonamentul dat (Content-Encoding: aes128gcm). */
async function encryptPayload(subscription, plaintext) {
  const uaPublic = b64u.decode(subscription.keys.p256dh);
  const authSecret = b64u.decode(subscription.keys.auth);

  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));

  const ikm = await hkdf(authSecret, shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 256);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 128);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 96);

  const data = concat(typeof plaintext === 'string' ? enc.encode(plaintext) : plaintext, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, data));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, cipher);
}

/** JWT VAPID semnat ES256. publicKey = 65 bytes necomprimat (base64url), privateKey = scalarul d (base64url). */
async function vapidAuthHeader(endpoint, { publicKey, privateKey, subject }) {
  const pub = b64u.decode(publicKey);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u.encode(pub.slice(1, 33)), y: b64u.encode(pub.slice(33, 65)), d: privateKey, ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const aud = new URL(endpoint).origin;
  const header = b64u.encode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u.encode(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 3600, sub: subject })));
  const unsigned = `${header}.${claims}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned));
  return `vapid t=${unsigned}.${b64u.encode(sig)}, k=${publicKey}`;
}

/** Trimite o notificare. Întoarce Response-ul serviciului de push (201 = ok, 404/410 = abonament expirat). */
async function sendPush(subscription, payload, vapid, { ttl = 3600, urgency = 'high', topic } = {}) {
  const body = await encryptPayload(subscription, JSON.stringify(payload));
  const headers = {
    Authorization: await vapidAuthHeader(subscription.endpoint, vapid),
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(ttl),
    Urgency: urgency,
  };
  if (topic) headers.Topic = topic;
  return fetch(subscription.endpoint, { method: 'POST', headers, body });
}

// ---- Robotul de notificări (Cloudflare Worker) ----
// Rulează în fiecare minut (Cron Trigger "* * * * *") și trimite notificările la minut.
// Setări necesare în Cloudflare: secretul NOTIFY_CONFIG = codul copiat din aplicație.
//   GET /       → starea robotului și ce notificări urmează azi
//   GET /test   → trimite imediat o notificare de probă

const TYPE_RO = { C: 'curs', S: 'seminar', L: 'laborator', SP: 'sport', P: 'proiect' };
const MORNING_MIN = 7 * 60, EVENING_MIN = 20 * 60;

function readConfig(env) {
  const raw = (env.NOTIFY_CONFIG || '').trim();
  if (!raw) throw new Error('Lipsește secretul NOTIFY_CONFIG. Copiază codul din aplicație (Setări) și pune-l în Settings, Variables and Secrets.');
  let cfg;
  try { cfg = JSON.parse(new TextDecoder().decode(b64u.decode(raw))); } catch { throw new Error('NOTIFY_CONFIG nu e valid. Copiază din nou codul din aplicație.'); }
  if (!cfg?.sub?.endpoint || !cfg?.vapid?.privateKey) throw new Error('NOTIFY_CONFIG incomplet. Copiază din nou codul din aplicație.');
  const p = cfg.prefs || {};
  cfg.prefs = { minutes: Number(p.minutes) || 15, morning: p.morning !== false, evening: !!p.evening };
  return cfg;
}

const listOf = (evs) => evs.map((e) => `${e.start} ${e.code} ${TYPE_RO[e.type]} · ${e.room}`).join('\n');

/** Notificările care trebuie trimise exact în minutul (ymd, min), ora României. */
function dueAt({ ymd, min }, prefs) {
  const out = [];
  const evs = eventsForDate(ymd);
  for (const e of evs) {
    const start = toMin(e.start);
    if (start - prefs.minutes === min) {
      out.push({ title: `${e.code} ${TYPE_RO[e.type]} în ${prefs.minutes} min · sala ${e.room}`, body: `${e.name}\n${e.start}–${e.end} · ${e.prof}`, tag: `${ymd}-${e.id}`, url: './' });
    }
  }
  if (prefs.morning && evs.length && min === MORNING_MIN) {
    out.push({ title: `Azi: ${evs.length === 1 ? "o activitate" : `${evs.length} activități`}, de la ${evs[0].start}`, body: listOf(evs), tag: `${ymd}-morning`, url: './' });
  }
  if (prefs.evening && min === EVENING_MIN) {
    const tmr = addDays(ymd, 1);
    const te = eventsForDate(tmr);
    if (te.length) {
      const w = weekNumber(tmr);
      out.push({ title: `Mâine începi la ${te[0].start} · ${te[0].code}, sala ${te[0].room}`, body: listOf(te) + `\nSăpt. ${w} · ${isEven(w) ? 'pară' : 'impară'}`, tag: `${tmr}-evening`, url: './' });
    }
  }
  return out;
}

async function deliver(cfg, payload) {
  const res = await sendPush(cfg.sub, payload, cfg.vapid, { ttl: 1800, urgency: 'high' });
  if (res.status === 404 || res.status === 410) throw new Error('Abonamentul a expirat. Pornește din nou notificările în aplicație și actualizează NOTIFY_CONFIG.');
  if (!res.ok) throw new Error(`Serviciul de push a răspuns ${res.status}: ${await res.text()}`);
}

let lastTest = 0;
const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });

export default {
  async scheduled(event, env, ctx) {
    const at = bucharestNow(new Date(event.scheduledTime));
    // ieșire rapidă în minutele fără nimic de trimis (aproape toate)
    let cfg;
    try { cfg = readConfig(env); } catch (e) { console.log(e.message); return; }
    const items = dueAt(at, cfg.prefs);
    if (!items.length) return;
    ctx.waitUntil((async () => {
      for (const n of items) {
        try { await deliver(cfg, n); console.log('trimis:', n.title); }
        catch (e) { console.log('EROARE:', e.message); }
      }
    })());
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    let cfg;
    try { cfg = readConfig(env); } catch (e) { return json({ ok: false, eroare: e.message }, 500); }

    if (url.pathname === '/test') {
      if (Date.now() - lastTest < 20000) return json({ ok: false, eroare: 'Așteaptă 20 de secunde între teste.' }, 429);
      lastTest = Date.now();
      const t = bucharestNow().ymd;
      const nd = nextClassDay(t);
      const first = nd && eventsForDate(nd)[0];
      try {
        await deliver(cfg, { title: 'Notificările merg ✓', body: `Primești un mesaj cu ${cfg.prefs.minutes} min înainte de fiecare oră.` + (first ? `\nUrmătoarea: ${first.code} ${TYPE_RO[first.type]}, ${first.start}, sala ${first.room}` : ''), tag: 'test', url: './' });
        return json({ ok: true, mesaj: 'Trimis. Ar trebui să apară pe telefon în câteva secunde.' });
      } catch (e) { return json({ ok: false, eroare: e.message }, 502); }
    }

    // pagina de stare: ce urmează azi
    const n = bucharestNow();
    const upcoming = [];
    for (let m = n.min + 1; m < 24 * 60; m++) for (const it of dueAt({ ymd: n.ymd, min: m }, cfg.prefs)) upcoming.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} — ${it.title}`);
    return json({ ok: true, ora_romaniei: `${n.ymd} ${String(Math.floor(n.min / 60)).padStart(2, '0')}:${String(n.min % 60).padStart(2, '0')}`, saptamana: weekNumber(n.ymd), setari: cfg.prefs, urmeaza_azi: upcoming });
  },
};
