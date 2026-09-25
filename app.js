import * as S from './schedule.js';

// =====================================================================
// Orar 1104A: 3 teme
//   v2  „Bilet”        : bandă de zile + bilet + axă de timp   (layout strip, skin bilet)
//   v4  „Marker”       : taburi + listă cu sala marcată         (layout tabs,  skin marker)
//   mix „Bilet + listă”: ecranele din v4 cu aspectul din v2     (layout tabs,  skin bilet)
// =====================================================================

// ---------- timp (pentru test: ?now=2026-10-07T13:30) ----------
const params = new URLSearchParams(location.search);
const nowOverride = params.get('now');
const offsetMs = nowOverride ? new Date(nowOverride).getTime() - Date.now() : 0;
const now = () => new Date(Date.now() + offsetMs);
const todayYMD = () => S.localYMD(now());
const nowMin = () => { const d = now(); return d.getHours() * 60 + d.getMinutes(); };

// ---------- stocare ----------
const store = {
  get(k, def) { try { const v = localStorage.getItem('orar.' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('orar.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('orar.' + k); } catch {} },
};
const prefs = () => ({ minutes: store.get('minutes', 15), morning: store.get('morning', true), evening: store.get('evening', false) });

// ---------- texte ----------
const $ = (id) => document.getElementById(id);
const h = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = ['', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const DAY_S = ['', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
const MON = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
const fmtDate = (ymd) => { const [, m, d] = ymd.split('-').map(Number); return `${d} ${MON[m - 1]}`; };
const dm = (ymd) => { const [, m, d] = ymd.split('-').map(Number); return `${d} ${MONTH[m - 1]}`; };
const TYPE = { C: 'curs', S: 'seminar', L: 'laborator', SP: 'sport', P: 'proiect' };
const TYPE_CAP = { C: 'Curs', S: 'Seminar', L: 'Laborator', SP: 'Sport', P: 'Proiect' };
const dur = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`);
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const short = (s) => s.replace(/^0/, '');
function span(min) {
  if (min < 60) return `${min} ${min === 1 ? 'minut' : min < 20 ? 'minute' : 'de minute'}`;
  const hh = Math.floor(min / 60), mm = min % 60;
  const hs = hh === 1 ? 'o oră' : `${hh} ore`;
  return mm ? `${hs} și ${mm} min` : hs;
}
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function weekText(ymd) {
  const w = S.weekNumber(ymd);
  return w ? `săptămâna ${w}, ${S.isEven(w) ? 'pară' : 'impară'}` : '';
}
function dayWord(ymd) {
  const t = todayYMD();
  if (ymd === t) return 'azi';
  if (ymd === S.addDays(t, 1)) return 'mâine';
  return `${DAY[S.dayOfWeek(ymd)].toLowerCase()}, ${dm(ymd)}`;
}

// ---------- teme ----------
const THEMES = {
  v2: { layout: 'strip', skin: 'bilet', name: 'Bilet', desc: 'bilet mare și axă de timp', bar: '#0f0f0e', barLight: '#eeece5' },
  v4: { layout: 'tabs', skin: 'marker', name: 'Marker', desc: 'listă, sala marcată', bar: '#14161b', barLight: '#f4f6f9' },
  mix: { layout: 'tabs', skin: 'bilet', name: 'Bilet + listă', desc: 'aspect v2, ecrane v4', bar: '#0f0f0e', barLight: '#eeece5' },
};
let theme = params.get('theme') || store.get('theme', 'v2');
if (!THEMES[theme]) theme = 'v2';
const T = () => THEMES[theme];

function applyTheme() {
  const t = T();
  document.documentElement.dataset.skin = t.skin;
  document.documentElement.dataset.layout = t.layout;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = m.media.includes('dark') ? t.bar : t.barLight;
  });
}

// ---------- săptămânile semestrului ----------
const SEM_DAYS = (() => {
  const out = [];
  for (let d = S.SEMESTER_START; S.diffDays(d, S.SEMESTER_END) >= 0; d = S.addDays(d, 1)) if (S.dayOfWeek(d) <= 5 && S.weekNumber(d)) out.push(d);
  return out;
})();
const WEEKS = S.TEACHING_BLOCKS.flatMap((b) => Array.from({ length: b.weeks }, (_, i) => ({ n: b.first + i, mon: S.addDays(b.start, i * 7) })));
function defaultDate() {
  const t = todayYMD();
  if (S.dayOfWeek(t) <= 5 && S.weekNumber(t)) return t;
  return S.nextClassDay(t) || (S.diffDays(t, S.SEMESTER_START) > 0 ? S.SEMESTER_START : S.SEMESTER_END);
}
function weekIndexFor(ymd) {
  const ref = S.dayOfWeek(ymd) >= 6 ? S.addDays(ymd, 8 - S.dayOfWeek(ymd)) : ymd;
  const i = WEEKS.findIndex((w) => { const d = S.diffDays(w.mon, ref); return d >= 0 && d < 7; });
  if (i >= 0) return i;
  const j = WEEKS.findIndex((w) => S.diffDays(ref, w.mon) > 0);
  return j >= 0 ? j : WEEKS.length - 1;
}

let sel = defaultDate();            // ziua selectată (strip) / ziua din săptămână (tabs)
let wi = weekIndexFor(todayYMD());  // săptămâna afișată în tabs
let tab = store.get('tab', 'azi');  // tab-ul curent în tabs
if (params.get('tab')) tab = params.get('tab');
if (!['azi', 'sapt', 'setari'].includes(tab)) tab = 'azi';

// =====================================================================
// Blocuri comune
// =====================================================================

// Bilet (v2 și v2+v4)
function ticket(ymd) {
  if (ymd !== todayYMD()) return '';
  const m = nowMin();
  const evs = S.eventsForDate(ymd);
  const cur = evs.find((e) => S.toMin(e.start) <= m && m < S.toMin(e.end));
  const nxt = evs.find((e) => S.toMin(e.start) > m);
  const e = cur || nxt;
  if (!e) return '';
  const s = S.toMin(e.start), en = S.toMin(e.end);
  const after = cur ? nxt : evs[evs.indexOf(e) + 1];
  const head = cur
    ? `<span class="blink">Acum</span><span>mai sunt ${dur(en - m)}</span>`
    : `<span>Urmează</span><span>${s - m <= 240 ? `în ${dur(s - m)}` : `la ${e.start}`}</span>`;
  return `<section class="ticket ${cur ? 'live' : ''}">
    <div class="t-head">${head}</div>
    <div class="t-main"><div class="t-code">${h(e.code)}</div><div class="t-name">${h(e.name)}</div></div>
    <div class="t-perf"></div>
    <div class="t-grid">
      <div><small>De la</small><b>${e.start}</b></div>
      <div><small>Până la</small><b>${e.end}</b></div>
      <div class="gate"><small>Sala</small><b>${h(e.room)}</b></div>
    </div>
    <div class="t-foot"><span>${h(TYPE_CAP[e.type])} · ${h(e.prof)}</span>${after ? `<span class="then">apoi <b>${h(after.code)}</b> ${after.start}</span>` : ''}</div>
    ${cur ? `<div class="t-bar"><i style="width:${Math.round(((m - s) / (en - s)) * 100)}%"></i></div>` : ''}
  </section>`;
}

// „Liber.” (v2 și v2+v4)
function freeBlock(ymd, { showButton = true } = {}) {
  const st = S.dayStatus(ymd);
  const evs = S.eventsForDate(ymd);
  const nd = S.nextClassDay(S.addDays(ymd, 1));
  const first = nd && S.eventsForDate(nd)[0];
  const done = evs.length && ymd === todayYMD();
  const why = done ? 'Ai terminat orele pe azi.' : ({ holiday: `${st.label}. Zi liberă legală.`, vacation: 'Vacanța de Crăciun, până pe 3 ianuarie.', before: 'Semestrul începe luni, 28 septembrie.', after: 'Urmează sesiunea: 18 ian – 7 feb.' }[st.kind] || 'Nicio activitate azi.');
  return `<section class="free"><div class="big">${done ? 'Gata.' : 'Liber.'}</div><p>${h(why)}</p>
    ${first ? `<div class="nx">Următoarea: <b>${h(first.code)}</b> ${h(TYPE[first.type])} · ${DAY[S.dayOfWeek(nd)].toLowerCase()}, ${fmtDate(nd)}, <b>${first.start}</b> · sala <b>${h(first.room)}</b>${showButton ? `<br><button class="btn plain" data-go="${nd}">Vezi ziua</button>` : ''}</div>` : ''}
  </section>`;
}

// Listă de ore (v4 și v2+v4)
function list(ymd, evs, live) {
  const m = nowMin();
  let out = '<ul class="list">';
  evs.forEach((e, i) => {
    if (i > 0) {
      const gap = S.toMin(e.start) - S.toMin(evs[i - 1].end);
      if (gap >= 30) out += `<li class="gap">Pauză de ${span(gap)}</li>`;
    }
    const s = S.toMin(e.start), en = S.toMin(e.end);
    const st = live ? (en <= m ? 'past' : s <= m ? 'now' : '') : '';
    const per = e.per === 'p' ? ', <span class="alt">doar în săptămânile pare</span>' : e.per === 'i' ? ', <span class="alt">doar în săptămânile impare</span>' : '';
    out += `<li class="item ${st}" data-c="${e.code}">
      <div class="t">${short(e.start)}<span>${short(e.end)}</span></div>
      <div><div class="n">${h(e.name)}</div><div class="desc">${TYPE[e.type]}, ${h(e.prof)}${per}</div></div>
      <div class="r"><span class="mark">${h(e.room)}</span></div>
    </li>`;
  });
  return out + '</ul>';
}

// Hero „acum / urmează” (v4)
function markerHero(t) {
  const m = nowMin();
  const evs = S.eventsForDate(t);
  const cur = evs.find((e) => S.toMin(e.start) <= m && m < S.toMin(e.end));
  const nxt = evs.find((e) => S.toMin(e.start) > m);
  if (cur) {
    const s = S.toMin(cur.start), en = S.toMin(cur.end);
    return `<section class="hero" data-c="${cur.code}">
      <p class="when">Acum, până la <b>${short(cur.end)}</b></p>
      <h1>${h(cur.name)}</h1>
      <p class="where">${TYPE[cur.type]} în <span class="mark">${h(cur.room)}</span></p>
      <p class="who">cu ${h(cur.prof)}</p>
      <div class="left"><div class="track"><i style="width:${Math.round(((m - s) / (en - s)) * 100)}%"></i></div>mai ai ${span(en - m)}</div>
      ${nxt ? `<p class="then" data-c="${nxt.code}">Apoi la ${short(nxt.start)}: <b>${h(nxt.name)}</b> în <span class="mark">${h(nxt.room)}</span></p>` : '<p class="then">E ultima oră de azi.</p>'}
    </section>`;
  }
  if (nxt) {
    const inMin = S.toMin(nxt.start) - m;
    return `<section class="hero" data-c="${nxt.code}">
      <p class="when">${inMin <= 180 ? `Peste ${span(inMin)}, la <b>${short(nxt.start)}</b>` : `Azi la <b>${short(nxt.start)}</b>`}</p>
      <h1>${h(nxt.name)}</h1>
      <p class="where">${TYPE[nxt.type]} în <span class="mark">${h(nxt.room)}</span></p>
      <p class="who">cu ${h(nxt.prof)}, până la ${short(nxt.end)}</p>
    </section>`;
  }
  const st = S.dayStatus(t);
  const nd = S.nextClassDay(S.addDays(t, 1));
  const first = nd && S.eventsForDate(nd)[0];
  const title = evs.length ? 'Gata pe azi.' : {
    weekend: 'Azi n-ai ore.', holiday: `Liber, e ${st.label}.`, vacation: 'Vacanță până pe 3 ianuarie.',
    before: 'Semestrul începe luni.', after: 'Orele s-au terminat. Urmează sesiunea.',
  }[st.kind] || 'Azi n-ai ore.';
  return `<section class="hero quiet"><h1>${h(title)}</h1>
    ${first ? `<p class="then" data-c="${first.code}">Următoarea e ${dayWord(nd)} la ${short(first.start)}: <b>${h(first.name)}</b> în <span class="mark">${h(first.room)}</span></p>` : ''}
  </section>`;
}

// =====================================================================
// Layout „strip” (v2): bandă de zile + zi cu axă de timp
// =====================================================================
function mountStrip() {
  $('app').innerHTML = `
  <header class="bar">
    <div class="brand"><span class="tag">1104A</span><span id="weektag" class="weektag"></span></div>
    <div class="bar-actions">
      <button id="todayBtn" class="pillbtn" data-a="today" hidden>Azi</button>
      <button class="bell" data-a="settings" aria-label="Setări și notificări">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>
        <i id="bellDot" class="bell-dot" hidden></i>
      </button>
    </div>
  </header>
  <nav id="strip" class="strip" aria-label="Zile"></nav>
  <main id="view"></main>`;
  renderStrip();
  renderStripDay();
}

function renderStrip() {
  const today = todayYMD();
  let html = '', lastWeek = null;
  for (const d of SEM_DAYS) {
    const w = S.weekNumber(d);
    if (w !== lastWeek) {
      if (lastWeek === 12) html += '<span class="wk gap">Vacanță</span>';
      html += `<span class="wk">S${w}·${S.isEven(w) ? 'P' : 'I'}</span>`;
      lastWeek = w;
    }
    const n = S.eventsForDate(d).length;
    html += `<button class="d ${d === today ? 'today' : ''} ${n ? '' : 'off'}" data-date="${d}" aria-pressed="${d === sel}" aria-label="${DAY[S.dayOfWeek(d)]} ${fmtDate(d)}">
      <small>${DAY_S[S.dayOfWeek(d)]}</small><b>${d.slice(8)}</b><span class="ticks">${'<i></i>'.repeat(n)}</span></button>`;
  }
  $('strip').innerHTML = html;
  centerStrip(false);
}
function centerStrip(smooth = true) {
  const strip = $('strip');
  const el = strip?.querySelector(`[data-date="${sel}"]`);
  if (!el) return;
  strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
}

function timeline(ymd, evs) {
  const live = ymd === todayYMD();
  const m = nowMin();
  const H = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')) || 62;
  const startH = Math.floor(S.toMin(evs[0].start) / 60);
  const endH = Math.ceil(S.toMin(evs[evs.length - 1].end) / 60);
  const y = (min) => ((min - startH * 60) / 60) * H;
  let html = `<div class="tl" style="height:${(endH - startH) * H + 8}px">`;
  for (let hr = startH; hr <= endH; hr++) html += `<div class="hr" style="top:${y(hr * 60)}px"><span>${String(hr).padStart(2, '0')}</span></div>`;
  evs.forEach((e, i) => {
    const s = S.toMin(e.start), en = S.toMin(e.end);
    if (i > 0) {
      const ps = S.toMin(evs[i - 1].end);
      if (s - ps >= 30) html += `<div class="pause" style="top:${y(ps)}px;height:${y(s) - y(ps)}px">pauză ${dur(s - ps)}</div>`;
    }
    const state = live ? (en <= m ? 'past' : s <= m ? 'now' : '') : '';
    html += `<article class="blk ${e.type} ${state}" style="top:${y(s) + 3}px;height:${y(en) - y(s) - 6}px">
      <div class="r1">
        <div><div class="code">${h(e.code)}</div><span class="typ">${h(TYPE_CAP[e.type])}${e.per !== 's' ? ` · <span class="alt">${e.per === 'p' ? 'pare' : 'impare'}</span>` : ''}</span></div>
        <div class="room"><small>SALA</small>${h(e.room)}</div>
      </div>
      <div class="r2"><span class="nm">${h(e.prof)}</span><span class="hrs">${e.start}–${e.end}</span></div>
    </article>`;
  });
  if (live && m >= startH * 60 && m <= endH * 60) html += `<div class="nowline" style="top:${y(m)}px"><span>${hhmm(m)}</span></div>`;
  return html + '</div>';
}

function renderStripDay() {
  const today = todayYMD();
  const evs = S.eventsForDate(sel);
  const w = S.weekNumber(sel);
  const wt = S.weekNumber(today);
  $('weektag').innerHTML = wt ? `Săpt <b>${wt}</b>/14 · ${S.isEven(wt) ? 'pară' : 'impară'}` : h(S.dayStatus(today).label || '');
  $('todayBtn').hidden = sel === defaultDate();
  const rel = sel === today ? 'Azi' : sel === S.addDays(today, 1) ? 'Mâine' : '';
  let html = `<div class="dayhead"><h2>${DAY[S.dayOfWeek(sel)]}</h2><div class="date">${rel ? `<b>${rel}</b>` : ''}${fmtDate(sel)}${w ? ` · S${w}` : ''}</div></div>`;
  html += ticket(sel);
  if (evs.length) {
    const total = evs.reduce((n, e) => n + S.toMin(e.end) - S.toMin(e.start), 0);
    html += `<div class="label-row"><span>${evs.length} activități</span><span>${evs[0].start} → ${evs[evs.length - 1].end} · ${dur(total)}</span></div>`;
    html += timeline(sel, evs);
  } else {
    html += freeBlock(sel);
  }
  html += `<p class="foot">ORAR ${S.GROUP} · AIA I · SEM. I 2026–27<br>SURSA: ORAR_AC_2026-2027_SEM_I_V04.XLSX</p>`;
  $('view').innerHTML = html;
}

function stripGo(ymd) {
  sel = ymd;
  $('strip').querySelectorAll('.d').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.date === sel)));
  centerStrip();
  renderStripDay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================================
// Layout „tabs” (v4 și v2+v4)
// =====================================================================
function mountTabs() {
  $('app').innerHTML = `
  <main id="view"></main>
  <nav class="tabs" aria-label="Secțiuni">
    <button data-tab="azi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>Azi</button>
    <button data-tab="sapt"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>Săptămâna</button>
    <button data-tab="setari"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>Setări<i id="bellDot" class="dot" hidden></i></button>
  </nav>`;
  renderTabs();
}

function renderTabs() {
  document.querySelectorAll('.tabs button').forEach((b) => (b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  if (tab === 'sapt') renderWeek();
  else if (tab === 'setari') renderSettings($('view'));
  else renderToday();
}

function renderToday() {
  const t = todayYMD();
  const evs = S.eventsForDate(t);
  const bilet = T().skin === 'bilet';
  let html;
  if (bilet) {
    const w = S.weekNumber(t);
    html = `<p class="date">${fmtDate(t)}${w ? ` · S${w} <b>${S.isEven(w) ? 'pară' : 'impară'}</b>` : ''}</p><h1 class="title">${DAY[S.dayOfWeek(t)]}</h1>`;
    html += ticket(t) || freeBlock(t, { showButton: false });
  } else {
    const wt = weekText(t);
    html = `<p class="date">${DAY[S.dayOfWeek(t)]}, ${dm(t)}${wt ? `, ${wt}` : ''}</p>` + markerHero(t);
  }
  if (evs.length) {
    const left = evs.filter((e) => S.toMin(e.end) > nowMin()).length;
    html += `<h2 class="list-title">Programul de azi<small>${left ? `${left} din ${evs.length} rămase` : 'toate gata'}</small></h2>`;
    html += list(t, evs, true);
  } else {
    const nd = S.nextClassDay(S.addDays(t, 1));
    if (nd) {
      const w = dayWord(nd);
      html += `<h2 class="list-title">${w[0].toUpperCase() + w.slice(1)}<small>${weekText(nd)}</small></h2>`;
      html += list(nd, S.eventsForDate(nd), false);
    }
  }
  $('view').innerHTML = html;
}

function renderWeek() {
  const t = todayYMD();
  const w = WEEKS[wi];
  if (!sel || S.diffDays(w.mon, sel) < 0 || S.diffDays(w.mon, sel) > 4) {
    const di = S.diffDays(w.mon, t);
    sel = di >= 0 && di <= 4 ? t : w.mon;
  }
  const bilet = T().skin === 'bilet';
  let html = `<div class="${bilet ? 'pagehead' : 'weekhead'}">
    <div><p class="date">${bilet ? `${fmtDate(w.mon)} – ${fmtDate(S.addDays(w.mon, 4))} · <b>${S.isEven(w.n) ? 'pară' : 'impară'}</b>` : `${dm(w.mon)} – ${dm(S.addDays(w.mon, 4))}, ${S.isEven(w.n) ? 'pară' : 'impară'}`}</p><h1 class="title">Săptămâna ${w.n}</h1></div>
    <div class="arrows">
      <button class="arrow" data-a="prev" aria-label="Săptămâna dinainte" ${wi === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="arrow" data-a="next" aria-label="Săptămâna următoare" ${wi === WEEKS.length - 1 ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
  </div><div class="days">`;
  const SHORT = bilet ? ['Lu', 'Ma', 'Mi', 'Jo', 'Vi'] : ['L', 'Ma', 'Mi', 'J', 'V'];
  for (let i = 0; i < 5; i++) {
    const d = S.addDays(w.mon, i);
    const evs = S.eventsForDate(d);
    html += `<button class="day ${d === t ? 'today' : ''}" data-d="${d}" aria-pressed="${d === sel}" aria-label="${DAY[i + 1]} ${dm(d)}">
      <span>${SHORT[i]}</span><b>${bilet ? d.slice(8) : Number(d.slice(8))}</b><span class="ink">${evs.map((e) => `<i data-c="${e.code}"></i>`).join('')}</span></button>`;
  }
  html += '</div>';
  const evs = S.eventsForDate(sel);
  html += `<h2 class="list-title">${DAY[S.dayOfWeek(sel)]}, ${dm(sel)}${sel === t ? '<small>azi</small>' : ''}</h2>`;
  if (evs.length) html += list(sel, evs, sel === t);
  else html += `<p class="empty">${S.HOLIDAYS[sel] ? `Liber, e ${h(S.HOLIDAYS[sel])}.` : 'Nicio oră în ziua asta.'}</p>`;
  html += `<ul class="subjects">${Object.entries(S.SUBJECTS).map(([c, s]) => `<li data-c="${c}"><b><span class="mark">${c}</span></b>${h(s.name)}</li>`).join('')}</ul>`;
  $('view').innerHTML = html;
}

// =====================================================================
// Setări: temă + notificări (în panoul de jos la v2, pagină la celelalte)
// =====================================================================
let swReg = null;
const b64u = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)),
};
async function ensureKeys() {
  let k = store.get('vapid', null);
  if (k) return k;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const pub = await crypto.subtle.exportKey('raw', kp.publicKey);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  k = { publicKey: b64u.enc(pub), privateKey: jwk.d };
  store.set('vapid', k);
  return k;
}
async function getSub() {
  if (!swReg?.pushManager) return null;
  try { return await swReg.pushManager.getSubscription(); } catch { return null; }
}
// Codul care se pune ca secret NOTIFY_CONFIG (în Cloudflare sau GitHub)
function configCode(sub) {
  const k = store.get('vapid', null);
  if (!sub || !k) return '';
  const j = sub.toJSON();
  const data = { v: 1, sub: { endpoint: j.endpoint, keys: j.keys }, vapid: { ...k, subject: location.origin.startsWith('https') ? location.origin : 'mailto:orar@example.com' }, prefs: prefs() };
  return b64u.enc(new TextEncoder().encode(JSON.stringify(data)));
}
async function enable() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Nu ai permis notificările'); return refreshSettings(); }
    const k = await ensureKeys();
    let sub = await swReg.pushManager.getSubscription();
    if (sub) {
      const cur = sub.options?.applicationServerKey;
      if (cur && b64u.enc(cur) !== k.publicKey) { await sub.unsubscribe(); sub = null; }
    }
    if (!sub) sub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u.dec(k.publicKey) });
    store.del('copied');
    toast('Notificări pornite. Mai copiază codul.');
  } catch (e) {
    console.error(e);
    toast(e.message || 'Notificările nu s-au putut porni');
  }
  refreshSettings();
}
async function disable() {
  const sub = await getSub();
  if (sub) await sub.unsubscribe().catch(() => {});
  store.del('copied');
  toast('Notificări oprite');
  refreshSettings();
}
async function copyCode() {
  const code = configCode(await getSub());
  if (!code) return;
  try { await navigator.clipboard.writeText(code); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  store.set('copied', code);
  toast('Cod copiat');
  refreshSettings();
}
async function testLocal() {
  try { await swReg.showNotification('PC1 laborator în 15 min · sala A1-13', { body: 'Programarea calculatoarelor I, 14:00–17:00', icon: 'icons/icon-192.png', tag: 'test' }); }
  catch (e) { toast(e.message); }
}
async function updateBell() {
  const dot = $('bellDot');
  if (!dot) return;
  const sub = await getSub();
  dot.hidden = !(sub && store.get('copied', null) !== configCode(sub));
}

async function renderSettings(target) {
  const p = prefs();
  const sub = await getSub();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const code = configCode(sub);
  const copied = store.get('copied', null);

  let html = '<h1 class="title">Setări</h1>';
  html += `<h2 class="h2">Temă</h2><div class="themes">${Object.entries(THEMES).map(([id, t]) =>
    `<button class="theme" data-theme="${id}" aria-pressed="${id === theme}"><span class="sw sw-${id}"></span><b>${h(t.name)}</b><span>${h(t.desc)}</span></button>`).join('')}</div>`;

  html += '<h2 class="h2">Notificări</h2><p class="lede">Un mesaj înainte de fiecare oră, cu sala. Merge și cu aplicația închisă.</p>';
  if (isIOS && !isStandalone()) {
    html += `<div class="status warn"><i></i><div>Adaugă aplicația pe ecranul principal<span>Pe iPhone, notificările merg doar așa (iOS 16.4 sau mai nou).</span></div></div>
    <ol class="steps"><li>Deschide pagina în Safari.</li><li>Apasă Partajare, pătratul cu săgeată în sus.</li><li>Alege „Adaugă pe ecranul principal”.</li><li>Deschide Orar de pe ecranul principal și revino aici.</li></ol>`;
  } else if (!('PushManager' in window) || perm === 'unsupported') {
    html += '<div class="status warn"><i></i><div>Browserul nu suportă notificări<span>Deschide aplicația pe iPhone, din ecranul principal.</span></div></div>';
  } else if (perm === 'denied') {
    html += '<div class="status warn"><i></i><div>Notificările sunt blocate<span>Le pornești din Setări iPhone, Notificări, Orar.</span></div></div>';
  } else if (!sub) {
    html += '<div class="status"><i></i><div>Oprite</div></div><button class="btn" data-a="enable">Pornește notificările</button>';
  } else {
    const done = copied === code;
    html += `<div class="status ${done ? 'on' : 'warn'}"><i></i><div>${done ? 'Pornite' : copied ? 'Ai schimbat setările' : 'Aproape gata'}<span>${done ? `Primești mesajul cu ${p.minutes} minute înainte.` : copied ? 'Copiază codul din nou și înlocuiește secretul NOTIFY_CONFIG.' : 'Mai trebuie pus codul în Cloudflare, o singură dată.'}</span></div></div>
    <ol class="steps">
      <li>Copiază codul de mai jos.</li>
      <li>În Cloudflare, la robotul tău: Settings, Variables and Secrets, Add, tip Secret.</li>
      <li>Nume <code>NOTIFY_CONFIG</code>, lipește codul, Deploy.</li>
      <li>Test: deschide adresa robotului cu <code>/test</code> la final.</li>
    </ol>
    <div class="codebox">${h(code)}</div>
    <button class="btn ${done ? 'plain' : ''}" data-a="copy">Copiază codul</button>`;
  }

  html += `<h2 class="h2">Când</h2><div class="group">
    <div class="opt"><div><b>Înainte de fiecare oră</b><span>cu câte minute</span></div>
      <div class="seg">${[5, 10, 15, 30].map((n) => `<button data-min="${n}" aria-pressed="${n === p.minutes}">${n}</button>`).join('')}</div></div>
    <div class="opt"><div><b>Programul zilei</b><span>dimineața la 7:00</span></div><button class="tog" role="switch" data-t="morning" aria-checked="${p.morning}" aria-label="Programul zilei"></button></div>
    <div class="opt"><div><b>Ce ai mâine</b><span>seara la 20:00</span></div><button class="tog" role="switch" data-t="evening" aria-checked="${p.evening}" aria-label="Ce ai mâine"></button></div>
  </div>
  <p class="small">Săptămânile pare și impare, vacanța de Crăciun și zilele libere sunt deja luate în calcul. Notificările vin cu sunetul standard al iPhone-ului; dacă nu sună, verifică Setări iPhone › Notificări › Orar › Sunete.</p>`;
  if (sub) html += '<button class="btn plain" data-a="test">Arată o notificare de probă</button><button class="btn danger" data-a="disable">Oprește notificările</button>';
  html += '<p class="foot">Orar 1104A, AIA anul I, semestrul I 2026–2027. Datele vin din Orar_AC_2026-2027_sem_I_v04.xlsx.</p>';
  target.innerHTML = html;
  updateBell();
}

// panoul de jos (doar v2)
function openSheet() {
  renderSettings($('sheetBody'));
  $('scrim').hidden = false; $('sheet').hidden = false;
  requestAnimationFrame(() => { $('scrim').classList.add('show'); $('sheet').classList.add('show'); });
}
function closeSheet() {
  $('scrim').classList.remove('show'); $('sheet').classList.remove('show');
  setTimeout(() => { $('scrim').hidden = true; $('sheet').hidden = true; }, 320);
}
function refreshSettings() {
  if (!$('sheet').hidden) renderSettings($('sheetBody'));
  else if (T().layout === 'tabs' && tab === 'setari') renderSettings($('view'));
  updateBell();
}

// =====================================================================
// Montare + evenimente
// =====================================================================
function mount() {
  applyTheme();
  if (T().layout === 'strip') mountStrip(); else mountTabs();
  updateBell();
}
function render() {
  if (T().layout === 'strip') renderStripDay(); else renderTabs();
  updateBell();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const a = b.dataset.a;
  if (b.dataset.theme) {
    theme = b.dataset.theme; store.set('theme', theme);
    const inSheet = !$('sheet').hidden;
    if (inSheet && T().layout === 'tabs') { closeSheet(); tab = 'setari'; store.set('tab', tab); }
    mount();
    if (inSheet && T().layout === 'strip') renderSettings($('sheetBody'));
    return;
  }
  if (b.dataset.tab) {
    tab = b.dataset.tab; store.set('tab', tab);
    if (tab === 'sapt') { wi = weekIndexFor(todayYMD()); sel = null; }
    window.scrollTo({ top: 0 });
    renderTabs();
    return;
  }
  if (b.dataset.date) return stripGo(b.dataset.date);
  if (b.dataset.go) {
    if (T().layout === 'strip') stripGo(b.dataset.go);
    else { tab = 'sapt'; wi = weekIndexFor(b.dataset.go); sel = b.dataset.go; renderTabs(); }
    return;
  }
  if (b.dataset.d) { sel = b.dataset.d; renderWeek(); return; }
  if (a === 'today') return stripGo(defaultDate());
  if (a === 'settings') return openSheet();
  if (a === 'prev' && wi > 0) { wi--; sel = null; renderWeek(); }
  else if (a === 'next' && wi < WEEKS.length - 1) { wi++; sel = null; renderWeek(); }
  else if (a === 'enable') { b.disabled = true; enable(); }
  else if (a === 'copy') copyCode();
  else if (a === 'test') testLocal();
  else if (a === 'disable') disable();
  else if (b.dataset.min) { store.set('minutes', Number(b.dataset.min)); refreshSettings(); }
  else if (b.dataset.t) { store.set(b.dataset.t, !prefs()[b.dataset.t]); refreshSettings(); }
});
$('scrim').addEventListener('click', closeSheet);
let sy = null;
$('sheet').addEventListener('touchstart', (e) => { if ($('sheet').scrollTop <= 0) sy = e.touches[0].clientY; }, { passive: true });
$('sheet').addEventListener('touchend', (e) => { if (sy != null && e.changedTouches[0].clientY - sy > 90) closeSheet(); sy = null; });

// glisare stânga/dreapta între zile
let tx = null, ty = null;
document.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (tx == null || !$('sheet').hidden || e.target.closest('.strip, .tabs')) { tx = null; return; }
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  tx = null;
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
  const dir = dx < 0 ? 1 : -1;
  if (T().layout === 'strip') {
    const i = SEM_DAYS.indexOf(sel);
    const j = i < 0 ? 0 : i + dir;
    if (j >= 0 && j < SEM_DAYS.length) stripGo(SEM_DAYS[j]);
  } else if (tab === 'sapt') {
    const w = WEEKS[wi];
    const i = S.diffDays(w.mon, sel) + dir;
    if (i > 4 && wi < WEEKS.length - 1) { wi++; sel = WEEKS[wi].mon; }
    else if (i < 0 && wi > 0) { wi--; sel = S.addDays(WEEKS[wi].mon, 4); }
    else if (i >= 0 && i <= 4) sel = S.addDays(w.mon, i);
    renderWeek();
  }
});

// ---------- pornire ----------
if (T().layout === 'tabs' && sel) sel = null;
if (T().layout === 'strip') sel = defaultDate();
mount();
if (params.has('sheet') && T().layout === 'strip') openSheet();
setInterval(() => { if (!document.hidden && $('sheet').hidden) render(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('sheet').hidden) render(); });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(async () => {
    swReg = await navigator.serviceWorker.ready;
    updateBell();
    refreshSettings();
  }).catch((e) => console.warn('SW', e));
}
