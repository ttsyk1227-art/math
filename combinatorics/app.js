'use strict';

const $ = (sel, el = document) => el.querySelector(sel);

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
const permLine = (n, r) => (r === 0 ? `${nP(n, 0)} = 1` : `${nP(n, r)} = ${prod(n, r)} = ${fmt(P(n, r))}`);
const combLine = (n, r) => {
  const s = Math.min(r, n - r);
  const head = s !== r ? `${nC(n, r)} = ${nC(n, s)} = ` : `${nC(n, r)} = `;
  if (s === 0) return `${head}1`;
  if (s === 1) return `${head}${n}`;
  return `${head}${frac(prod(n, s), prod(s, s))} = ${fmt(C(n, r))}`;
};
// 同じものを含む順列 total! / (c1! c2! …)
const multiValue = (total, counts) => fact(total) / counts.reduce((a, c) => a * fact(c), 1);
const multiLine = (total, counts) => {
  const rep = counts.filter((c) => c >= 2);
  const den = rep.reduce((a, c) => a * fact(c), 1);
  return `${frac(`${total}!`, rep.map((c) => `${c}!`).join(' × '))} = ${frac(fmt(fact(total)), fmt(den))} = ${fmt(multiValue(total, counts))}`;
};
const pathLine = (x, y) => `${frac(`${x + y}!`, `${x}! × ${y}!`)} = ${fmt(C(x + y, x))}`;

// 碁盤目の道の図。A は左下、B は右上、p = [x, y] は途中の点 P
function gridFig(m, n, p) {
  const s = 34, pad = 24;
  const w = m * s + pad * 2, h = n * s + pad * 2;
  const X = (i) => pad + i * s, Y = (j) => pad + (n - j) * s;
  let lines = '';
  for (let i = 0; i <= m; i++) lines += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(n)}"/>`;
  for (let j = 0; j <= n; j++) lines += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(m)}" y2="${Y(j)}"/>`;
  const dot = (i, j, label, dx, dy) =>
    `<circle cx="${X(i)}" cy="${Y(j)}" r="4.5"/><text x="${X(i) + dx}" y="${Y(j) + dy}">${label}</text>`;
  const pts = dot(0, 0, 'A', -18, 18) + dot(m, n, 'B', 7, -8) + (p ? dot(p[0], p[1], 'P', 6, -7) : '');
  return `<svg class="grid-fig" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="横${m}区画、縦${n}区画の碁盤目状の道">${lines}${pts}</svg>`;
}

const TOPICS = {
  perm: '順列',
  comb: '組合せ',
  circ: '円順列',
  rep: '重複順列',
  same: '同じものを含む順列',
  hcomb: '重複組合せ',
};

/* ---------- 文章題の問題パターン ----------
   make() は { q, ans, unit?, hint, why, steps, fig? } を返す */
const GENS = [
  // 順列
  { topic: 'perm', level: 1, make() {
    const n = ri(5, 9), r = ri(2, 4);
    return {
      q: `${n}人の中から${r}人を選んで、1列に並べる方法は何通りありますか。`,
      ans: P(n, r),
      hint: `1番目に並ぶ人は${n}通り、2番目は残りの${n - 1}通り…と考えよう。`,
      why: '選んだ人を「1列に並べる」ので、順番の区別がある → 順列',
      steps: ['並べる順番が区別されるので順列。', permLine(n, r)],
    };
  } },
  { topic: 'perm', level: 1, make() {
    const n = ri(5, 10);
    return {
      q: `${n}人の中から、委員長・副委員長・書記を1人ずつ選ぶ方法は何通りありますか。`,
      ans: P(n, 3),
      hint: '委員長 → 副委員長 → 書記 の順に決めていこう。',
      why: '役職がちがうので、だれがどの役になるかで区別される → 順列',
      steps: ['3つの役職は区別されるので、3人を選んで並べるのと同じ。', permLine(n, 3)],
    };
  } },
  { topic: 'perm', level: 1, make() {
    const n = ri(5, 9), r = ri(3, 4);
    return {
      q: `1 から ${n} までの${n}個の数字から異なる${r}個を使って、${r}けたの整数は何個作れますか。`,
      ans: P(n, r), unit: '個',
      hint: '上の位から順に、使える数字が何通りあるかを考えよう。',
      why: '数字を置く位（けた）が区別される → 順列',
      steps: ['異なる数字を各位に並べるので順列。', permLine(n, r)],
    };
  } },
  { topic: 'perm', level: 1, make() {
    const n = ri(4, 7);
    return {
      q: `${n}人が1列に並ぶ方法は何通りありますか。`,
      ans: fact(n),
      hint: `${n}人全員を並べるので ${n}! になるよ。`,
      why: '全員を1列に並べる（順番あり）→ 順列',
      steps: [`全員を並べるので ${nP(n, n)} = ${n}!`, factLine(n)],
    };
  } },
  { topic: 'perm', level: 2, make() {
    const n = ri(4, 7);
    const digits = Array.from({ length: n + 1 }, (_, i) => i).join(', ');
    return {
      q: `${digits} の${n + 1}個の数字から異なる3個を使って、3けたの整数は何個作れますか。`,
      ans: n * P(n, 2), unit: '個',
      hint: '百の位に 0 は使えない。百の位から先に決めよう。',
      why: '数字を各位に並べる → 順列（ただし先頭の 0 に注意）',
      steps: [
        `百の位：0 以外の${n}通り`,
        `十の位・一の位：残りの${n}個から2個を並べる ${permLine(n, 2)}通り`,
        `${n} × ${P(n, 2)} = ${fmt(n * P(n, 2))}`,
      ],
    };
  } },
  { topic: 'perm', level: 2, make() {
    const a = ri(2, 4), b = ri(2, 3);
    const ans = fact(a + 1) * fact(b);
    return {
      q: `男子${a}人、女子${b}人が1列に並ぶとき、女子${b}人が隣り合う並び方は何通りありますか。`,
      ans,
      hint: '隣り合う女子をひとまとめにして「1人」とみなそう。',
      why: '1列に並べる（順番あり）→ 順列。隣り合う人は「ひとまとめ」にする',
      steps: [
        `女子${b}人をひとまとめにすると、${a + 1}人の並び方：${factLine(a + 1)}通り`,
        `まとめた女子${b}人の中での並び方：${factLine(b)}通り`,
        `${fmt(fact(a + 1))} × ${fact(b)} = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'perm', level: 2, make() {
    const a = ri(2, 4), b = ri(2, 3);
    const ans = P(a, 2) * fact(a + b - 2);
    return {
      q: `男子${a}人、女子${b}人が1列に並ぶとき、両端が男子である並び方は何通りありますか。`,
      ans,
      hint: '条件のある「両端」を先に決めよう。',
      why: '1列に並べる（順番あり）→ 順列。条件のある場所から決める',
      steps: [
        `両端に男子を並べる：${permLine(a, 2)}通り`,
        `残りの${a + b - 2}人を間に並べる：${factLine(a + b - 2)}通り`,
        `${P(a, 2)} × ${fmt(fact(a + b - 2))} = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'perm', level: 2, make() {
    const a = ri(3, 4), b = ri(2, 3);
    const ans = fact(a) * P(a + 1, b);
    return {
      q: `男子${a}人、女子${b}人が1列に並ぶとき、女子どうしが隣り合わない並び方は何通りありますか。`,
      ans,
      hint: '先に男子を並べ、男子の「間と両端」に女子を入れよう。',
      why: '1列に並べる（順番あり）→ 順列。「隣り合わない」は間に入れる',
      steps: [
        `男子${a}人を並べる：${factLine(a)}通り`,
        `男子の間と両端の${a + 1}か所から${b}か所を選んで女子を並べる：${permLine(a + 1, b)}通り`,
        `${fact(a)} × ${P(a + 1, b)} = ${fmt(ans)}`,
      ],
    };
  } },

  // 組合せ
  { topic: 'comb', level: 1, make() {
    const n = ri(5, 12), r = ri(2, 4);
    return {
      q: `${n}人の中から${r}人の委員を選ぶ方法は何通りありますか。`,
      ans: C(n, r),
      hint: `選ぶだけで並べないので、${nP(n, r)} を ${r}! で割るよ。`,
      why: '委員は選ぶだけで、順番や役割は関係ない → 組合せ',
      steps: ['選ぶだけなので組合せ。', combLine(n, r)],
    };
  } },
  { topic: 'comb', level: 1, make() {
    const n = ri(4, 10);
    return {
      q: `${n}チームが、どのチームとも1回ずつ試合をする（総当たり戦）とき、試合数は全部で何試合ですか。`,
      ans: C(n, 2), unit: '試合',
      hint: '1試合は「2チームの組」で決まる。',
      why: '試合は2チームを選ぶだけ（A対B と B対A は同じ）→ 組合せ',
      steps: [`${n}チームから2チームを選ぶ組合せ。`, combLine(n, 2)],
    };
  } },
  { topic: 'comb', level: 1, make() {
    const n = ri(5, 10);
    return {
      q: `円周上に${n}個の点があります。このうち3個の点を頂点とする三角形は何個できますか。`,
      ans: C(n, 3), unit: '個',
      hint: '3つの点を選べば、三角形が1つ決まる。',
      why: '3点を選べば三角形が決まり、選ぶ順番は関係ない → 組合せ',
      steps: [`${n}個から3個を選ぶ組合せ。`, combLine(n, 3)],
    };
  } },
  { topic: 'comb', level: 2, make() {
    const a = ri(4, 7), b = ri(3, 6), x = ri(1, 3), y = ri(1, 3);
    const ans = C(a, x) * C(b, y);
    return {
      q: `男子${a}人、女子${b}人の中から、男子${x}人と女子${y}人を選ぶ方法は何通りありますか。`,
      ans,
      hint: '男子の選び方と女子の選び方をそれぞれ求めて、かけ算（積の法則）。',
      why: '選ぶだけ → 組合せ。男子と女子を別々に選んでかける',
      steps: [
        `男子の選び方：${combLine(a, x)}通り`,
        `女子の選び方：${combLine(b, y)}通り`,
        `積の法則より ${C(a, x)} × ${C(b, y)} = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'comb', level: 2, make() {
    const n = ri(5, 12);
    const ans = C(n, 2) - n;
    return {
      q: `${n}角形の対角線は何本ありますか。`,
      ans, unit: '本',
      hint: '2つの頂点を結ぶ線分の数から、辺の数を引こう。',
      why: '2つの頂点を選べば線分が決まる → 組合せ',
      steps: [
        `2つの頂点を結ぶ線分：${combLine(n, 2)}本`,
        `このうち${n}本は辺なので除く：${C(n, 2)} − ${n} = ${ans}`,
      ],
    };
  } },
  { topic: 'comb', level: 2, make() {
    const n = ri(6, 10), r = ri(3, 4);
    return {
      q: `A を含む${n}人の中から${r}人を選ぶとき、A が必ず選ばれる選び方は何通りありますか。`,
      ans: C(n - 1, r - 1),
      hint: 'A は先に選んでおき、残りの人数を残りの人から選ぼう。',
      why: '選ぶだけ → 組合せ。必ず入る人は先に入れておく',
      steps: ['A は先に選んでおく。', `残りの${n - 1}人から${r - 1}人を選ぶ：${combLine(n - 1, r - 1)}`],
    };
  } },
  { topic: 'comb', level: 2, make() {
    const a = ri(4, 6), b = ri(3, 5);
    const ans = C(a + b, 3) - C(a, 3);
    return {
      q: `男子${a}人、女子${b}人の中から3人を選ぶとき、女子が少なくとも1人含まれる選び方は何通りありますか。`,
      ans,
      hint: '「少なくとも」は、全体から「女子が1人もいない場合」を引くと楽。',
      why: '選ぶだけ → 組合せ。「少なくとも」は全体から引く',
      steps: [
        `全体：${combLine(a + b, 3)}通り`,
        `女子が1人もいない（男子だけ）：${combLine(a, 3)}通り`,
        `${C(a + b, 3)} − ${C(a, 3)} = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'comb', level: 2, make() {
    const m = ri(3, 6), n = ri(3, 6);
    const ans = C(m, 2) * C(n, 2);
    return {
      q: `${m}本の平行線と、それらに交わる${n}本の平行線があります。これらの線で囲まれる平行四辺形は何個ありますか。`,
      ans, unit: '個',
      hint: 'それぞれの組から2本ずつ選べば、平行四辺形が1つ決まる。',
      why: '線を選ぶだけで順番は関係ない → 組合せ',
      steps: [
        `${m}本から2本を選ぶ：${combLine(m, 2)}`,
        `${n}本から2本を選ぶ：${combLine(n, 2)}`,
        `${C(m, 2)} × ${C(n, 2)} = ${fmt(ans)}`,
      ],
    };
  } },

  // 円順列
  { topic: 'circ', level: 1, make() {
    const n = ri(4, 8);
    return {
      q: `${n}人が円形のテーブルのまわりに座る方法は何通りありますか。`,
      ans: fact(n - 1),
      hint: '1人の席を固定して、残りの人の並び方を考えよう。',
      why: '円形に並べるので、回転して同じものは1通り → 円順列',
      steps: [`円順列なので (${n} − 1)! で求める。`, factLine(n - 1)],
    };
  } },
  { topic: 'circ', level: 1, make() {
    const n = ri(4, 7);
    return {
      q: `色の異なる${n}個の玉を、円形に並べる方法は何通りありますか。`,
      ans: fact(n - 1),
      hint: '1つの玉を固定して考えよう。',
      why: '円形に並べる → 円順列',
      steps: [`円順列なので (${n} − 1)! で求める。`, factLine(n - 1)],
    };
  } },
  { topic: 'circ', level: 2, make() {
    const n = ri(5, 8);
    const ans = fact(n - 2) * 2;
    return {
      q: `${n}人が円形に並ぶとき、特定の2人 A, B が隣り合う並び方は何通りありますか。`,
      ans,
      hint: 'A と B をひとまとめにして考えよう。',
      why: '円形に並べる → 円順列。隣り合う2人はひとまとめ',
      steps: [
        `A, B をひとまとめにすると${n - 1}人の円順列：(${n - 1} − 1)! = ${factLine(n - 2)}`,
        'A と B の入れかえ：2! = 2',
        `${fmt(fact(n - 2))} × 2 = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'circ', level: 2, make() {
    const k = ri(2, 4);
    const ans = fact(k - 1) * fact(k);
    return {
      q: `男子${k}人と女子${k}人が円形に並ぶとき、男女が交互に並ぶ方法は何通りありますか。`,
      ans,
      hint: '先に男子を円形に並べ、その間に女子を入れよう。',
      why: '円形に並べる → 円順列。先に片方を並べて間に入れる',
      steps: [
        `男子${k}人を円形に並べる：(${k} − 1)! = ${factLine(k - 1)}`,
        `男子の間の${k}か所に女子を並べる：${factLine(k)}`,
        `${fact(k - 1)} × ${fact(k)} = ${fmt(ans)}`,
      ],
    };
  } },
  { topic: 'circ', level: 2, make() {
    const n = ri(5, 7);
    const ans = fact(n - 1) / 2;
    return {
      q: `色の異なる${n}個の玉に糸を通して首飾りを作ります。何通りの首飾りができますか。`,
      ans,
      hint: '円順列を求めてから、裏返すと同じになる分を考えよう。',
      why: '円形で、さらに裏返せる → じゅず順列（円順列 ÷ 2）',
      steps: [
        `円順列：(${n} − 1)! = ${fmt(fact(n - 1))}`,
        '首飾りは裏返すと同じになるものが2つずつあるので、2で割る（じゅず順列）。',
        `${fmt(fact(n - 1))} ÷ 2 = ${fmt(ans)}`,
      ],
    };
  } },

  // 重複順列
  { topic: 'rep', level: 1, make() {
    const r = ri(2, 5);
    return {
      q: `${r}人がじゃんけんを1回するとき、グー・チョキ・パーの出し方は全部で何通りありますか。`,
      ans: 3 ** r,
      hint: '1人目は3通り、2人目も3通り、…',
      why: 'どの人も同じ手を出してよい（くり返しOK）→ 重複順列',
      steps: [`1人につき3通りずつ。同じ手を何人が出してもよい。`, `${pow(3, r)} = ${fmt(3 ** r)}`],
    };
  } },
  { topic: 'rep', level: 1, make() {
    const n = ri(3, 6), r = ri(2, 4);
    return {
      q: `1 から ${n} までの${n}個の数字を使って${r}けたの整数を作ります。同じ数字を何回使ってもよいとき、何個作れますか。`,
      ans: n ** r, unit: '個',
      hint: `どの位にも${n}通りの数字が使える。`,
      why: '同じ数字を何回使ってもよい → 重複順列',
      steps: [`各位に${n}通りずつ。`, `${pow(n, r)} = ${fmt(n ** r)}`],
    };
  } },
  { topic: 'rep', level: 1, make() {
    const r = ri(4, 8);
    return {
      q: `○か×で答える問題が${r}問あります。○×の答え方は全部で何通りありますか。`,
      ans: 2 ** r,
      hint: '1問につき ○ か × の2通り。',
      why: '各問で ○ か × を何回でも選べる → 重複順列',
      steps: ['1問につき2通りずつ。', `${pow(2, r)} = ${fmt(2 ** r)}`],
    };
  } },
  { topic: 'rep', level: 1, make() {
    const k = ri(2, 3), r = ri(3, 5);
    const rooms = k === 2 ? 'A, B' : 'A, B, C';
    return {
      q: `${r}人を ${rooms} の${k}つの部屋に入れます。空き部屋があってもよいとき、入れ方は何通りありますか。`,
      ans: k ** r,
      hint: '1人ずつ「どの部屋に入るか」を選ぶと考えよう。',
      why: '何人が同じ部屋を選んでもよい → 重複順列',
      steps: [`それぞれの人が${k}通りの部屋を選ぶ。`, `${pow(k, r)} = ${fmt(k ** r)}`],
    };
  } },
  { topic: 'rep', level: 1, make() {
    const n = ri(3, 7);
    const els = 'abcdefg'.slice(0, n).split('').join(', ');
    return {
      q: `集合 {${els}} の部分集合は、空集合も含めて何個ありますか。`,
      ans: 2 ** n, unit: '個',
      hint: '各要素について「入れる」「入れない」の2通り。',
      why: '各要素ごとに2通りをくり返し選ぶ → 重複順列',
      steps: [`${n}個の要素それぞれについて、入れる・入れないの2通り。`, `${pow(2, n)} = ${fmt(2 ** n)}`],
    };
  } },
  { topic: 'rep', level: 2, make() {
    const r = ri(3, 6);
    return {
      q: `${r}人を A, B の2つの部屋に入れます。どちらの部屋にも少なくとも1人が入るとき、入れ方は何通りありますか。`,
      ans: 2 ** r - 2,
      hint: '空き部屋があってもよい場合から、空き部屋ができる場合を引こう。',
      why: '各人が部屋をくり返し選べる → 重複順列。「空き部屋なし」は引き算',
      steps: [
        `空き部屋があってもよい入れ方：${pow(2, r)} = ${2 ** r}通り`,
        '全員が A に入る場合と、全員が B に入る場合の2通りを除く。',
        `${2 ** r} − 2 = ${2 ** r - 2}`,
      ],
    };
  } },

  // 同じものを含む順列
  { topic: 'same', level: 1, make() {
    let p, q, s;
    do { p = ri(2, 4); q = ri(1, 3); s = ri(0, 2); } while (p + q + s > 8 || p + q + s < 4);
    const tot = p + q + s;
    const counts = [p, q, s].filter((c) => c > 0);
    return {
      q: `a を${p}個、b を${q}個${s ? `、c を${s}個` : ''}、合わせて${tot}個の文字を1列に並べる方法は何通りありますか。`,
      ans: multiValue(tot, counts),
      hint: `${tot}! を、同じ文字の個数の階乗で割ろう。`,
      why: '並べるものに同じ文字が含まれる → 同じものを含む順列',
      steps: ['同じ文字どうしを入れかえても並びは変わらないので、その分を割る。', multiLine(tot, counts)],
    };
  } },
  { topic: 'same', level: 1, make() {
    const word = pick(['BANANA', 'APPLE', 'TOMATO', 'COFFEE', 'LETTER', 'SCHOOL', 'PEPPER', 'CANADA', 'BALLOON', 'COOKIE', 'TOKYO', 'OSAKA']);
    const cnt = {};
    for (const ch of word) cnt[ch] = (cnt[ch] || 0) + 1;
    const counts = Object.values(cnt);
    const detail = Object.entries(cnt).map(([ch, c]) => `${ch} が${c}個`).join('、');
    return {
      q: `${word} の${word.length}文字をすべて1列に並べる方法は何通りありますか。`,
      ans: multiValue(word.length, counts),
      hint: 'まず、同じ文字が何個ずつあるかを数えよう。',
      why: '並べる文字の中に同じ文字がある → 同じものを含む順列',
      steps: [`${detail}。`, multiLine(word.length, counts)],
    };
  } },
  { topic: 'same', level: 1, make() {
    const m = ri(2, 5), n = ri(2, 4);
    return {
      q: '下の図のような碁盤目状の道があります。A から B まで遠回りせずに行く道順（最短経路）は何通りありますか。',
      fig: gridFig(m, n),
      ans: C(m + n, m),
      hint: '右へ1区画を「→」、上へ1区画を「↑」として、その並べ方を考えよう。',
      why: `→ と ↑ という同じものを含む並べ方 → 同じものを含む順列（${nC(m + n, m)} でも求められる）`,
      steps: [
        `最短経路は、「→」${m}個と「↑」${n}個を1列に並べる並べ方と同じ。`,
        pathLine(m, n),
      ],
    };
  } },
  { topic: 'same', level: 2, make() {
    const m = ri(3, 5), n = ri(2, 4), px = ri(1, m - 1), py = ri(1, n - 1);
    const a = C(px + py, px), b = C(m - px + n - py, m - px);
    return {
      q: '下の図のような碁盤目状の道があります。A から B まで遠回りせずに行くとき、P を通る道順は何通りありますか。',
      fig: gridFig(m, n, [px, py]),
      ans: a * b,
      hint: 'A → P と P → B に分けて、それぞれの道順をかけよう。',
      why: '→ と ↑ の並べ方 → 同じものを含む順列。途中の点で分けてかける',
      steps: [
        `A → P：「→」${px}個と「↑」${py}個の並べ方 ${pathLine(px, py)}`,
        `P → B：「→」${m - px}個と「↑」${n - py}個の並べ方 ${pathLine(m - px, n - py)}`,
        `${a} × ${b} = ${fmt(a * b)}`,
      ],
    };
  } },

  // 重複組合せ（発展）
  { topic: 'hcomb', level: 1, make() {
    const k = pick([3, 4]), n = ri(4, 8);
    const names = ['りんご', 'みかん', 'かき', 'なし'].slice(0, k).join('・');
    return {
      q: `${names}の${k}種類の果物の中から、合わせて${n}個を買います。買わない種類があってもよいとき、買い方は何通りありますか。（同じ種類の果物は区別しない）`,
      ans: C(n + k - 1, k - 1),
      hint: `果物${n}個を○、種類の区切りを｜（${k - 1}本）として並べ方を考えよう。`,
      why: '同じ種類を何個選んでもよく、順番は関係ない → 重複組合せ',
      steps: [
        `○${n}個と仕切り｜${k - 1}本を1列に並べる並べ方と同じ（仕切りで種類を区切る）。`,
        `${n + k - 1}か所から仕切りの${k - 1}か所を選ぶ：${nH(k, n)} = ${combLine(n + k - 1, k - 1)}`,
      ],
    };
  } },
  { topic: 'hcomb', level: 1, make() {
    const n = ri(4, 10);
    return {
      q: `x + y + z = ${n} を満たす 0 以上の整数の組 (x, y, z) は何組ありますか。`,
      ans: C(n + 2, 2), unit: '組',
      hint: `${n}個の○を、2本の仕切りで x, y, z の3つに分けると考えよう。`,
      why: 'x, y, z に1を何個ずつ配ってもよい → 重複組合せ',
      steps: [
        `○${n}個と仕切り2本の並べ方と同じ。`,
        `${n + 2}か所から仕切りの2か所を選ぶ：${combLine(n + 2, 2)}`,
      ],
    };
  } },
  { topic: 'hcomb', level: 2, make() {
    const n = ri(5, 12);
    return {
      q: `x + y + z = ${n} を満たす正の整数の組 (x, y, z) は何組ありますか。`,
      ans: C(n - 1, 2), unit: '組',
      hint: `どれも1以上なので、○${n}個を並べ、○と○の「間」に仕切りを入れよう。`,
      why: '数を3つに分ける → 重複組合せの考え方。「1以上」は間に仕切り',
      steps: [
        `○を${n}個並べ、間の${n - 1}か所から仕切りを入れる2か所を選ぶ（同じ間に2本は入れない）。`,
        combLine(n - 1, 2),
      ],
    };
  } },
];

/* ---------- 計算トレーニングの問題 ---------- */
const CALC = {
  fact() {
    const n = ri(0, 7);
    return {
      label: '階乗',
      q: `<span class="big">${n}!</span>`,
      ans: fact(n), unit: '',
      hint: n === 0 ? '0! は 1 と約束されている。' : `${n} から 1 まで順にかけよう。`,
      steps: [factLine(n)],
    };
  },
  perm() {
    const n = ri(3, 10);
    const r = n <= 6 && Math.random() < 0.2 ? n : ri(1, Math.min(4, n));
    return {
      label: '順列',
      q: `<span class="big">${nP(n, r)}</span>`,
      ans: P(n, r), unit: '',
      hint: `${n} から1ずつ減らしながら、${r}個かけよう。`,
      steps: [permLine(n, r)],
    };
  },
  comb() {
    const n = ri(4, 12);
    const r = Math.random() < 0.5 ? ri(1, 3) : n - ri(0, 2);
    return {
      label: '組合せ',
      q: `<span class="big">${nC(n, r)}</span>`,
      ans: C(n, r), unit: '',
      hint: r > n / 2
        ? `${nC(n, r)} = ${nC(n, n - r)} を使うと計算が楽。`
        : `${nP(n, r)} を ${r}! で割ろう。`,
      steps: [combLine(n, r)],
    };
  },
};

/* ---------- 記録（この端末のブラウザに保存） ---------- */
const STORE = 'cmb-trainer-v1';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function saveStats(s) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 保存できない環境では記録しない */ }
}
function addStat(key, ok) {
  const s = loadStats();
  const t = s[key] || { ok: 0, all: 0 };
  t.all += 1;
  if (ok) t.ok += 1;
  s[key] = t;
  saveStats(s);
}

// 全角数字・カンマ・空白を許して整数として読む
function parseAnswer(raw) {
  const s = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
}

/* ---------- 数値で答えるトレーナー（計算・文章題） ---------- */
function createTrainer(root, statKey, nextProblem) {
  root.innerHTML = `
    <div class="score" aria-live="polite">
      <span>正解 <b class="s-ok">0</b> / <b class="s-all">0</b></span>
      <span>連続正解 <b class="s-streak">0</b></span>
    </div>
    <article class="qcard">
      <div class="body">
        <div class="tags"></div>
        <div class="qtext"></div>
        <div class="fig"></div>
        <form class="answer-row" autocomplete="off">
          <input class="ans" id="${statKey}-answer" type="text" inputmode="numeric" aria-label="答え">
          <span class="unit"></span>
          <button type="submit" class="btn primary">答え合わせ</button>
        </form>
        <p class="msg" hidden>数字で答えを入力してください。</p>
        <div class="tools">
          <button type="button" class="btn ghost hint-btn">ヒントを見る</button>
          <button type="button" class="btn ghost skip-btn">別の問題にする</button>
        </div>
        <p class="hint" hidden></p>
        <div class="result" hidden></div>
      </div>
      <p class="empty" hidden>出題する種類を1つ以上えらんでください。</p>
    </article>`;

  const input = $('.ans', root);
  const submit = $('button[type="submit"]', root);
  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function renderScore() {
    $('.s-ok', root).textContent = session.ok;
    $('.s-all', root).textContent = session.all;
    $('.s-streak', root).textContent = session.streak;
  }

  function load() {
    cur = nextProblem(cur);
    $('.body', root).hidden = !cur;
    $('.empty', root).hidden = !!cur;
    if (!cur) return;
    $('.tags', root).innerHTML = cur.tags.map((t, i) => `<span class="tag${i ? ' lv' : ''}">${t}</span>`).join('');
    $('.qtext', root).innerHTML = cur.q;
    $('.fig', root).innerHTML = cur.fig || '';
    $('.fig', root).hidden = !cur.fig;
    $('.unit', root).textContent = cur.unit ?? '通り';
    $('.hint', root).innerHTML = `<b>ヒント</b>${cur.hint}`;
    $('.hint', root).hidden = true;
    $('.hint-btn', root).hidden = false;
    $('.result', root).hidden = true;
    $('.msg', root).hidden = true;
    input.value = '';
    input.disabled = false;
    submit.disabled = false;
  }

  function check() {
    const val = parseAnswer(input.value);
    if (val === null) {
      $('.msg', root).hidden = false;
      return;
    }
    $('.msg', root).hidden = true;
    const ok = val === cur.ans;
    const unit = cur.unit ?? '通り';
    session.all += 1;
    if (ok) { session.ok += 1; session.streak += 1; } else { session.streak = 0; }
    addStat(statKey, ok);
    renderScore();

    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? '○ 正解！' : `× 不正解　（あなたの答え：${fmt(val)}）`}</p>
      ${cur.why ? `<p class="why"><b>考え方</b>${cur.why}</p>` : ''}
      <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="final">答え：${fmt(cur.ans)}${unit}</p>
      <button type="button" class="btn primary next-btn">次の問題へ</button>`;
    result.hidden = false;
    input.disabled = true;
    submit.disabled = true;
    $('.hint-btn', root).hidden = true;
    $('.next-btn', result).focus({ preventScroll: true });
  }

  $('form', root).addEventListener('submit', (e) => { e.preventDefault(); check(); });
  $('.hint-btn', root).addEventListener('click', () => { $('.hint', root).hidden = false; });
  $('.skip-btn', root).addEventListener('click', load);
  root.addEventListener('click', (e) => { if (e.target.closest('.next-btn')) { load(); input.focus({ preventScroll: true }); } });

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

/* 計算トレーニング */
const calcTrainer = createTrainer($('#calc-trainer'), 'calc', (prev) => {
  const types = checkedValues('#calc-types');
  if (!types.length) return null;
  return drawFrom(types, prev, (t) => {
    const p = CALC[t]();
    return { ...p, tags: [p.label] };
  });
});
$('#calc-types').addEventListener('change', () => calcTrainer.reload());

/* 文章題トレーニング */
function wordPool() {
  const topics = checkedValues('#word-topics');
  const level = checkedValues('#word-level')[0];
  return GENS.filter((g) => topics.includes(g.topic) && (level === 'all' || String(g.level) === level));
}
const wordTrainer = createTrainer($('#word-trainer'), 'word', (prev) => {
  const pool = wordPool();
  if (!pool.length) return null;
  return drawFrom(pool, prev, (g) => ({
    ...g.make(),
    tags: [TOPICS[g.topic] + (g.topic === 'hcomb' ? '（発展）' : ''), g.level === 1 ? '基本' : '標準'],
  }));
});
$('#word-topics').addEventListener('change', () => wordTrainer.reload());
$('#word-level').addEventListener('change', () => wordTrainer.reload());

/* ---------- 見分けクイズ ---------- */
(function createClassifier() {
  const root = $('#classify-trainer');
  const order = ['perm', 'comb', 'circ', 'rep', 'same', 'hcomb'];
  root.innerHTML = `
    <div class="score" aria-live="polite">
      <span>正解 <b class="s-ok">0</b> / <b class="s-all">0</b></span>
      <span>連続正解 <b class="s-streak">0</b></span>
    </div>
    <article class="qcard">
      <div class="tags"><span class="tag">どの公式を使う？</span></div>
      <div class="qtext"></div>
      <div class="fig"></div>
      <div class="choices">
        ${order.map((k) => `<button type="button" class="btn choice" data-k="${k}">${TOPICS[k]}</button>`).join('')}
      </div>
      <div class="result" hidden></div>
    </article>`;

  const session = { ok: 0, all: 0, streak: 0 };
  let cur = null;

  function load() {
    cur = drawFrom(GENS, cur, (g) => ({ ...g.make(), topic: g.topic }));
    $('.qtext', root).innerHTML = cur.q;
    $('.fig', root).innerHTML = cur.fig || '';
    $('.fig', root).hidden = !cur.fig;
    root.querySelectorAll('.choice').forEach((b) => { b.disabled = false; b.className = 'btn choice'; });
    $('.result', root).hidden = true;
  }

  function answer(btn) {
    const ok = btn.dataset.k === cur.topic;
    session.all += 1;
    if (ok) { session.ok += 1; session.streak += 1; } else { session.streak = 0; }
    addStat('classify', ok);
    $('.s-ok', root).textContent = session.ok;
    $('.s-all', root).textContent = session.all;
    $('.s-streak', root).textContent = session.streak;

    root.querySelectorAll('.choice').forEach((b) => {
      b.disabled = true;
      if (b.dataset.k === cur.topic) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    const unit = cur.unit ?? '通り';
    const result = $('.result', root);
    result.innerHTML = `
      <p class="verdict ${ok ? 'ok' : 'ng'}">${ok ? '○ 正解！' : `× 不正解　正しくは「${TOPICS[cur.topic]}」`}</p>
      <p class="why"><b>考え方</b>${cur.why}</p>
      <details>
        <summary>答えと解き方を見る</summary>
        <ol class="sol">${cur.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="final">答え：${fmt(cur.ans)}${unit}</p>
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

/* ---------- 演習問題 ---------- */
const EXAM = [
  {
    title: '順列（人の並び方）',
    stem: '男子4人、女子3人の合わせて7人が1列に並ぶ。',
    items: [
      { q: '並び方は全部で何通りあるか。', ans: 5040, sol: ['7人全員を並べる。', factLine(7)] },
      { q: '女子3人が隣り合う並び方は何通りあるか。', ans: 720, sol: [
        `女子3人をひとまとめにすると5人の並び方：${factLine(5)}`,
        `女子3人の中での並び方：${factLine(3)}`,
        '120 × 6 = 720',
      ] },
      { q: '両端が男子である並び方は何通りあるか。', ans: 1440, sol: [
        `両端に男子を並べる：${permLine(4, 2)}`,
        `残りの5人を間に並べる：${factLine(5)}`,
        '12 × 120 = 1,440',
      ] },
      { q: '女子どうしが隣り合わない並び方は何通りあるか。', ans: 1440, sol: [
        `先に男子4人を並べる：${factLine(4)}`,
        `男子の間と両端の5か所から3か所を選んで女子を並べる：${permLine(5, 3)}`,
        '24 × 60 = 1,440',
      ] },
    ],
  },
  {
    title: '順列（整数をつくる）',
    stem: '0, 1, 2, 3, 4, 5 の6個の数字から異なる3個を使って、3けたの整数をつくる。',
    items: [
      { q: '3けたの整数は全部で何個できるか。', ans: 100, unit: '個', sol: [
        '百の位：0 以外の5通り',
        `十の位・一の位：残りの5個から2個を並べる ${permLine(5, 2)}`,
        '5 × 20 = 100',
      ] },
      { q: '偶数は何個できるか。', ans: 52, unit: '個', sol: [
        `一の位が 0 のとき：百の位・十の位は残りの5個から並べる ${permLine(5, 2)}個`,
        '一の位が 2 または 4 のとき（2通り）：百の位は 0 と一の位の数以外の4通り、十の位は残りの4通り → 2 × 4 × 4 = 32個',
        '20 + 32 = 52',
      ] },
      { q: '5の倍数は何個できるか。', ans: 36, unit: '個', sol: [
        `一の位が 0 のとき：${permLine(5, 2)}個`,
        '一の位が 5 のとき：百の位は 0 と 5 以外の4通り、十の位は残りの4通り → 4 × 4 = 16個',
        '20 + 16 = 36',
      ] },
    ],
  },
  {
    title: '組合せ（委員の選び方）',
    stem: '男子6人、女子4人の合わせて10人の中から、4人の委員を選ぶ。',
    items: [
      { q: '選び方は全部で何通りあるか。', ans: 210, sol: [combLine(10, 4)] },
      { q: '男子2人、女子2人を選ぶ方法は何通りあるか。', ans: 90, sol: [
        `男子：${combLine(6, 2)}`, `女子：${combLine(4, 2)}`, '15 × 6 = 90',
      ] },
      { q: '女子が少なくとも1人含まれる選び方は何通りあるか。', ans: 195, sol: [
        `全体：${combLine(10, 4)}`,
        `女子が1人もいない（男子だけ4人）：${combLine(6, 4)}`,
        '210 − 15 = 195',
      ] },
      { q: '特定の2人 A, B がともに選ばれる選び方は何通りあるか。', ans: 28, sol: [
        'A, B は先に選んでおく。',
        `残りの8人から2人を選ぶ：${combLine(8, 2)}`,
      ] },
    ],
  },
  {
    title: '組合せ（図形）',
    stem: '正八角形について考える。',
    items: [
      { q: '正八角形の3個の頂点を結んでできる三角形は何個あるか。', ans: 56, unit: '個', sol: [combLine(8, 3)] },
      { q: '正八角形の対角線は何本あるか。', ans: 20, unit: '本', sol: [
        `2つの頂点を結ぶ線分：${combLine(8, 2)}`,
        'このうち8本は辺なので、28 − 8 = 20',
      ] },
      { q: '(1) の三角形のうち、正八角形と辺を1つも共有しないものは何個あるか。', ans: 16, unit: '個', sol: [
        '2辺を共有する三角形：となり合う3頂点を結ぶもので 8個',
        '1辺だけを共有する三角形：共有する辺の選び方が8通り。残りの頂点は、その辺の両端と、両端のとなりの頂点を除いた4通り → 8 × 4 = 32個',
        '56 − 8 − 32 = 16',
      ] },
    ],
  },
  {
    title: '円順列',
    stem: '大人4人と子ども4人が、円形のテーブルのまわりに座る。',
    items: [
      { q: '座り方は全部で何通りあるか。', ans: 5040, sol: [`8人の円順列：(8 − 1)! = ${factLine(7)}`] },
      { q: '大人と子どもが交互に座る方法は何通りあるか。', ans: 144, sol: [
        `大人4人を円形に並べる：(4 − 1)! = ${factLine(3)}`,
        `大人の間の4か所に子どもを並べる：${factLine(4)}`,
        '6 × 24 = 144',
      ] },
      { q: '特定の子ども2人が隣り合う座り方は何通りあるか。', ans: 1440, sol: [
        `2人をひとまとめにすると7人の円順列：(7 − 1)! = ${factLine(6)}`,
        '2人の入れかえ：2! = 2',
        '720 × 2 = 1,440',
      ] },
    ],
  },
  {
    title: '同じものを含む順列（文字）',
    stem: 'BANANA の6文字を1列に並べる。',
    items: [
      { q: '並べ方は全部で何通りあるか。', ans: 60, sol: ['A が3個、N が2個、B が1個。', multiLine(6, [3, 2, 1])] },
      { q: 'B が左端にくる並べ方は何通りあるか。', ans: 10, sol: [
        'B を左端に固定し、残りの A, A, A, N, N を並べる。',
        multiLine(5, [3, 2]),
      ] },
      { q: '3個の A が隣り合う並べ方は何通りあるか。', ans: 12, sol: [
        'AAA をひとまとめにして、[AAA], B, N, N の4つを並べる（N が2個）。',
        multiLine(4, [1, 1, 2]),
      ] },
    ],
  },
  {
    title: '同じものを含む順列（最短経路）',
    stem: '下の図のような碁盤目状の道がある。A から B まで遠回りせずに行く。',
    fig: gridFig(5, 4, [2, 1]),
    items: [
      { q: '道順は全部で何通りあるか。', ans: 126, sol: [
        '「→」5個と「↑」4個の並べ方と同じ。',
        `${pathLine(5, 4)}　（${nC(9, 4)} でもよい）`,
      ] },
      { q: 'P を通る道順は何通りあるか。', ans: 60, sol: [
        `A → P：「→」2個と「↑」1個 ${pathLine(2, 1)}`,
        `P → B：「→」3個と「↑」3個 ${pathLine(3, 3)}`,
        '3 × 20 = 60',
      ] },
      { q: 'P を通らない道順は何通りあるか。', ans: 66, sol: ['全体から P を通る道順を引く。', '126 − 60 = 66'] },
    ],
  },
  {
    title: '重複順列',
    stem: '5人の生徒について考える。',
    items: [
      { q: '5人が1回じゃんけんをするとき、手の出し方は何通りあるか。', ans: 243, sol: [`1人につき3通り：${pow(3, 5)} = 243`] },
      { q: '5人を A, B の2つの部屋に入れる。どちらの部屋にも少なくとも1人が入る入れ方は何通りあるか。', ans: 30, sol: [
        `空き部屋があってもよい入れ方：${pow(2, 5)} = 32`,
        '全員が A、全員が B の2通りを除く：32 − 2 = 30',
      ] },
      { q: '5人を2つのグループに分ける（グループに名前はなく、どちらにも1人以上入る）。分け方は何通りあるか。', ans: 15, sol: [
        '(2) で A と B の区別をなくすと、同じ分け方が2通りずつ数えられている。',
        '30 ÷ 2 = 15',
      ] },
    ],
  },
  {
    title: '組分け',
    stem: '9人を3人ずつ3つの組に分ける。',
    items: [
      { q: 'A, B, C の3つの組に分ける方法は何通りあるか。', ans: 1680, sol: [
        `A 組の3人：${combLine(9, 3)}`,
        `B 組の3人：残り6人から ${combLine(6, 3)}`,
        'C 組は残りの3人で1通り。',
        '84 × 20 × 1 = 1,680',
      ] },
      { q: '区別のない3つの組に分ける方法は何通りあるか。', ans: 280, sol: [
        '(1) では組の名前 A, B, C の入れかえ 3! = 6通りを区別している。',
        '1,680 ÷ 6 = 280',
      ] },
    ],
  },
  {
    title: '重複組合せ（発展）',
    stem: '同じ種類のものは区別しないとする。',
    items: [
      { q: 'りんご・みかん・かきの3種類の果物から、合わせて6個を買う。買わない種類があってもよいとき、買い方は何通りあるか。', ans: 28, sol: [
        '○6個と仕切り｜2本の並べ方と同じ。',
        `8か所から仕切りの2か所を選ぶ：${combLine(8, 2)}`,
      ] },
      { q: 'x + y + z = 10 を満たす正の整数の組 (x, y, z) は何組あるか。', ans: 36, unit: '組', sol: [
        '○を10個並べ、間の9か所から仕切りを入れる2か所を選ぶ。',
        combLine(9, 2),
      ] },
    ],
  },
];

const EXAM_TOTAL = EXAM.reduce((a, s) => a + s.items.length, 0);
const examResults = {};

function renderExam() {
  $('#exam-list').innerHTML = EXAM.map((sec, si) => `
    <article class="exam-card" data-sec="${si}">
      <h3><span class="qno">${si + 1}</span>${sec.title}</h3>
      <p class="stem">${sec.stem}</p>
      ${sec.fig ? `<div class="fig">${sec.fig}</div>` : ''}
      <ol class="items">
        ${sec.items.map((it, ii) => `
          <li>
            <p class="item-q">(${ii + 1}) ${it.q}</p>
            <div class="answer-row">
              <input class="ans" id="ex-${si}-${ii}" type="text" inputmode="numeric" autocomplete="off" aria-label="第${si + 1}問 (${ii + 1}) の答え">
              <span class="unit">${it.unit || '通り'}</span>
              <span class="mark" aria-live="polite"></span>
            </div>
            <div class="item-sol" hidden></div>
          </li>`).join('')}
      </ol>
      <div class="exam-actions">
        <button type="button" class="btn primary check-btn">答え合わせ</button>
        <button type="button" class="btn reset-btn">やり直す</button>
      </div>
    </article>`).join('');
}

function checkSection(si) {
  const card = document.querySelector(`.exam-card[data-sec="${si}"]`);
  EXAM[si].items.forEach((it, ii) => {
    const li = card.querySelectorAll('.items > li')[ii];
    const input = $('.ans', li);
    const val = parseAnswer(input.value);
    const ok = val === it.ans;
    examResults[`${si}-${ii}`] = ok;
    const mark = $('.mark', li);
    mark.textContent = ok ? '○' : val === null ? '×（未回答）' : '×';
    mark.className = `mark ${ok ? 'ok' : 'ng'}`;
    const sol = $('.item-sol', li);
    sol.innerHTML = `<p>正解：${fmt(it.ans)}${it.unit || '通り'}</p><ol class="sol">${it.sol.map((s) => `<li>${s}</li>`).join('')}</ol>`;
    sol.hidden = false;
    input.disabled = true;
  });
  $('.check-btn', card).disabled = true;
  updateExamScore();
}

function resetSection(si) {
  const card = document.querySelector(`.exam-card[data-sec="${si}"]`);
  card.querySelectorAll('.items > li').forEach((li, ii) => {
    delete examResults[`${si}-${ii}`];
    const input = $('.ans', li);
    input.value = '';
    input.disabled = false;
    $('.mark', li).textContent = '';
    $('.item-sol', li).hidden = true;
  });
  $('.check-btn', card).disabled = false;
  updateExamScore();
}

function updateExamScore() {
  const done = Object.keys(examResults).length;
  const ok = Object.values(examResults).filter(Boolean).length;
  $('#exam-score-text').textContent = done
    ? `答え合わせ済み ${done} / ${EXAM_TOTAL}問 ・ 正解 ${ok}問`
    : `まだ答え合わせをしていません（全${EXAM_TOTAL}問）`;
  $('#exam-bar').style.width = `${(ok / EXAM_TOTAL) * 100}%`;

  const final = $('#exam-final');
  if (done === EXAM_TOTAL) {
    const rate = ok / EXAM_TOTAL;
    const msg = rate === 1 ? '全問正解！完ぺきです。'
      : rate >= 0.8 ? 'よくできました。まちがえた問題の解説を見直そう。'
      : rate >= 0.5 ? 'あと一歩。まちがえた分野を文章題トレーニングで練習しよう。'
      : '公式まとめを見直してから、もう一度チャレンジしよう。';
    const s = loadStats();
    const best = s.exam?.best ?? -1;
    if (ok > best) { s.exam = { best: ok }; saveStats(s); }
    final.textContent = `結果：${ok} / ${EXAM_TOTAL}問正解。${msg}${best >= 0 && ok > best ? '（自己ベスト更新！）' : ''}`;
    final.hidden = false;
  } else {
    final.hidden = true;
  }
}

renderExam();
$('#exam-list').addEventListener('click', (e) => {
  const card = e.target.closest('.exam-card');
  if (!card) return;
  const si = Number(card.dataset.sec);
  if (e.target.closest('.check-btn')) checkSection(si);
  if (e.target.closest('.reset-btn')) resetSection(si);
});
$('#exam-reset-all').addEventListener('click', () => EXAM.forEach((_, si) => resetSection(si)));

/* ---------- 画面の切りかえ ---------- */
const VIEWS = ['home', 'formulas', 'calc', 'word', 'classify', 'exam'];

function updateHome() {
  const s = loadStats();
  const line = (t) => (t && t.all ? `これまで ${t.all}問中 ${t.ok}問正解` : '');
  $('#stat-calc').textContent = line(s.calc);
  $('#stat-word').textContent = line(s.word);
  $('#stat-classify').textContent = line(s.classify);
  $('#stat-exam').textContent = s.exam ? `自己ベスト ${s.exam.best} / ${EXAM_TOTAL}問` : '';
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
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
