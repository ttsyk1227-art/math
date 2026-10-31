'use strict';

/* 場合の数の「条件 → 考え方」データ。プリント（print.html）とアプリ（index.html）で共用する */

/* ---------- 計算の道具 ---------- */
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fact = (n) => { let x = 1; for (let i = 2; i <= n; i++) x *= i; return x; };
const P = (n, r) => { let x = 1; for (let i = 0; i < r; i++) x *= n - i; return x; };
const C = (n, r) => {
  if (r < 0 || r > n) return 0;
  r = Math.min(r, n - r);
  let x = 1;
  for (let i = 1; i <= r; i++) x = (x * (n - r + i)) / i;
  return Math.round(x);
};
const fmt = (x) => x.toLocaleString('ja-JP');

/* ---------- 表記（HTML） ---------- */
const sym = (k, n, r) => `<span class="nt"><sub>${n}</sub>${k}<sub>${r}</sub></span>`;
const nP = (n, r) => sym('P', n, r);
const nC = (n, r) => sym('C', n, r);
const nH = (n, r) => sym('H', n, r);
const pow = (a, b) => `<span class="nt">${a}<sup>${b}</sup></span>`;
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const prod = (n, r) => Array.from({ length: r }, (_, i) => n - i).join(' × ');
const factLine = (n) => (n <= 1 ? `${n}! = 1` : `${n}! = ${prod(n, n)} = ${fmt(fact(n))}`);
const permLine = (n, r) => `${nP(n, r)} = ${prod(n, r)} = ${fmt(P(n, r))}`;
const combLine = (n, r) => {
  const s = Math.min(r, n - r);
  const head = s !== r ? `${nC(n, r)} = ${nC(n, s)} = ` : `${nC(n, r)} = `;
  if (s === 0) return `${head}1`;
  if (s === 1) return `${head}${n}`;
  return `${head}${frac(prod(n, s), prod(s, s))} = ${fmt(C(n, r))}`;
};
const multiValue = (total, counts) => fact(total) / counts.reduce((a, c) => a * fact(c), 1);
const multiLine = (total, counts) => {
  const rep = counts.filter((c) => c >= 2);
  const den = rep.reduce((a, c) => a * fact(c), 1);
  return `${frac(`${total}!`, rep.map((c) => `${c}!`).join(' × '))} = ${frac(fmt(fact(total)), fmt(den))} = ${fmt(multiValue(total, counts))}`;
};
// 人数 sizes の組に順に分ける：nCa × (n−a)Cb × …
const splitLines = (n, sizes) => {
  let rest = n;
  const parts = sizes.map((s) => { const t = { n: rest, r: s }; rest -= s; return t; });
  return {
    expr: parts.map((t) => nC(t.n, t.r)).join(' × '),
    nums: parts.map((t) => fmt(C(t.n, t.r))).join(' × '),
    value: parts.reduce((a, t) => a * C(t.n, t.r), 1),
  };
};
const groupNames = (k) => ['A', 'B', 'C', 'D'].slice(0, k).join(', ');

/* ---------- グループ ---------- */
const GROUPS = {
  line: { name: '並べる', desc: '順番や位置に意味がある（1列に並べる・整数をつくる・役職を決める）' },
  pick: { name: '選ぶ', desc: '組をつくるだけで、順番は関係ない（委員・試合・図形）' },
  split: { name: '分ける', desc: '人・部屋・組に配る（分け方・組分け）' },
};

/* ---------- パターン ----------
   cond: 問題文の条件 / idea: 考え方 / formula: 式 / ex, exA: 例と答え / short: クイズの選択肢 */
const PATTERNS = [
  /* ===== 並べる ===== */
  { id: 'L1', g: 'line', cond: '異なる n 個から r 個を選んで並べる', sign: '1列に並べる・委員長と副委員長',
    idea: '1番目から順に、残りの個数をかけていく', formula: nP('n', 'r'), short: '順列 ₙPᵣ',
    ex: '5人から3人を選んで1列に並べる', exA: `${nP(5, 3)} = 5 × 4 × 3 = 60通り`,
    gen() {
      const n = ri(5, 9), r = ri(2, 4);
      return { q: `${n}人の中から${r}人を選んで、1列に並べる方法は何通りあるか。`, ans: P(n, r),
        hint: `1番目は${n}通り、2番目は${n - 1}通り…と${r}個かける。`, steps: [permLine(n, r)] };
    } },
  { id: 'L2', g: 'line', cond: '異なる n 個をすべて並べる', sign: '全員が1列に並ぶ',
    idea: 'n から 1 までかける', formula: 'n!', short: '階乗 n!',
    ex: '4人が1列に並ぶ', exA: '4! = 4 × 3 × 2 × 1 = 24通り',
    gen() {
      const n = ri(4, 7);
      return { q: `異なる${n}冊の本を、本棚に1列に並べる方法は何通りあるか。`, ans: fact(n),
        hint: `${n}冊すべてを並べるので ${n}!`, steps: [factLine(n)] };
    } },
  { id: 'L3', g: 'line', cond: '特定のものが隣り合う', sign: '隣り合う・続いて並ぶ',
    idea: '隣り合うものを1つにまとめて並べ、まとめた中の並び方をかける',
    formula: '(まとめた後の個数)! × (中の個数)!', short: 'まとめて1つ × 中の並び',
    ex: 'A, B を含む5人で、A と B が隣り合う', exA: '4! × 2! = 24 × 2 = 48通り',
    gen() {
      const k = pick([2, 3]), n = ri(5, 7);
      const who = k === 2 ? 'A と B' : 'A, B, C の3人';
      const ans = fact(n - k + 1) * fact(k);
      return { q: `A, B${k === 3 ? ', C' : ''} を含む${n}人が1列に並ぶとき、${who}が隣り合う並び方は何通りあるか。`, ans,
        hint: `${who}をまとめて1人とみなそう。まとめた中の並び方も忘れずに。`,
        steps: [
          `${who}をまとめて1人とみると、${n - k + 1}人の並び方：${factLine(n - k + 1)}`,
          `まとめた${k}人の中の並び方：${factLine(k)}`,
          `${fmt(fact(n - k + 1))} × ${fact(k)} = ${fmt(ans)}`,
        ] };
    } },
  { id: 'L4', g: 'line', cond: '特定のものどうしが隣り合わない', sign: '隣り合わない・となりにならない',
    idea: 'ほかのものを先に並べ、その「間と両端」に入れる', formula: '(ほかの並び)! × <span class="nt"><sub>すき間</sub>P<sub>入れる数</sub></span>', short: '先に並べて、間と両端に入れる',
    ex: '男子4人、女子3人で、女子どうしが隣り合わない', exA: `4! × ${nP(5, 3)} = 24 × 60 = 1,440通り`,
    gen() {
      const a = ri(3, 5), b = ri(2, 3);
      const ans = fact(a) * P(a + 1, b);
      return { q: `男子${a}人、女子${b}人が1列に並ぶとき、女子どうしが隣り合わない並び方は何通りあるか。`, ans,
        hint: '先に男子を並べ、男子の間と両端に女子を入れよう。',
        steps: [
          `男子${a}人を並べる：${factLine(a)}`,
          `男子の間と両端の${a + 1}か所から${b}か所に女子を並べる：${permLine(a + 1, b)}`,
          `${fact(a)} × ${P(a + 1, b)} = ${fmt(ans)}`,
        ] };
    } },
  { id: 'L5', g: 'line', cond: '両端や特定の位置に条件がある', sign: '両端が〜・先頭が〜・〜番目が〜',
    idea: '条件のある位置を先に決め、残りを並べる', formula: '(条件の位置) × (残りの並び)', short: '条件のある位置を先に決める',
    ex: '男子3人、女子2人で、両端が男子', exA: `${nP(3, 2)} × 3! = 6 × 6 = 36通り`,
    gen() {
      const a = ri(3, 5), b = ri(2, 3);
      const ans = P(a, 2) * fact(a + b - 2);
      return { q: `男子${a}人、女子${b}人が1列に並ぶとき、両端が男子である並び方は何通りあるか。`, ans,
        hint: '条件のある「両端」から先に決めよう。',
        steps: [
          `両端に男子を並べる：${permLine(a, 2)}`,
          `残りの${a + b - 2}人を間に並べる：${factLine(a + b - 2)}`,
          `${P(a, 2)} × ${fmt(fact(a + b - 2))} = ${fmt(ans)}`,
        ] };
    } },
  { id: 'L6', g: 'line', cond: '一部のものの順序が決まっている', sign: 'A が B より左・この順に並ぶ',
    idea: '順序が決まったものを同じもの（□）とみなして並べ、□に左から順に入れる', formula: frac('n!', '(順序が決まった個数)!'), short: '同じものとみなす n!÷k!',
    ex: 'A, B を含む5人で、A が B より左', exA: `${frac('5!', '2!')} = 60通り`,
    gen() {
      const k = pick([2, 3]), n = ri(5, 7);
      const cond = k === 2 ? 'A が B より左にある' : 'A, B, C がこの順に左から並ぶ（間にほかの人が入ってもよい）';
      const ans = fact(n) / fact(k);
      return { q: `A, B${k === 3 ? ', C' : ''} を含む${n}人が1列に並ぶとき、${cond}並び方は何通りあるか。`, ans,
        hint: `順序が決まっている${k}人を同じもの「□」とみなそう。`,
        steps: [
          `${k === 2 ? 'A, B' : 'A, B, C'} を同じもの□とみなして${n}個を並べ、□に左から順に入れればよい。`,
          multiLine(n, [k]),
        ] };
    } },
  { id: 'L7', g: 'line', cond: '0 を含む数字で整数をつくる', sign: '0, 1, 2, … から〜けたの整数',
    idea: '最高位に 0 は置けない。最高位から先に決める', formula: '(0以外) × (残りの並び)', short: '最高位から決める（0に注意）',
    ex: '0〜4 の5個から異なる3個で3けたの整数', exA: `4 × ${nP(4, 2)} = 4 × 12 = 48個`,
    gen() {
      const n = ri(4, 7);
      const digits = Array.from({ length: n + 1 }, (_, i) => i).join(', ');
      const ans = n * P(n, 2);
      return { q: `${digits} の${n + 1}個の数字から異なる3個を使って、3けたの整数は何個つくれるか。`, ans, unit: '個',
        hint: '百の位に 0 は使えない。百の位から決めよう。',
        steps: [`百の位：0 以外の${n}通り`, `十の位・一の位：残りの${n}個から2個を並べる ${permLine(n, 2)}`, `${n} × ${P(n, 2)} = ${fmt(ans)}`] };
    } },
  { id: 'L8', g: 'line', cond: '円形に並べる', sign: '円形のテーブル・輪になる',
    idea: '回転して重なるものは同じ。1つを固定して残りを並べる', formula: '(n − 1)!', short: '円順列 (n−1)!',
    ex: '5人が円形に座る', exA: '(5 − 1)! = 4! = 24通り',
    gen() {
      const n = ri(4, 8);
      return { q: `${n}人が円形のテーブルのまわりに座る方法は何通りあるか。`, ans: fact(n - 1),
        hint: '1人を固定して、残りの人の並び方を考えよう。', steps: [`(${n} − 1)! = ${factLine(n - 1)}`] };
    } },
  { id: 'L9', g: 'line', cond: '円形で、裏返せる', sign: '首飾り・腕輪・ブレスレット',
    idea: '円順列のうち、裏返して同じになる2つを1通りとみなす', formula: frac('(n − 1)!', '2'), short: 'じゅず順列 (n−1)!÷2',
    ex: '色の異なる5個の玉で首飾り', exA: `${frac('4!', '2')} = 12通り`,
    gen() {
      const n = ri(5, 7);
      const ans = fact(n - 1) / 2;
      return { q: `色の異なる${n}個の玉に糸を通して、首飾りをつくる方法は何通りあるか。`, ans,
        hint: '円順列を求めて、裏返すと同じになる分を割ろう。',
        steps: [`円順列：(${n} − 1)! = ${fmt(fact(n - 1))}`, `裏返すと同じになるので2で割る：${fmt(fact(n - 1))} ÷ 2 = ${fmt(ans)}`] };
    } },
  { id: 'L10', g: 'line', cond: '同じものを含むものを並べる', sign: '文字の並べかえ（同じ文字がある）',
    idea: '全部の並べ方を、同じものどうしの入れかえ分で割る', formula: frac('n!', 'p! q! r! …'), short: '同じものを含む順列 n!÷(p!q!…)',
    ex: 'a, a, b, b, b を1列に並べる', exA: `${frac('5!', '2! × 3!')} = 10通り`,
    gen() {
      const word = pick(['BANANA', 'TOMATO', 'COFFEE', 'LETTER', 'SCHOOL', 'PEPPER', 'CANADA', 'BALLOON', 'COOKIE', 'APPLE']);
      const cnt = {};
      for (const ch of word) cnt[ch] = (cnt[ch] || 0) + 1;
      const counts = Object.values(cnt);
      return { q: `${word} の${word.length}文字をすべて1列に並べる方法は何通りあるか。`, ans: multiValue(word.length, counts),
        hint: 'まず、同じ文字が何個ずつあるかを数えよう。',
        steps: [`${Object.entries(cnt).map(([ch, c]) => `${ch} が${c}個`).join('、')}。`, multiLine(word.length, counts)] };
    } },
  { id: 'L11', g: 'line', cond: '同じものを何回使って並べてもよい', sign: '同じ数字を何回使ってもよい・じゃんけん',
    idea: '1か所ごとに n 通りずつ選べる', formula: pow('n', 'r'), short: '重複順列 nʳ',
    ex: '1〜4 の数字で3けたの整数（くり返しOK）', exA: `${pow(4, 3)} = 64個`,
    gen() {
      const n = ri(3, 6), r = ri(3, 4);
      return { q: `1 から ${n} までの${n}個の数字を使って${r}けたの整数をつくる。同じ数字を何回使ってもよいとき、何個つくれるか。`, ans: n ** r, unit: '個',
        hint: `どの位にも${n}通りの数字が使える。`, steps: [`各位に${n}通りずつ：${pow(n, r)} = ${fmt(n ** r)}`] };
    } },
  { id: 'L12', g: 'line', cond: '最短経路の道順', sign: '碁盤目の道・遠回りしない',
    idea: '右へ「→」と上へ「↑」の並べ方と同じ', formula: frac('(→の数 + ↑の数)!', '(→の数)! (↑の数)!'), short: '→と↑の並べ方（同じものを含む順列）',
    ex: '右へ4区画、上へ3区画', exA: `${frac('7!', '4! × 3!')} = 35通り`,
    gen() {
      const m = ri(3, 6), k = ri(2, 5);
      return { q: `碁盤目状の道で、A 地点から東へ${m}区画、北へ${k}区画はなれた B 地点まで、遠回りせずに行く道順は何通りあるか。`, ans: C(m + k, m),
        hint: '東へ1区画を「→」、北へ1区画を「↑」として、その並べ方を考えよう。',
        steps: [`「→」${m}個と「↑」${k}個の並べ方と同じ。`, `${frac(`${m + k}!`, `${m}! × ${k}!`)} = ${fmt(C(m + k, m))}（${nC(m + k, m)} でもよい）`] };
    } },

  /* ===== 選ぶ ===== */
  { id: 'S1', g: 'pick', cond: '異なる n 個から r 個を選ぶ', sign: '選ぶ・委員（役職なし）・組',
    idea: '並べた数を、選んだものの並べかえ r! で割る', formula: `${nC('n', 'r')} = ${frac(nP('n', 'r'), 'r!')}`, short: '組合せ ₙCᵣ',
    ex: '7人から3人の委員を選ぶ', exA: `${nC(7, 3)} = 35通り`,
    gen() {
      const n = ri(6, 12), r = ri(2, 4);
      return { q: `${n}人の中から${r}人の委員を選ぶ方法は何通りあるか。`, ans: C(n, r),
        hint: '選ぶだけで順番は関係ない。', steps: [combLine(n, r)] };
    } },
  { id: 'S2', g: 'pick', cond: '特定のものを必ず含む', sign: '必ず選ばれる・〜を含む',
    idea: '特定のものを先に入れ、残りの人数を残りから選ぶ', formula: nC('n−k', 'r−k'), short: '先に入れて、残りから選ぶ',
    ex: 'A を含む7人から3人、A は必ず選ぶ', exA: `${nC(6, 2)} = 15通り`,
    gen() {
      const n = ri(7, 10), r = ri(3, 5);
      return { q: `A, B を含む${n}人の中から${r}人を選ぶとき、A と B がともに選ばれる選び方は何通りあるか。`, ans: C(n - 2, r - 2),
        hint: 'A と B を先に入れておこう。',
        steps: ['A と B は先に選んでおく。', `残りの${n - 2}人から${r - 2}人を選ぶ：${combLine(n - 2, r - 2)}`] };
    } },
  { id: 'S3', g: 'pick', cond: '特定のものを含まない', sign: '選ばれない・〜を除く',
    idea: '特定のものを除いた残りから選ぶ', formula: nC('n−1', 'r'), short: '除いた残りから選ぶ',
    ex: 'A を含む7人から3人、A は選ばない', exA: `${nC(6, 3)} = 20通り`,
    gen() {
      const n = ri(7, 11), r = ri(3, 4);
      return { q: `A を含む${n}人の中から${r}人を選ぶとき、A が選ばれない選び方は何通りあるか。`, ans: C(n - 1, r),
        hint: 'A を除いた人たちから選べばよい。', steps: [`A を除いた${n - 1}人から${r}人を選ぶ：${combLine(n - 1, r)}`] };
    } },
  { id: 'S4', g: 'pick', cond: '種類ごとに選ぶ数が決まっている', sign: '男子2人と女子1人を選ぶ',
    idea: '種類ごとに選び方を求めてかける（積の法則）', formula: `${nC('a', 'x')} × ${nC('b', 'y')}`, short: '種類ごとに選んでかける',
    ex: '男子5人から2人、女子4人から1人', exA: `${nC(5, 2)} × ${nC(4, 1)} = 10 × 4 = 40通り`,
    gen() {
      const a = ri(4, 7), b = ri(3, 6), x = ri(1, 3), y = ri(1, 3);
      const ans = C(a, x) * C(b, y);
      return { q: `男子${a}人、女子${b}人の中から、男子${x}人と女子${y}人を選ぶ方法は何通りあるか。`, ans,
        hint: '男子の選び方と女子の選び方をかけよう。',
        steps: [`男子：${combLine(a, x)}`, `女子：${combLine(b, y)}`, `${C(a, x)} × ${C(b, y)} = ${fmt(ans)}`] };
    } },
  { id: 'S5', g: 'pick', cond: '「少なくとも1つ」含む', sign: '少なくとも1人・1つ以上',
    idea: '全体から「1つもない」場合を引く（余事象）', formula: '(全体) − (1つもない)', short: '全体 − 1つもない',
    ex: '男子4人、女子3人から3人、女子が少なくとも1人', exA: `${nC(7, 3)} − ${nC(4, 3)} = 35 − 4 = 31通り`,
    gen() {
      const a = ri(4, 6), b = ri(3, 5);
      const ans = C(a + b, 3) - C(a, 3);
      return { q: `男子${a}人、女子${b}人の中から3人を選ぶとき、女子が少なくとも1人含まれる選び方は何通りあるか。`, ans,
        hint: '全体から「女子が1人もいない（男子だけ）」を引こう。',
        steps: [`全体：${combLine(a + b, 3)}`, `男子だけ：${combLine(a, 3)}`, `${C(a + b, 3)} − ${C(a, 3)} = ${fmt(ans)}`] };
    } },
  { id: 'S6', g: 'pick', cond: '図形をつくる（点や線を選ぶ）', sign: '三角形の個数・対角線・平行四辺形',
    idea: '図形が決まるのに必要な点や線を選ぶ', formula: `三角形 ${nC('n', 3)}、対角線 ${nC('n', 2)} − n`, short: '点や線を選ぶ（図形）',
    ex: '八角形の対角線', exA: `${nC(8, 2)} − 8 = 28 − 8 = 20本`,
    gen() {
      const t = pick(['tri', 'diag', 'para']);
      if (t === 'tri') {
        const n = ri(6, 10);
        return { q: `正${n}角形の3個の頂点を結んでできる三角形は何個あるか。`, ans: C(n, 3), unit: '個',
          hint: '3つの頂点を選べば三角形が1つ決まる。', steps: [combLine(n, 3)] };
      }
      if (t === 'diag') {
        const n = ri(6, 12);
        return { q: `${n}角形の対角線は何本あるか。`, ans: C(n, 2) - n, unit: '本',
          hint: '2頂点を結ぶ線分の数から、辺の数を引こう。',
          steps: [`2頂点を結ぶ線分：${combLine(n, 2)}`, `辺の${n}本を除く：${C(n, 2)} − ${n} = ${C(n, 2) - n}`] };
      }
      const m = ri(3, 6), k = ri(3, 6);
      return { q: `${m}本の平行線と、それらに交わる${k}本の平行線がある。これらで囲まれる平行四辺形は何個あるか。`, ans: C(m, 2) * C(k, 2), unit: '個',
        hint: 'それぞれの組から2本ずつ選べば平行四辺形が1つ決まる。',
        steps: [`${combLine(m, 2)}、${combLine(k, 2)}`, `${C(m, 2)} × ${C(k, 2)} = ${fmt(C(m, 2) * C(k, 2))}`] };
    } },
  { id: 'S7', g: 'pick', cond: '同じ種類を何個選んでもよい', sign: '〜種類から〜個買う（選ばない種類があってもよい）',
    idea: '選ぶもの○と、種類の仕切り｜の並べ方を考える', formula: `${nH('n', 'r')} = ${nC('n+r−1', 'r')}`, short: '重複組合せ（○と｜）',
    ex: '3種類の果物から5個買う', exA: `○5個と｜2本 → ${nC(7, 2)} = 21通り`,
    gen() {
      const n = ri(4, 8);
      return { q: `りんご・みかん・かきの3種類の果物から、合わせて${n}個を買う。買わない種類があってもよいとき、買い方は何通りあるか。`, ans: C(n + 2, 2),
        hint: `果物${n}個を○、種類の区切りを｜2本として、並べ方を考えよう。`,
        steps: [`○${n}個と｜2本の並べ方と同じ。`, `${n + 2}か所から｜の2か所を選ぶ：${combLine(n + 2, 2)}`] };
    } },

  /* ===== 分ける ===== */
  { id: 'W1', g: 'split', cond: '異なるものを、区別のある人（部屋）に分ける。0個の人がいてもよい', sign: '異なる玉を3人に分ける・部屋に入れる',
    idea: '「もの」の1つ1つが、どこへ行くかを選ぶ（重複順列）', formula: '(人数)<sup>(ものの数)</sup>', short: '重複順列（行き先を選ぶ）',
    ex: '異なる5個の玉を3人に分ける', exA: `${pow(3, 5)} = 243通り（5<sup>3</sup> ではない）`,
    gen() {
      const n = ri(3, 6), k = pick([2, 3]);
      return { q: `異なる${n}個の玉を${k}人に分ける。1個ももらえない人がいてもよいとき、分け方は何通りあるか。`, ans: k ** n,
        hint: `玉1個ずつが、${k}人のだれのところへ行くかを選ぶ。`,
        steps: [`${n}個の玉それぞれに、行き先が${k}通りずつある。`, `${pow(k, n)} = ${fmt(k ** n)}`] };
    } },
  { id: 'W2', g: 'split', cond: '異なるものを、区別のある2つに分ける。どちらも1個以上', sign: 'どちらの部屋にも少なくとも1人',
    idea: '空があってもよい場合から、片方が空になる2通りを引く', formula: '2<sup>n</sup> − 2', short: '2ⁿ − 2（空になる2通りを引く）',
    ex: '5人を部屋 A, B に入れる（空き部屋なし）', exA: `${pow(2, 5)} − 2 = 30通り`,
    gen() {
      const n = ri(3, 7);
      return { q: `${n}人を A, B の2つの部屋に入れる。どちらの部屋にも1人以上が入るとき、入れ方は何通りあるか。`, ans: 2 ** n - 2,
        hint: '空き部屋があってもよい入れ方から、全員が A、全員が B の2通りを引こう。',
        steps: [`空き部屋があってもよい：${pow(2, n)} = ${2 ** n}`, `全員 A・全員 B の2通りを引く：${2 ** n} − 2 = ${2 ** n - 2}`] };
    } },
  { id: 'W3', g: 'split', cond: '異なるものを、区別のある3つに分ける。どれも1個以上', sign: '3人に分ける・どの人も1個以上',
    idea: '全体から「もらえない人がいる」場合を引く', formula: '3<sup>n</sup> − 3(2<sup>n</sup> − 2) − 3', short: '3ⁿ から空がある場合を引く',
    ex: '異なる4個の玉を3人に、全員1個以上', exA: '81 − 3 × 14 − 3 = 36通り',
    gen() {
      const n = ri(4, 6);
      const ans = 3 ** n - 3 * (2 ** n - 2) - 3;
      return { q: `異なる${n}個の玉を、3人の子どもに分ける。どの子どもも1個以上もらうとき、分け方は何通りあるか。`, ans,
        hint: '「1人だけもらえない」場合と「2人がもらえない」場合を、全体から引こう。',
        steps: [
          `全体（もらえない人がいてもよい）：${pow(3, n)} = ${3 ** n}`,
          `ちょうど1人がもらえない：その1人の選び方3通り × 残り2人に1個以上ずつ (${pow(2, n)} − 2) = 3 × ${2 ** n - 2} = ${3 * (2 ** n - 2)}`,
          '2人がもらえない（1人が全部もらう）：3通り',
          `${3 ** n} − ${3 * (2 ** n - 2)} − 3 = ${fmt(ans)}`,
        ] };
    } },
  { id: 'W4', g: 'split', cond: '異なるものを、区別のない2組に分ける。どちらも1個以上', sign: '2つのグループに分ける（名前なし）',
    idea: '区別のある2つに分けてから、組の入れかえ 2 で割る', formula: frac('2<sup>n</sup> − 2', '2'), short: '(2ⁿ − 2) ÷ 2',
    ex: '5人を2つのグループに分ける', exA: `${frac('32 − 2', '2')} = 15通り`,
    gen() {
      const n = ri(4, 7);
      return { q: `${n}人を2つのグループに分ける。グループに名前はなく、どちらのグループにも1人以上入るとき、分け方は何通りあるか。`, ans: (2 ** n - 2) / 2,
        hint: 'まず A, B の区別をつけて数え、あとで2で割ろう。',
        steps: [`A, B の区別をつけると：${pow(2, n)} − 2 = ${2 ** n - 2}`, `A と B の区別をなくすので2で割る：${2 ** n - 2} ÷ 2 = ${(2 ** n - 2) / 2}`] };
    } },
  { id: 'W5', g: 'split', cond: '区別のある組に、人数を決めて分ける', sign: 'A 組に3人、B 組に…',
    idea: '組ごとに順に選んでかける（組合せの積）', formula: `${nC('n', 'a')} × ${nC('n−a', 'b')} × …`, short: '組合せの積（割らない）',
    ex: '6人を A 組2人、B 組2人、C 組2人', exA: `${nC(6, 2)} × ${nC(4, 2)} × ${nC(2, 2)} = 90通り`,
    gen() {
      const [n, sizes] = pick([[9, [3, 3, 3]], [6, [2, 2, 2]], [8, [4, 2, 2]], [7, [3, 2, 2]], [9, [4, 3, 2]], [8, [4, 4]]]);
      const s = splitLines(n, sizes);
      const names = groupNames(sizes.length).split(', ');
      return { q: `${n}人を、${sizes.map((x, i) => `${names[i]} 組に${x}人`).join('、')}に分ける方法は何通りあるか。`, ans: s.value,
        hint: 'A 組から順に選んでかけよう。組に名前があるので割らない。',
        steps: [`${s.expr}`, `= ${s.nums} = ${fmt(s.value)}`] };
    } },
  { id: 'W6', g: 'split', cond: '区別のない組に、同じ人数ずつ分ける', sign: '〜人ずつ〜組に分ける（組に名前なし）',
    idea: '区別のある組として数え、同じ人数の組の入れかえ（組の数）! で割る', formula: frac('(組合せの積)', '(組の数)!'), short: '組合せの積 ÷ (組の数)!',
    ex: '6人を2人ずつ3組に分ける', exA: `${frac('90', '3!')} = 15通り`,
    gen() {
      const [n, s, k] = pick([[6, 2, 3], [9, 3, 3], [8, 4, 2], [6, 3, 2], [8, 2, 4], [4, 2, 2]]);
      const sp = splitLines(n, Array(k).fill(s));
      const ans = sp.value / fact(k);
      return { q: `${n}人を${s}人ずつ${k}つの組に分ける方法は何通りあるか。（組に名前はない）`, ans,
        hint: `まず組に名前をつけて数え、組の入れかえ ${k}! で割ろう。`,
        steps: [`組に名前をつけると：${sp.expr} = ${fmt(sp.value)}`, `名前の入れかえ ${k}! = ${fact(k)} 通りずつ同じなので割る：${fmt(sp.value)} ÷ ${fact(k)} = ${fmt(ans)}`] };
    } },
  { id: 'W7', g: 'split', cond: '区別のない組だが、人数がすべてちがう', sign: '2人、3人、4人の3組に分ける',
    idea: '人数で組の区別がつくので、組合せの積のまま（割らない）', formula: `${nC('n', 'a')} × ${nC('n−a', 'b')} × …`, short: '人数がちがうので割らない',
    ex: '6人を1人、2人、3人の3組に分ける', exA: `${nC(6, 1)} × ${nC(5, 2)} = 6 × 10 = 60通り`,
    gen() {
      const [n, sizes] = pick([[6, [3, 2, 1]], [9, [4, 3, 2]], [7, [4, 2, 1]], [10, [5, 3, 2]], [5, [3, 2]]]);
      const s = splitLines(n, sizes);
      return { q: `${n}人を、${sizes.join('人、')}人の${sizes.length}つの組に分ける方法は何通りあるか。（組に名前はない）`, ans: s.value,
        hint: '人数がちがうので、組に名前がなくても区別がつく。割らなくてよい。',
        steps: [`人数のちがいで組が区別できるので、順に選んでかける。`, `${s.expr} = ${s.nums} = ${fmt(s.value)}`] };
    } },
  { id: 'W8', g: 'split', cond: '同じものを人に分ける。0個の人がいてもよい', sign: '同じりんごを3人に分ける・x+y+z=n（0以上）',
    idea: 'もの○と、人の仕切り｜（人数−1 本）の並べ方', formula: nC('n+k−1', 'k−1'), short: '重複組合せ（○と｜を並べる）',
    ex: '同じりんご6個を3人に分ける（0個OK）', exA: `${nC(8, 2)} = 28通り`,
    gen() {
      const n = ri(4, 9), k = pick([3, 4]);
      return { q: `同じ種類のみかん${n}個を${k}人に分ける。1個ももらえない人がいてもよいとき、分け方は何通りあるか。`, ans: C(n + k - 1, k - 1),
        hint: `みかんを○、人の区切りを｜（${k - 1}本）として、並べ方を考えよう。`,
        steps: [`○${n}個と｜${k - 1}本の並べ方と同じ。`, `${n + k - 1}か所から｜の${k - 1}か所を選ぶ：${combLine(n + k - 1, k - 1)}`] };
    } },
  { id: 'W9', g: 'split', cond: '同じものを人に分ける。全員1個以上', sign: 'どの人も1個以上・x+y+z=n（正の整数）',
    idea: '○を並べ、○と○の「間」に仕切りを入れる', formula: nC('n−1', 'k−1'), short: '○の間に仕切りを入れる',
    ex: '同じりんご6個を3人に、全員1個以上', exA: `${nC(5, 2)} = 10通り`,
    gen() {
      const k = pick([3, 4]), n = ri(k + 2, 10);
      return { q: `同じ種類のみかん${n}個を${k}人に分ける。どの人も1個以上もらうとき、分け方は何通りあるか。`, ans: C(n - 1, k - 1),
        hint: `○を${n}個並べ、間の${n - 1}か所から仕切りを入れる場所を選ぼう。`,
        steps: [`○${n}個の間の${n - 1}か所から、仕切りを入れる${k - 1}か所を選ぶ。`, combLine(n - 1, k - 1)] };
    } },
];

/* ---------- 見分ける手順・共通の考え方・まちがえやすい点 ---------- */
const FLOW = [
  { step: 'STEP 1', title: '何をする問題？', body: '<b>並べる</b>（順番・位置に意味がある）／<b>選ぶ</b>（組をつくるだけ）／<b>分ける</b>（人・部屋・組に配る）' },
  { step: 'STEP 2', title: 'もの は区別できる？', body: '同じものがある → <b>同じものを含む順列</b>（並べる）・<b>重複組合せ</b>（選ぶ・分ける）' },
  { step: 'STEP 3', title: 'くり返して使える？', body: '同じものを何回使ってもよい → <b>重複順列 nʳ</b>（並べる）・<b>重複組合せ</b>（選ぶ）' },
  { step: 'STEP 4', title: '条件をチェック', body: '隣り合う・隣り合わない・両端・順序が決まる・円形・0を含む・少なくとも・必ず含む・空があってよいか・組に名前があるか' },
];

const TOOLS = [
  ['積の法則', '「〜して、さらに〜」は、それぞれの数をかける'],
  ['和の法則', '同時に起こらない場合に分けたら、足す'],
  ['余事象', '「少なくとも」は、全体から「1つもない」を引く'],
  ['まとめる', '隣り合うものは1つにまとめ、中の並びをかける'],
  ['間に入れる', '隣り合わないものは、ほかを並べた間と両端に入れる'],
  ['先に決める', '条件のある位置・ものから先に決める'],
  ['同じものとみなす', '順序が決まったものは □ とみなして割る'],
  ['区別をつけて割る', '区別のない組は、区別をつけて数えてから入れかえ分で割る'],
];

const PITFALLS = [
  '隣り合う：まとめた中の並び方（2! など）をかけ忘れない',
  '異なる n 個を k 人に分ける：k<sup>n</sup>（n<sup>k</sup> ではない）。「もの」が行き先を選ぶ',
  '組分け：組に名前がなく同じ人数の組があるときだけ、その組の数の階乗で割る',
  '分ける問題：「0個（空）があってもよいか」で式が変わる',
  '円順列：回転して重なるものは同じ。首飾りなど裏返せるものはさらに ÷2',
  '0 を含む数字の整数：最高位に 0 を置かない',
];
