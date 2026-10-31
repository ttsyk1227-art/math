'use strict';

/* data.js（PATTERNS, GROUPS, FLOW, TOOLS, PITFALLS と計算の道具）を先に読み込むこと */

const $ = (sel, el = document) => el.querySelector(sel);
const byId = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
const GROUP_KEYS = Object.keys(GROUPS);

/* ---------- 記録（この端末のブラウザに保存） ---------- */
const STORE = 'case-patterns-v1';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function addStat(mode, patternId, ok) {
  const s = loadStats();
  for (const key of [mode, `p:${patternId}`]) {
    const t = s[key] || { ok: 0, all: 0 };
    t.all += 1;
    if (ok) t.ok += 1;
    s[key] = t;
  }
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 保存できない環境では記録しない */ }
}

function parseAnswer(raw) {
  const s = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
}

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ---------- パターンのカード ---------- */
function recordLine(id) {
  const t = loadStats()[`p:${id}`];
  if (!t || !t.all) return '';
  const weak = t.ok / t.all < 0.6;
  return `<p class="rec${weak ? ' weak' : ''}">ドリル・パターン当ての記録：${t.all}問中 ${t.ok}問正解${weak ? '（苦手）' : ''}</p>`;
}

function pcardHtml(p, { practice = true, record = true } = {}) {
  return `
    <article class="pcard">
      <div class="pcard-head"><span class="gbadge ${p.g}">${GROUPS[p.g].name}</span><span class="pid">${p.id}</span></div>
      <p class="cond">${p.cond}</p>
      <p class="sign">サイン：${p.sign}</p>
      <p class="idea"><b>考え方</b>${p.idea}</p>
      <p class="formula">${p.formula}</p>
      <p class="ex">例：${p.ex} → <b>${p.exA}</b></p>
      ${record ? recordLine(p.id) : ''}
      ${practice ? `<p><button type="button" class="btn small practice" data-practice="${p.id}">このパターンをドリルで練習</button></p>` : ''}
    </article>`;
}

/* ---------- 早見表 ---------- */
$('#flow-list').innerHTML = FLOW.map((f) => `<li><span class="ft">${f.title}</span>${f.body}</li>`).join('');
$('#tools-list').innerHTML = TOOLS.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('');
$('#pitfalls-list').innerHTML = PITFALLS.map((p) => `<li>${p}</li>`).join('');
$('#map-tabs').innerHTML = [['all', 'すべて'], ...GROUP_KEYS.map((g) => [g, GROUPS[g].name])]
  .map(([v, label], i) => `<label class="chip"><input type="radio" name="map-group" value="${v}"${i === 0 ? ' checked' : ''}>${label}</label>`).join('');

function renderMap() {
  const g = $('#map-tabs input:checked').value;
  $('#map-cards').innerHTML = PATTERNS.filter((p) => g === 'all' || p.g === g).map((p) => pcardHtml(p)).join('');
}
$('#map-tabs').addEventListener('change', renderMap);

/* ---------- 共通：グループの選択チップ ---------- */
function groupChips(sel) {
  $(sel).innerHTML = GROUP_KEYS.map((g) => `<label class="chip"><input type="checkbox" value="${g}" checked>${GROUPS[g].name}</label>`).join('');
}
const checkedGroups = (sel) => [...document.querySelectorAll(`${sel} input:checked`)].map((el) => el.value);

function scoreHtml() {
  return `
    <div class="score" aria-live="polite">
      <span>正解 <b class="s-ok">0</b> / <b class="s-all">0</b></span>
      <span>連続正解 <b class="s-streak">0</b></span>
    </div>`;
}
function bumpScore(root, session, ok) {
  session.all += 1;
  if (ok) { session.ok += 1; session.streak += 1; } else { session.streak = 0; }
  $('.s-ok', root).textContent = session.ok;
  $('.s-all', root).textContent = session.all;
  $('.s-streak', root).textContent = session.streak;
}

/* ---------- パターン当て ---------- */
// 同じ計算になり、どちらを選んでも正しいと言えてしまう組み合わせは選択肢に並べない
const CONFLICTS = [['L1', 'L2'], ['L10', 'L12'], ['S1', 'S6'], ['S7', 'W8'], ['W5', 'W7'], ['L11', 'W1']];
const conflicts = (a, b) => CONFLICTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

(function createQuiz() {
  groupChips('#quiz-groups');
  const root = $('#quiz-trainer');
  root.innerHTML = `${scoreHtml()}
    <article class="qcard">
      <div class="body">
        <div class="tags"></div>
        <div class="qtext"></div>
        <div class="choices"></div>
        <div class="result" hidden></div>
      </div>
      <p class="empty" hidden>グループを1つ以上えらんでください。</p>
    </article>`;
  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function load() {
    const groups = checkedGroups('#quiz-groups');
    const pool = PATTERNS.filter((p) => groups.includes(p.g));
    $('.body', root).hidden = !pool.length;
    $('.empty', root).hidden = !!pool.length;
    if (!pool.length) return;
    let p, q;
    for (let t = 0; t < 6; t++) { p = pick(pool); q = p.gen(); if (!cur || q.q !== cur.q) break; }
    const ok = (x) => x.id !== p.id && !conflicts(x.id, p.id);
    const same = shuffle(PATTERNS.filter((x) => x.g === p.g && ok(x))).slice(0, 2);
    const other = shuffle(PATTERNS.filter((x) => x.g !== p.g && ok(x))).slice(0, 1);
    const options = shuffle([p, ...same, ...other]);
    cur = { p, ...q };
    $('.tags', root).innerHTML = `<span class="gbadge ${p.g}">${GROUPS[p.g].name}</span>`;
    $('.qtext', root).innerHTML = cur.q;
    $('.choices', root).innerHTML = options.map((x) => `<button type="button" class="btn choice" data-id="${x.id}">${x.short}<small>${x.idea}</small></button>`).join('');
    $('.result', root).hidden = true;
  }

  function answer(btn) {
    const ok = btn.dataset.id === cur.p.id;
    bumpScore(root, session, ok);
    addStat('quiz', cur.p.id, ok);
    root.querySelectorAll('.choice').forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === cur.p.id) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? '○ 正解！' : `× 不正解　正しくは「${cur.p.short}」`}</p>
      ${pcardHtml(cur.p, { practice: false, record: false })}
      <details>
        <summary>答えと解き方を見る</summary>
        <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="final">答え：${fmt(cur.ans)}${cur.unit || '通り'}</p>
      </details>
      <p><button type="button" class="btn primary next-btn">次の問題へ</button></p>`;
    result.hidden = false;
    $('.next-btn', result).focus({ preventScroll: true });
  }

  root.addEventListener('click', (e) => {
    const c = e.target.closest('.choice');
    if (c && !c.disabled) answer(c);
    if (e.target.closest('.next-btn')) load();
  });
  $('#quiz-groups').addEventListener('change', load);
  load();
})();

/* ---------- ドリル ---------- */
groupChips('#drill-groups');

function fillPatternSelect(keep) {
  const groups = checkedGroups('#drill-groups');
  const list = PATTERNS.filter((p) => groups.includes(p.g));
  $('#drill-pattern').innerHTML = `<option value="all">すべて（ランダム）</option>${list.map((p) => `<option value="${p.id}">${p.id}　${p.cond}</option>`).join('')}`;
  if (keep && list.some((p) => p.id === keep)) $('#drill-pattern').value = keep;
}

// 苦手なパターンほど出やすくする重み
function weightOf(p) {
  const t = loadStats()[`p:${p.id}`];
  if (!t || !t.all) return 2;
  return 1 + 4 * (1 - t.ok / t.all);
}
function weightedPick(pool) {
  const ws = pool.map(weightOf);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

const drill = (function createDrill() {
  const root = $('#drill-trainer');
  root.innerHTML = `${scoreHtml()}
    <article class="qcard">
      <div class="body">
        <div class="tags"></div>
        <div class="qtext"></div>
        <form class="answer-row" autocomplete="off">
          <input class="ans" id="drill-answer" type="text" inputmode="numeric" aria-label="答え">
          <span class="unit"></span>
          <button type="submit" class="btn primary">答え合わせ</button>
        </form>
        <p class="msg" hidden>数字で答えを入力してください。</p>
        <div class="tools">
          <button type="button" class="btn ghost hint-btn">ヒントを見る</button>
          <button type="button" class="btn ghost pattern-btn">パターンを見る</button>
          <button type="button" class="btn ghost skip-btn">別の問題にする</button>
        </div>
        <p class="hint" hidden></p>
        <div class="peek" hidden></div>
        <div class="result" hidden></div>
      </div>
      <p class="empty" hidden>グループを1つ以上えらんでください。</p>
    </article>`;
  const input = $('#drill-answer');
  const submit = $('button[type="submit"]', root);
  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function pool() {
    const sel = $('#drill-pattern').value;
    if (sel !== 'all') return [byId[sel]];
    const groups = checkedGroups('#drill-groups');
    return PATTERNS.filter((p) => groups.includes(p.g));
  }

  function load() {
    const list = pool();
    $('.body', root).hidden = !list.length;
    $('.empty', root).hidden = !!list.length;
    if (!list.length) return;
    const weak = $('#drill-weak').checked;
    let p, q;
    for (let t = 0; t < 6; t++) { p = weak ? weightedPick(list) : pick(list); q = p.gen(); if (!cur || q.q !== cur.q) break; }
    cur = { p, ...q };
    $('.tags', root).innerHTML = `<span class="gbadge ${p.g}">${GROUPS[p.g].name}</span>`;
    $('.qtext', root).innerHTML = cur.q;
    $('.unit', root).textContent = cur.unit || '通り';
    $('.hint', root).innerHTML = `<b>ヒント</b>${cur.hint}`;
    for (const el of ['.hint', '.peek', '.result', '.msg']) $(el, root).hidden = true;
    $('.hint-btn', root).hidden = false;
    $('.pattern-btn', root).hidden = false;
    $('.peek', root).innerHTML = pcardHtml(p, { practice: false, record: false });
    input.value = '';
    input.disabled = false;
    submit.disabled = false;
  }

  function check() {
    const val = parseAnswer(input.value);
    if (val === null) { $('.msg', root).hidden = false; return; }
    $('.msg', root).hidden = true;
    const ok = val === cur.ans;
    bumpScore(root, session, ok);
    addStat('drill', cur.p.id, ok);
    const unit = cur.unit || '通り';
    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? '○ 正解！' : `× 不正解（あなたの答え：${fmt(val)}${unit}）`}</p>
      ${pcardHtml(cur.p, { practice: false, record: false })}
      <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="final">答え：${fmt(cur.ans)}${unit}</p>
      <button type="button" class="btn primary next-btn">次の問題へ</button>`;
    result.hidden = false;
    $('.peek', root).hidden = true;
    input.disabled = true;
    submit.disabled = true;
    $('.hint-btn', root).hidden = true;
    $('.pattern-btn', root).hidden = true;
    $('.next-btn', result).focus({ preventScroll: true });
  }

  $('form', root).addEventListener('submit', (e) => { e.preventDefault(); check(); });
  $('.hint-btn', root).addEventListener('click', () => { $('.hint', root).hidden = false; });
  $('.pattern-btn', root).addEventListener('click', () => { $('.peek', root).hidden = false; });
  $('.skip-btn', root).addEventListener('click', load);
  root.addEventListener('click', (e) => { if (e.target.closest('.next-btn')) { load(); input.focus({ preventScroll: true }); } });
  return { load };
})();

fillPatternSelect();
drill.load();
$('#drill-groups').addEventListener('change', () => { fillPatternSelect($('#drill-pattern').value); drill.load(); });
$('#drill-pattern').addEventListener('change', drill.load);
$('#drill-weak').addEventListener('change', drill.load);

// 「このパターンをドリルで練習」
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-practice]');
  if (!btn) return;
  document.querySelectorAll('#drill-groups input').forEach((el) => { el.checked = true; });
  fillPatternSelect(btn.dataset.practice);
  drill.load();
  location.hash = 'drill';
});

/* ---------- 画面の切りかえ ---------- */
const VIEWS = ['home', 'map', 'quiz', 'drill'];

function updateHome() {
  const s = loadStats();
  const line = (t) => (t && t.all ? `これまで ${t.all}問中 ${t.ok}問正解` : '');
  $('#stat-quiz').textContent = line(s.quiz);
  $('#stat-drill').textContent = line(s.drill);
}

function route() {
  const v = location.hash.slice(1);
  const view = VIEWS.includes(v) ? v : 'home';
  VIEWS.forEach((name) => { $(`#view-${name}`).hidden = name !== view; });
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (view === 'home') updateHome();
  if (view === 'map') renderMap();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
