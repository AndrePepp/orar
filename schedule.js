// Orar 1104A — AIA anul I, semestrul I 2026-2027
// Sursa: Orar_AC_2026-2027_sem_I_v04.xlsx, foaia L-I-AIA, coloana I (1104A)
// + cursurile comune ale seriei (C:L), cu durata dată de celulele îmbinate.
// Fișierul e folosit și de PWA, și de serverul de notificări (worker/src/schedule.js e o copie).

export const GROUP = '1104A';
export const TZ = 'Europe/Bucharest';

export const SUBJECTS = {
  CM1:  { name: 'Complemente de matematică I', color: '#8b5cf6' },
  AM:   { name: 'Analiză matematică', color: '#3b82f6' },
  ALGA: { name: 'Algebră liniară și geometrie analitică', color: '#06b6d4' },
  BFC:  { name: 'Bazele funcționării calculatoarelor', color: '#f59e0b' },
  PC1:  { name: 'Programarea calculatoarelor I', color: '#10b981' },
  Fiz:  { name: 'Fizică', color: '#ef4444' },
  SP1:  { name: 'Sport I', color: '#ec4899' },
};

export const TYPES = { C: 'Curs', S: 'Seminar', L: 'Laborator', P: 'Proiect', SP: 'Sport' };
export const PERIODICITY = { s: 'săptămânal', p: 'săptămâni pare', i: 'săptămâni impare' };

// day: 1 = Luni … 5 = Vineri
export const EVENTS = [
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
export const TEACHING_BLOCKS = [
  { start: '2026-09-28', weeks: 12, first: 1 },
  { start: '2027-01-04', weeks: 2, first: 13 },
];
// Zile libere legale care cad în zile de curs
export const HOLIDAYS = {
  '2026-11-30': 'Sfântul Andrei',
  '2026-12-01': 'Ziua Națională',
  '2027-01-06': 'Boboteaza',
  '2027-01-07': 'Sfântul Ioan',
};
export const SEMESTER_START = '2026-09-28';
export const SEMESTER_END = '2027-01-15';

// ---- utilitare pe date "YYYY-MM-DD" (fără fus orar, fără probleme de DST) ----
const toUTC = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUTC = (t) => new Date(t).toISOString().slice(0, 10);
export const addDays = (ymd, n) => fromUTC(toUTC(ymd) + n * 86400000);
export const dayOfWeek = (ymd) => { const d = new Date(toUTC(ymd)).getUTCDay(); return d === 0 ? 7 : d; }; // 1=Luni … 7=Duminică
export const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
export const mondayOf = (ymd) => addDays(ymd, 1 - dayOfWeek(ymd));
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

export function localYMD(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Ora curentă în Europe/Bucharest: { ymd, min } — folosit de server. */
export function bucharestNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  return { ymd: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Numărul săptămânii didactice (1–14) sau null dacă data e în vacanță / în afara semestrului. */
export function weekNumber(ymd) {
  for (const b of TEACHING_BLOCKS) {
    const d = diffDays(b.start, ymd);
    if (d >= 0 && d < b.weeks * 7) return b.first + Math.floor(d / 7);
  }
  return null;
}

export const isEven = (week) => week % 2 === 0;

/** Activitățile dintr-o zi anume, ținând cont de săptămâna pară/impară, vacanțe și sărbători. */
export function eventsForDate(ymd) {
  const week = weekNumber(ymd);
  if (!week || HOLIDAYS[ymd]) return [];
  const dow = dayOfWeek(ymd);
  return EVENTS
    .filter((e) => e.day === dow)
    .filter((e) => e.per === 's' || (e.per === 'p' && isEven(week)) || (e.per === 'i' && !isEven(week)))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

/** Descrie ce fel de zi e (pentru mesaje în interfață). */
export function dayStatus(ymd) {
  if (HOLIDAYS[ymd]) return { kind: 'holiday', label: HOLIDAYS[ymd] };
  if (diffDays(ymd, SEMESTER_START) > 0) return { kind: 'before', label: 'Semestrul începe luni, 28 septembrie' };
  if (diffDays(SEMESTER_END, ymd) > 0) return { kind: 'after', label: 'Activitatea didactică s-a încheiat' };
  if (!weekNumber(ymd)) return { kind: 'vacation', label: 'Vacanța de Crăciun' };
  if (dayOfWeek(ymd) > 5) return { kind: 'weekend', label: 'Weekend' };
  return { kind: 'normal' };
}

/** Următoarea zi (inclusiv azi) care are ore. */
export function nextClassDay(fromYmd, maxDays = 120) {
  for (let i = 0; i < maxDays; i++) {
    const d = addDays(fromYmd, i);
    if (eventsForDate(d).length) return d;
  }
  return null;
}

export const typeLabel = (e) => TYPES[e.type] || e.type;

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

export function buildICS(alarmMinutes = 15) {
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
