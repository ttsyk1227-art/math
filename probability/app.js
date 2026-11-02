'use strict';

const $ = (sel, el = document) => el.querySelector(sel);

/* data.js（METHODS, ORDER, GENS と計算の道具）を先に読み込むこと */

/* ---------- 記録（この端末のブラウザに保存） ---------- */
const STORE = 'prob-navi-v1';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function addStat(key, ok) {
  const s = loadStats();
  const t = s[key] || { ok: 0, all: 0 };
  t.all += 1;
  if (ok) t.ok += 1;
  s[key] = t;
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 保存できない環境では記録しない */ }
}

// 全角数字・カンマ・空白を許して 0 以上の整数として読む
function parseInt0(raw) {
  const s = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 解き方ガイド ---------- */
function methodBody(key) {
  const m = METHODS[key];
  return `
    <p class="formula">${m.formula}</p>
    <div class="kwlist">${m.keywords.map((k) => `<span>${k}</span>`).join('')}</div>
    <ol class="steps-mini">${m.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
}

function renderGuide() {
  $('#flow-list').innerHTML = ORDER.map((k) => `<li><b>${METHODS[k].flow}</b>→ <a href="#guide-${k}" class="jump">${METHODS[k].name}</a></li>`).join('');
  $('#method-cards').innerHTML = ORDER.map((k) => {
    const m = METHODS[k];
    return `
      <article class="fcard mcard" id="guide-${k}">
        <h3>${m.name}</h3>
        ${methodBody(k)}
        <details>
          <summary>例題を見る</summary>
          <p>${m.example[0]}</p>
          <p class="formula">${m.example[1]}</p>
        </details>
        <button type="button" class="btn small practice" data-practice="${k}">この解き方をドリルで練習</button>
      </article>`;
  }).join('');
}

/* ---------- 問題チェック（ことばから解き方を判定） ---------- */
const RULES = [
  { m: 'expect', re: /期待値|平均して|平均で/g, note: '「期待値」は、値 × 確率 をすべて足して求めます。' },
  { m: 'cond', re: /(?:出|わか|分か|起こ|引い|取り出し|選ばれ)たとき|であったとき|であるとき|であったとする|であった。|とわかった|と分かった|ことがわかった|ことが分かった|条件付き/g, note: '「〜であったとき」は、その条件が起こった中だけで考える条件付き確率です。' },
  { m: 'cond', re: /戻さない|戻さず|もどさない|もどさず|この順に|順に1本|くじを引/g, note: 'もとに戻さずに続けて取り出すと、2回目の確率が1回目の結果で変わります。乗法定理で順にかけます。' },
  { m: 'cond', re: /不良品|工場|原因|陽性|検査/g, note: '結果からどこで起きたか（原因）をさかのぼる問題は、条件付き確率（原因の確率）です。' },
  { m: 'rep', re: /[0-9０-９]+\s*回(?:続けて)?(?:投げ|振|くり返|繰り返|行|ゲーム|試合)|回のうち|回中|ちょうど\s*[0-9０-９]+\s*回|[0-9０-９]+\s*回以上|[0-9０-９]+\s*回以下|[0-9０-９]+\s*勝|[0-9０-９]+\s*試合/g, note: '同じことをくり返して「n回のうち r回」起こる確率は反復試行です。' },
  { m: 'maxmin', re: /最大値|最小値|最も大きい|最も小さい|いちばん大きい|いちばん小さい|一番大きい|一番小さい/g, note: '「最大値が k」は「すべて k 以下」から「すべて k−1 以下」を引きます。' },
  { m: 'comp', re: /少なくとも|1つ以上|一つ以上|1個以上|1回以上|1枚以上|1人以上|でない確率|ない確率/g, note: '「少なくとも」は、反対の「1つもない」の確率を1から引く（余事象）と楽です。' },
  { m: 'comp', re: /積が偶数/g, note: '「積が偶数」は、反対の「すべて奇数」を考えると楽です（余事象）。' },
  { m: 'union', re: /または|もしくは|いずれか|どちらか|同じ色/g, note: '「A または B」は和事象。重なり（A かつ B）を引きます。重ならない（排反）なら足すだけです。' },
  { m: 'indep', re: /もとに戻して|元に戻して|戻してから|もどして|それぞれ1|それぞれの袋|さいころと(?:硬貨|コイン)|(?:硬貨|コイン)とさいころ|さらに[^。]{0,10}(?:硬貨|コイン|さいころ)|袋\s*[AＡ][^。]*袋\s*[BＢ]/g, note: 'たがいに影響しない試行が続けて起こるときは、それぞれの確率をかけます（独立）。' },
  { m: 'basic', re: /同時に|並べ|並ぶ|並んで/g, note: '全体の場合の数と、条件に合う場合の数を、組合せ・順列で数えて割ります。' },
];

const SAMPLES = [
  '1個のさいころを3回投げるとき、少なくとも1回は6の目が出る確率を求めよ。',
  '赤玉4個と白玉3個が入った袋から、もとに戻さないで1個ずつ2回取り出す。1回目に赤玉が出たとき、2回目も赤玉である確率を求めよ。',
  '1枚の硬貨を5回投げるとき、表がちょうど3回出る確率を求めよ。',
  '1から30までの番号のカードから1枚引くとき、その番号が3の倍数または5の倍数である確率を求めよ。',
  'さいころを2回投げるとき、出た目の最大値が4である確率を求めよ。',
  '1等1000円が1本、2等100円が4本入った10本のくじがある。1本引くときの賞金の期待値を求めよ。',
  '赤玉3個と白玉5個が入った袋から、同時に2個取り出すとき、2個とも赤玉である確率を求めよ。',
];

function analyze(text) {
  const hits = [];
  RULES.forEach((rule, ri_) => {
    for (const mt of text.matchAll(rule.re)) hits.push({ start: mt.index, end: mt.index + mt[0].length, word: mt[0], rule: ri_ });
  });
  // 重なりを除いて、前から順に色をつける
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  let last = 0;
  for (const h of hits) if (h.start >= last) { kept.push(h); last = h.end; }
  let html = '', pos = 0;
  for (const h of kept) {
    html += escapeHtml(text.slice(pos, h.start)) + `<mark>${escapeHtml(h.word)}</mark>`;
    pos = h.end;
  }
  html += escapeHtml(text.slice(pos));

  // 解き方ごとにまとめる（見分け方の順番で並べる）
  const found = {};
  for (const h of hits) {
    const r = RULES[h.rule];
    const f = (found[r.m] ||= { words: new Set(), notes: new Set() });
    f.words.add(h.word);
    f.notes.add(r.note);
  }
  return { html, methods: ORDER.filter((k) => found[k]).map((k) => ({ key: k, ...found[k] })) };
}

function runChecker() {
  const text = $('#checker-input').value.trim();
  const out = $('#checker-result');
  if (!text) { out.innerHTML = '<p class="caution">問題文を入力してください。</p>'; return; }
  const { html, methods } = analyze(text);
  const list = methods.length ? methods : [{ key: 'basic', words: new Set(), notes: new Set(['手がかりのことばが見つかりませんでした。まずは全体と条件に合う場合の数を数える基本の方法で考えよう。']) }];
  // 基本は、ほかの解き方が見つかったときは最後の補足にまわす
  const main = list.filter((f) => f.key !== 'basic' || list.length === 1);
  out.innerHTML = `
    <div class="marked">${html}</div>
    ${main.map((f, i) => `
      <article class="fcard found">
        <p class="rank">${i === 0 ? 'まず考える解き方' : 'あわせて使う解き方'}</p>
        <h3>${METHODS[f.key].name}</h3>
        ${f.words.size ? `<p>手がかり：${[...f.words].map((w) => `<mark>${escapeHtml(w)}</mark>`).join(' ')}</p>` : ''}
        ${[...f.notes].map((n) => `<p>${n}</p>`).join('')}
        ${methodBody(f.key)}
        <button type="button" class="btn small practice" data-practice="${f.key}">この解き方をドリルで練習</button>
      </article>`).join('')}
    <p class="caution">ことばの手がかりで判定しています。最後は問題の意味をよく読んで確かめよう。解き方を2つ以上組み合わせる問題もあります。</p>`;
}

/* ---------- ドリル（分数で答える） ---------- */
function createDrill(root, nextProblem) {
  root.innerHTML = `
    <div class="score" aria-live="polite">
      <span>正解 <b class="s-ok">0</b> / <b class="s-all">0</b></span>
      <span>連続正解 <b class="s-streak">0</b></span>
    </div>
    <article class="qcard">
      <div class="body">
        <div class="tags"></div>
        <div class="qtext"></div>
        <form class="answer-row" autocomplete="off">
          <div class="fin">
            <input class="ans num" id="drill-num" type="text" inputmode="numeric" aria-label="分子">
            <div class="bar-line"></div>
            <input class="ans den" id="drill-den" type="text" inputmode="numeric" aria-label="分母">
          </div>
          <span class="unit"></span>
          <button type="submit" class="btn primary">答え合わせ</button>
        </form>
        <p class="note">約分した分数で答えよう。答えが整数のときは、上の欄だけ入力（下は空欄でOK）。</p>
        <p class="msg" hidden>上の欄に数字を入力してください（下の欄は 1 以上の数字）。</p>
        <div class="tools">
          <button type="button" class="btn ghost hint-btn">ヒントを見る</button>
          <button type="button" class="btn ghost skip-btn">別の問題にする</button>
        </div>
        <p class="hint" hidden></p>
        <div class="result" hidden></div>
      </div>
      <p class="empty" hidden>解き方を1つ以上えらんでください。</p>
    </article>`;

  const num = $('#drill-num', root), den = $('#drill-den', root);
  const submit = $('button[type="submit"]', root);
  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function load() {
    cur = nextProblem(cur);
    $('.body', root).hidden = !cur;
    $('.empty', root).hidden = !!cur;
    if (!cur) return;
    $('.tags', root).innerHTML = cur.tags.map((t, i) => `<span class="tag${i ? ' lv' : ''}">${t}</span>`).join('');
    $('.qtext', root).innerHTML = cur.q;
    $('.unit', root).textContent = cur.unit || '';
    $('.hint', root).innerHTML = `<b>ヒント</b>${cur.hint}`;
    $('.hint', root).hidden = true;
    $('.hint-btn', root).hidden = false;
    $('.result', root).hidden = true;
    $('.msg', root).hidden = true;
    for (const el of [num, den]) { el.value = ''; el.disabled = false; }
    submit.disabled = false;
  }

  function check() {
    const n = parseInt0(num.value);
    const d = den.value.trim() === '' ? 1 : parseInt0(den.value);
    if (n === null || d === null || d === 0) { $('.msg', root).hidden = false; return; }
    $('.msg', root).hidden = true;
    const [an, ad] = cur.ans;
    const same = n * ad === d * an;
    const reduced = gcd(n, d) === 1 || n === 0;
    const ok = same;
    session.all += 1;
    if (ok) { session.ok += 1; session.streak += 1; } else { session.streak = 0; }
    addStat('drill', ok);
    $('.s-ok', root).textContent = session.ok;
    $('.s-all', root).textContent = session.all;
    $('.s-streak', root).textContent = session.streak;

    const unit = cur.unit || '';
    const yours = d === 1 ? fmt(n) : frac(fmt(n), fmt(d));
    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? (reduced ? '○ 正解！' : `○ 正解！ ただし約分すると ${F(an, ad)} です`) : `× 不正解（あなたの答え：${yours}）`}</p>
      <p class="why"><b>考え方</b>${cur.why}</p>
      <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="final">答え：${F(an, ad)}${unit}</p>
      <button type="button" class="btn primary next-btn">次の問題へ</button>`;
    result.hidden = false;
    num.disabled = true;
    den.disabled = true;
    submit.disabled = true;
    $('.hint-btn', root).hidden = true;
    $('.next-btn', result).focus({ preventScroll: true });
  }

  $('form', root).addEventListener('submit', (e) => { e.preventDefault(); check(); });
  $('.hint-btn', root).addEventListener('click', () => { $('.hint', root).hidden = false; });
  $('.skip-btn', root).addEventListener('click', load);
  root.addEventListener('click', (e) => { if (e.target.closest('.next-btn')) { load(); num.focus({ preventScroll: true }); } });

  load();
  return { reload: load };
}

// 前と同じ問題が続かないように選ぶ
function drawFrom(pool, prev, make) {
  let p;
  for (let t = 0; t < 6; t++) {
    p = make(pick(pool));
    if (!prev || p.q !== prev.q) break;
  }
  return p;
}

const checkedValues = (sel) => [...document.querySelectorAll(`${sel} input:checked`)].map((el) => el.value);

$('#drill-methods').innerHTML = ORDER.map((k) => `<label class="chip"><input type="checkbox" value="${k}" checked>${METHODS[k].name}</label>`).join('');

const drill = createDrill($('#drill-trainer'), (prev) => {
  const methods = checkedValues('#drill-methods');
  const level = checkedValues('#drill-level')[0];
  const pool = GENS.filter((g) => methods.includes(g.m) && (level === 'all' || String(g.level) === level));
  if (!pool.length) return null;
  return drawFrom(pool, prev, (g) => ({ ...g.make(), tags: [METHODS[g.m].name, g.level === 1 ? '基本' : '標準'] }));
});
$('#drill-methods').addEventListener('change', () => drill.reload());
$('#drill-level').addEventListener('change', () => drill.reload());
$('#drill-all').addEventListener('click', () => {
  document.querySelectorAll('#drill-methods input').forEach((el) => { el.checked = true; });
  drill.reload();
});

// 「この解き方をドリルで練習」：その解き方だけ・全レベルにしてドリルへ
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-practice]');
  if (!btn) return;
  document.querySelectorAll('#drill-methods input').forEach((el) => { el.checked = el.value === btn.dataset.practice; });
  document.querySelector('#drill-level input[value="all"]').checked = true;
  drill.reload();
  location.hash = 'drill';
});

/* ---------- 見分けクイズ ---------- */
(function createClassifier() {
  const root = $('#classify-trainer');
  root.innerHTML = `
    <div class="score" aria-live="polite">
      <span>正解 <b class="s-ok">0</b> / <b class="s-all">0</b></span>
      <span>連続正解 <b class="s-streak">0</b></span>
    </div>
    <article class="qcard">
      <div class="tags"><span class="tag">どの解き方を使う？</span></div>
      <div class="qtext"></div>
      <div class="choices">
        ${ORDER.map((k) => `<button type="button" class="btn choice" data-k="${k}">${METHODS[k].name}</button>`).join('')}
      </div>
      <div class="result" hidden></div>
    </article>`;

  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function load() {
    cur = drawFrom(GENS, cur, (g) => ({ ...g.make(), m: g.m }));
    $('.qtext', root).innerHTML = cur.q;
    root.querySelectorAll('.choice').forEach((b) => { b.disabled = false; b.className = 'btn choice'; });
    $('.result', root).hidden = true;
  }

  function answer(btn) {
    const ok = btn.dataset.k === cur.m;
    session.all += 1;
    if (ok) { session.ok += 1; session.streak += 1; } else { session.streak = 0; }
    addStat('classify', ok);
    $('.s-ok', root).textContent = session.ok;
    $('.s-all', root).textContent = session.all;
    $('.s-streak', root).textContent = session.streak;
    root.querySelectorAll('.choice').forEach((b) => {
      b.disabled = true;
      if (b.dataset.k === cur.m) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const { html } = analyze(cur.q);
    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? '○ 正解！' : `× 不正解　正しくは「${METHODS[cur.m].name}」`}</p>
      <p class="why"><b>考え方</b>${cur.why}</p>
      ${/</.test(cur.q) ? '' : `<p class="marked">${html}</p>`}
      <details>
        <summary>答えと解き方を見る</summary>
        <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="final">答え：${F(...cur.ans)}${cur.unit || ''}</p>
      </details>
      <p><button type="button" class="btn primary next-btn">次の問題へ</button></p>`;
    result.hidden = false;
    $('.next-btn', result).focus({ preventScroll: true });
  }

  root.addEventListener('click', (e) => {
    const choice = e.target.closest('.choice');
    if (choice && !choice.disabled) answer(choice);
    if (e.target.closest('.next-btn')) load();
  });
  load();
})();

/* ---------- 問題チェックの操作 ---------- */
$('#checker-samples').innerHTML = SAMPLES.map((s, i) => `<button type="button" class="chip sample" data-i="${i}">例${i + 1}：${METHODS[['comp', 'cond', 'rep', 'union', 'maxmin', 'expect', 'basic'][i]].name}</button>`).join('');
$('#checker-samples').addEventListener('click', (e) => {
  const b = e.target.closest('.sample');
  if (!b) return;
  $('#checker-input').value = SAMPLES[Number(b.dataset.i)];
  runChecker();
});
$('#checker-run').addEventListener('click', runChecker);
$('#checker-clear').addEventListener('click', () => { $('#checker-input').value = ''; $('#checker-result').innerHTML = ''; $('#checker-input').focus(); });

/* ---------- 画面の切りかえ ---------- */
const VIEWS = ['home', 'guide', 'checker', 'classify', 'drill'];

function updateHome() {
  const s = loadStats();
  const line = (t) => (t && t.all ? `これまで ${t.all}問中 ${t.ok}問正解` : '');
  $('#stat-classify').textContent = line(s.classify);
  $('#stat-drill').textContent = line(s.drill);
}

function route() {
  const v = location.hash.slice(1);
  const jump = v.startsWith('guide-') ? v : null;
  const view = jump ? 'guide' : VIEWS.includes(v) ? v : 'home';
  VIEWS.forEach((name) => { $(`#view-${name}`).hidden = name !== view; });
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (view === 'home') updateHome();
  const target = jump && document.getElementById(jump);
  if (target) target.scrollIntoView();
  else window.scrollTo(0, 0);
}

renderGuide();
window.addEventListener('hashchange', route);
route();
