'use strict';

const $ = (sel, el = document) => el.querySelector(sel);

/* ---------- 計算の道具 ---------- */
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fact = (n) => { let x = 1; for (let i = 2; i <= n; i++) x *= i; return x; };
const C = (n, r) => {
  if (r < 0 || r > n) return 0;
  r = Math.min(r, n - r);
  let x = 1;
  for (let i = 1; i <= r; i++) x = (x * (n - r + i)) / i;
  return Math.round(x);
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a * b) / gcd(a, b);
const red = (n, d) => { const k = gcd(n, d) || 1; return [n / k, d / k]; };
const fmt = (x) => x.toLocaleString('ja-JP');

/* ---------- 表記（HTML） ---------- */
const nC = (n, r) => `<span class="nt"><sub>${n}</sub>C<sub>${r}</sub></span>`;
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
// 分数（分母1なら整数）
const F = (n, d) => (d === 1 ? fmt(n) : frac(fmt(n), fmt(d)));
// 約分できるときは「= 約分後」までつなげる
const FR = (n, d) => {
  const [a, b] = red(n, d);
  return a === n && b === d ? F(n, d) : `${F(n, d)} = ${F(a, b)}`;
};
const powF = (n, d, e) => `<span class="nt">(</span>${frac(n, d)}<span class="nt">)<sup>${e}</sup></span>`;

/* ---------- 8つの解き方 ---------- */
const METHODS = {
  expect: {
    name: '期待値',
    flow: '「期待値」や「平均して何点（何円）」を求める？',
    keywords: ['期待値', '平均して'],
    formula: 'E = x<sub>1</sub>p<sub>1</sub> + x<sub>2</sub>p<sub>2</sub> + … + x<sub>n</sub>p<sub>n</sub>',
    steps: ['とりうる値（もらえる金額など）をすべて書き出す', 'それぞれの確率を求めて表にする（確率の合計が1になるか確認）', '「値 × 確率」をすべて足す'],
    example: ['1000円が1本、100円が4本、はずれが5本の合計10本のくじから1本引くときの賞金の期待値',
      `1000 × ${frac(1, 10)} + 100 × ${frac(4, 10)} + 0 × ${frac(5, 10)} = 140（円）`],
  },
  cond: {
    name: '条件付き確率・乗法定理',
    flow: '「〜であったとき」「〜とわかったとき」がある？ または、もとに戻さずに続けて取り出す？',
    keywords: ['〜であったとき', '〜とわかった', 'もとに戻さない', '続けて取り出す', 'くじを順に引く', '不良品'],
    formula: `P<sub>A</sub>(B) = ${frac('P(A∩B)', 'P(A)')}　　P(A∩B) = P(A) × P<sub>A</sub>(B)`,
    steps: ['すでに起こったこと（条件）A を見つける', 'A が起こった中だけで考える（全体が A になる）', '戻さない取り出しは、2回目の確率が1回目の結果で変わるので、順にかける（乗法定理）'],
    example: ['赤玉3個、白玉2個の袋から、もとに戻さずに1個ずつ2回取り出すとき、2回とも赤玉である確率',
      `${frac(3, 5)} × ${frac(2, 4)} = ${frac(3, 10)}`],
  },
  rep: {
    name: '反復試行',
    flow: '同じことを何回もくり返して「n回のうち r回」起こる確率？',
    keywords: ['〜回投げる', '〜回のうち', 'ちょうど r 回', 'r 回以上', '〜勝する'],
    formula: `${nC('n', 'r')} p<sup>r</sup> (1 − p)<sup>n−r</sup>`,
    steps: ['1回で起こる確率 p を求める', '全部で何回（n）のうち、何回（r）起こるかを読む', '何回目に起こるかの選び方 ' + nC('n', 'r') + ' 通りをかける'],
    example: ['1枚の硬貨を4回投げるとき、表がちょうど2回出る確率',
      `${nC(4, 2)} × ${powF(1, 2, 2)} × ${powF(1, 2, 2)} = ${frac(6, 16)} = ${frac(3, 8)}`],
  },
  maxmin: {
    name: '最大値・最小値',
    flow: '出た目の「最大値」「最小値」についての確率？',
    keywords: ['最大値', '最小値', '最も大きい', '最も小さい'],
    formula: 'P(最大値が k) = P(すべて k 以下) − P(すべて k−1 以下)',
    steps: ['「最大値が k 以下」=「すべての目が k 以下」と言いかえる', 'すべて k 以下の確率は (k/6)<sup>n</sup>', '「k−1 以下」の確率を引くと「最大値がちょうど k」になる'],
    example: ['さいころを2回投げるとき、出た目の最大値が5である確率',
      `${powF(5, 6, 2)} − ${powF(4, 6, 2)} = ${frac(9, 36)} = ${frac(1, 4)}`],
  },
  comp: {
    name: '余事象',
    flow: '「少なくとも」「〜でない」がある？',
    keywords: ['少なくとも', '1つ以上', '〜でない'],
    formula: 'P(A) = 1 − P(A でない)',
    steps: ['反対のこと（余事象）に言いかえる：「少なくとも1回6」→「1回も6が出ない」', '余事象の確率を求める', '1 から引く'],
    example: ['さいころを3回投げるとき、少なくとも1回6の目が出る確率',
      `1 − ${powF(5, 6, 3)} = 1 − ${frac(125, 216)} = ${frac(91, 216)}`],
  },
  union: {
    name: '和事象（または）',
    flow: '「A または B」の確率？',
    keywords: ['または', 'いずれか', 'どちらか', '同じ色'],
    formula: 'P(A∪B) = P(A) + P(B) − P(A∩B)',
    steps: ['A と B に分けて、それぞれの確率を求める', 'A と B が同時に起こることがあるか確かめる', '重なり（A かつ B）があれば引く。重ならない（排反）なら足すだけ'],
    example: ['1〜20の番号のカードから1枚引くとき、2の倍数または3の倍数である確率',
      `${frac(10, 20)} + ${frac(6, 20)} − ${frac(3, 20)} = ${frac(13, 20)}`],
  },
  indep: {
    name: '独立な試行（積）',
    flow: 'さいころと硬貨、もとに戻して取り出すなど、たがいに影響しない試行が続けて起こる？',
    keywords: ['さいころと硬貨', 'もとに戻して', '袋Aと袋B', 'それぞれ1個'],
    formula: 'P(A かつ B) = P(A) × P(B)',
    steps: ['1つ1つの試行の確率を求める', 'たがいの結果に影響しない（独立）ことを確かめる', 'かけ算する'],
    example: ['さいころを1回投げて3以上の目が出て、さらに硬貨を投げて表が出る確率',
      `${frac(4, 6)} × ${frac(1, 2)} = ${frac(1, 3)}`],
  },
  basic: {
    name: '基本（数えて求める）',
    flow: 'どれにも当てはまらない → 全体と、条件に合う場合の数を数える',
    keywords: ['同時に取り出す', '並べる', '2個のさいころ'],
    formula: `P(A) = ${frac('A が起こる場合の数', '全体の場合の数')}`,
    steps: ['全体の場合の数を数える（どれも同じ確からしさになるように区別する）', '条件に合う場合の数を数える（同時に取り出す → 組合せ、並べる → 順列）', '割る'],
    example: ['赤玉3個、白玉2個から同時に2個取り出すとき、2個とも赤玉である確率',
      `${frac(nC(3, 2), nC(5, 2))} = ${frac(3, 10)}`],
  },
};
// 見分ける順番。「少なくとも」は反復試行より先に考える
const ORDER = ['expect', 'cond', 'maxmin', 'comp', 'rep', 'union', 'indep', 'basic'];

/* ---------- ドリルの問題パターン ----------
   make() は { q, ans: [分子, 分母], unit?, hint, why, steps } を返す */
const GENS = [
  // 基本
  { m: 'basic', level: 1, make() {
    const s = ri(3, 11);
    const pairs = [];
    for (let a = 1; a <= 6; a++) { const b = s - a; if (b >= 1 && b <= 6) pairs.push(`(${a}, ${b})`); }
    const c = pairs.length;
    return {
      q: `大小2個のさいころを同時に投げるとき、出た目の和が${s}になる確率を求めよ。`,
      ans: red(c, 36),
      hint: `目の出方は全部で 6 × 6 = 36通り。和が${s}になる組を書き出そう。`,
      why: '目の出方をすべて数えられる → 基本（場合の数 ÷ 全体）',
      steps: ['目の出方は全部で 6 × 6 = 36通り。', `和が${s}になるのは（大, 小）= ${pairs.join(', ')} の${c}通り。`, `確率は ${FR(c, 36)}`],
    };
  } },
  { m: 'basic', level: 1, make() {
    const a = ri(3, 6), b = ri(2, 5), n = a + b;
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、同時に2個の玉を取り出すとき、2個とも赤玉である確率を求めよ。`,
      ans: red(C(a, 2), C(n, 2)),
      hint: '「同時に取り出す」ので、組合せで数えよう。',
      why: '同時に取り出す → 組合せで数える（基本）',
      steps: [
        `全体：${n}個から2個を取り出す ${nC(n, 2)} = ${C(n, 2)}通り`,
        `2個とも赤玉：${nC(a, 2)} = ${C(a, 2)}通り`,
        `確率は ${FR(C(a, 2), C(n, 2))}`,
      ],
    };
  } },
  { m: 'basic', level: 1, make() {
    const n = pick([20, 30, 40, 50]), k = pick([3, 4, 6, 7]);
    const c = Math.floor(n / k);
    return {
      q: `1 から ${n} までの番号が書かれた${n}枚のカードから1枚を引くとき、その番号が${k}の倍数である確率を求めよ。`,
      ans: red(c, n),
      hint: `${n} ÷ ${k} の商が、${k}の倍数の個数。`,
      why: 'カードの引き方をすべて数えられる → 基本（場合の数 ÷ 全体）',
      steps: [`全体：${n}通り`, `${k}の倍数：${k} × 1 から ${k} × ${c} までの${c}個`, `確率は ${FR(c, n)}`],
    };
  } },
  { m: 'basic', level: 2, make() {
    const a = ri(3, 5), b = ri(3, 5), n = a + b;
    const fav = C(a, 2) * C(b, 1);
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、同時に3個の玉を取り出すとき、赤玉が2個、白玉が1個である確率を求めよ。`,
      ans: red(fav, C(n, 3)),
      hint: '赤玉の選び方と白玉の選び方をかけよう。',
      why: '同時に取り出す → 組合せで数える（基本）',
      steps: [
        `全体：${nC(n, 3)} = ${C(n, 3)}通り`,
        `赤玉2個、白玉1個：${nC(a, 2)} × ${nC(b, 1)} = ${C(a, 2)} × ${b} = ${fav}通り`,
        `確率は ${FR(fav, C(n, 3))}`,
      ],
    };
  } },
  { m: 'basic', level: 2, make() {
    const n = ri(4, 7);
    const all = fact(n), fav = fact(n - 1) * 2;
    return {
      q: `A, B を含む${n}人が、くじで順番を決めて1列に並ぶとき、A と B が隣り合う確率を求めよ。`,
      ans: red(fav, all),
      hint: 'A と B をひとまとめにして数えよう。',
      why: '並び方をすべて数えられる → 基本（順列で数える）',
      steps: [
        `全体：${n}人の並び方 ${n}! = ${fmt(all)}通り`,
        `A, B をひとまとめにすると ${n - 1}! 通り、A と B の入れかえで × 2：${fmt(fact(n - 1))} × 2 = ${fmt(fav)}通り`,
        `確率は ${FR(fav, all)}`,
      ],
    };
  } },

  // 余事象
  { m: 'comp', level: 1, make() {
    const n = ri(2, 4);
    const all = 6 ** n, none = 5 ** n;
    return {
      q: `1個のさいころを${n}回投げるとき、少なくとも1回は6の目が出る確率を求めよ。`,
      ans: red(all - none, all),
      hint: '「少なくとも1回6」の反対は「1回も6が出ない」。',
      why: '「少なくとも」がある → 余事象（1 − 反対の確率）',
      steps: [
        '余事象は「1回も6の目が出ない」こと。',
        `1回も6が出ない確率：${powF(5, 6, n)} = ${F(none, all)}`,
        `求める確率：1 − ${F(none, all)} = ${FR(all - none, all)}`,
      ],
    };
  } },
  { m: 'comp', level: 1, make() {
    const n = ri(3, 6);
    const all = 2 ** n;
    return {
      q: `1枚の硬貨を${n}回投げるとき、少なくとも1回は表が出る確率を求めよ。`,
      ans: red(all - 1, all),
      hint: '「少なくとも1回表」の反対は「すべて裏」。',
      why: '「少なくとも」がある → 余事象',
      steps: ['余事象は「すべて裏」が出ること。', `すべて裏の確率：${powF(1, 2, n)} = ${F(1, all)}`, `求める確率：1 − ${F(1, all)} = ${FR(all - 1, all)}`],
    };
  } },
  { m: 'comp', level: 2, make() {
    const a = ri(2, 5), b = ri(3, 6), n = a + b;
    const none = C(b, 3), all = C(n, 3);
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、同時に3個の玉を取り出すとき、少なくとも1個は赤玉である確率を求めよ。`,
      ans: red(all - none, all),
      hint: '反対は「3個とも白玉」。',
      why: '「少なくとも」がある → 余事象',
      steps: [
        `全体：${nC(n, 3)} = ${all}通り`,
        `余事象「3個とも白玉」：${nC(b, 3)} = ${none}通り → 確率 ${FR(none, all)}`,
        `求める確率：1 − ${F(...red(none, all))} = ${FR(all - none, all)}`,
      ],
    };
  } },
  { m: 'comp', level: 2, make() {
    const k = ri(2, 4);
    const all = 2 ** k;
    return {
      q: `${k}個のさいころを同時に投げるとき、出た目の積が偶数になる確率を求めよ。`,
      ans: red(all - 1, all),
      hint: '積が奇数になるのは、すべての目が奇数のときだけ。',
      why: '「偶数になる」を直接数えるのは大変 → 反対の「奇数」を考える余事象',
      steps: [
        '余事象は「積が奇数」＝「すべての目が奇数」。',
        `すべて奇数の確率：${powF(3, 6, k)} = ${F(1, all)}`,
        `求める確率：1 − ${F(1, all)} = ${FR(all - 1, all)}`,
      ],
    };
  } },

  // 和事象
  { m: 'union', level: 1, make() {
    const n = pick([20, 30, 40, 50, 60, 100]);
    const [a, b] = pick([[2, 3], [2, 5], [3, 4], [3, 5], [4, 6], [2, 7]]);
    const l = lcm(a, b);
    const x = Math.floor(n / a), y = Math.floor(n / b), z = Math.floor(n / l);
    return {
      q: `1 から ${n} までの番号が書かれた${n}枚のカードから1枚を引くとき、その番号が${a}の倍数または${b}の倍数である確率を求めよ。`,
      ans: red(x + y - z, n),
      hint: `${a}の倍数と${b}の倍数の両方に入る数（${l}の倍数）を2回数えないように。`,
      why: '「または」がある → 和事象（重なりを引く）',
      steps: [
        `${a}の倍数：${x}個、${b}の倍数：${y}個`,
        `両方に入る（${l}の倍数）：${z}個`,
        `${a}の倍数または${b}の倍数：${x} + ${y} − ${z} = ${x + y - z}個`,
        `確率は ${FR(x + y - z, n)}`,
      ],
    };
  } },
  { m: 'union', level: 1, make() {
    const a = ri(3, 5), b = ri(2, 5), n = a + b;
    const fav = C(a, 2) + C(b, 2), all = C(n, 2);
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、同時に2個の玉を取り出すとき、2個が同じ色である確率を求めよ。`,
      ans: red(fav, all),
      hint: '「同じ色」＝「2個とも赤」または「2個とも白」。この2つは同時には起こらない。',
      why: '「同じ色」は「赤赤 または 白白」→ 和事象（排反なので足すだけ）',
      steps: [
        `全体：${nC(n, 2)} = ${all}通り`,
        `2個とも赤：${nC(a, 2)} = ${C(a, 2)}通り、2個とも白：${nC(b, 2)} = ${C(b, 2)}通り`,
        `2つは同時に起こらない（排反）ので足す：${C(a, 2)} + ${C(b, 2)} = ${fav}通り`,
        `確率は ${FR(fav, all)}`,
      ],
    };
  } },
  { m: 'union', level: 2, make() {
    const k = pick([4, 6, 8, 10]);
    const A = 6 - Math.abs(k - 7);
    return {
      q: `大小2個のさいころを同時に投げるとき、出た目の和が${k}になる、または2つの目が同じになる確率を求めよ。`,
      ans: red(A + 5, 36),
      hint: `「和が${k}」と「同じ目」の両方に当てはまる目があるか調べよう。`,
      why: '「または」がある → 和事象（重なりを引く）',
      steps: [
        `和が${k}：${A}通り、同じ目（ぞろ目）：6通り`,
        `両方に当てはまるのは (${k / 2}, ${k / 2}) の1通り`,
        `${A} + 6 − 1 = ${A + 5}通りなので、確率は ${FR(A + 5, 36)}`,
      ],
    };
  } },

  // 独立な試行
  { m: 'indep', level: 1, make() {
    const k = ri(3, 5);
    const c = 7 - k;
    return {
      q: `1個のさいころを投げて、さらに1枚の硬貨を投げるとき、さいころは${k}以上の目が出て、硬貨は表が出る確率を求めよ。`,
      ans: red(c, 12),
      hint: 'さいころと硬貨はおたがいに影響しない。それぞれの確率をかけよう。',
      why: 'さいころと硬貨は別々の試行で影響し合わない → 独立（かける）',
      steps: [`さいころで${k}以上：${F(c, 6)}`, `硬貨で表：${frac(1, 2)}`, `独立なのでかける：${F(c, 6)} × ${frac(1, 2)} = ${FR(c, 12)}`],
    };
  } },
  { m: 'indep', level: 1, make() {
    const a1 = ri(2, 5), b1 = ri(2, 5), a2 = ri(2, 5), b2 = ri(2, 5);
    const n1 = a1 + b1, n2 = a2 + b2;
    return {
      q: `袋 A には赤玉${a1}個と白玉${b1}個、袋 B には赤玉${a2}個と白玉${b2}個が入っている。それぞれの袋から1個ずつ玉を取り出すとき、2個とも赤玉である確率を求めよ。`,
      ans: red(a1 * a2, n1 * n2),
      hint: '袋 A と袋 B は別の袋なので、おたがいに影響しない。',
      why: '別々の袋から取り出す → 独立（かける）',
      steps: [`袋 A から赤：${F(a1, n1)}`, `袋 B から赤：${F(a2, n2)}`, `かける：${F(a1, n1)} × ${F(a2, n2)} = ${FR(a1 * a2, n1 * n2)}`],
    };
  } },
  { m: 'indep', level: 2, make() {
    const a = ri(2, 5), b = ri(2, 5), n = a + b;
    const fav = 2 * a * b, all = n * n;
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から1個取り出し、色を調べてもとに戻してから、もう1回1個取り出す。2回で取り出した玉の色が異なる確率を求めよ。`,
      ans: red(fav, all),
      hint: '「赤→白」と「白→赤」の2つの場合がある。もとに戻すので、2回目の確率は1回目と同じ。',
      why: 'もとに戻して取り出す → 独立（かける）。色が異なるのは2通りあるので足す',
      steps: [
        `赤 → 白：${F(a, n)} × ${F(b, n)} = ${F(a * b, all)}`,
        `白 → 赤：${F(b, n)} × ${F(a, n)} = ${F(a * b, all)}`,
        `足す：${F(a * b, all)} + ${F(a * b, all)} = ${FR(fav, all)}`,
      ],
    };
  } },
  { m: 'indep', level: 2, make() {
    const [p1, q1] = pick([[1, 2], [2, 3], [3, 4], [3, 5], [4, 5]]);
    const [p2, q2] = pick([[1, 2], [1, 3], [2, 3], [2, 5], [3, 5]]);
    const num = p1 * (q2 - p2), den = q1 * q2;
    return {
      q: `A と B が的にボールを1回ずつ投げる。A が当てる確率は ${frac(p1, q1)}、B が当てる確率は ${frac(p2, q2)} である。A だけが当てる確率を求めよ。`,
      ans: red(num, den),
      hint: '「A だけ」＝「A が当てる」かつ「B が外す」。',
      why: 'A と B の結果はおたがいに影響しない → 独立（かける）',
      steps: [`B が外す確率：1 − ${frac(p2, q2)} = ${F(q2 - p2, q2)}`, `A が当てて B が外す：${frac(p1, q1)} × ${F(q2 - p2, q2)} = ${FR(num, den)}`],
    };
  } },

  // 反復試行
  { m: 'rep', level: 1, make() {
    const n = ri(4, 6), r = ri(1, n - 1);
    const all = 2 ** n;
    return {
      q: `1枚の硬貨を${n}回投げるとき、表がちょうど${r}回出る確率を求めよ。`,
      ans: red(C(n, r), all),
      hint: `${n}回のうち、表が出る${r}回をどこにするかが ${nC(n, r)} 通り。`,
      why: '同じ試行を何回もくり返して「n回のうち r回」→ 反復試行',
      steps: [
        `1回で表が出る確率 p = ${frac(1, 2)}`,
        `${nC(n, r)} × ${powF(1, 2, r)} × ${powF(1, 2, n - r)} = ${C(n, r)} × ${F(1, all)}`,
        `= ${FR(C(n, r), all)}`,
      ],
    };
  } },
  { m: 'rep', level: 1, make() {
    const ev = pick([{ name: '1の目', p: 1, q: 6 }, { name: '3の倍数の目', p: 1, q: 3 }, { name: '偶数の目', p: 1, q: 2 }]);
    const n = ri(3, 5), r = ri(1, Math.min(3, n - 1));
    const num = C(n, r) * ev.p ** r * (ev.q - ev.p) ** (n - r), den = ev.q ** n;
    return {
      q: `1個のさいころを${n}回投げるとき、${ev.name}がちょうど${r}回出る確率を求めよ。`,
      ans: red(num, den),
      hint: `1回で${ev.name}が出る確率をまず求めよう。`,
      why: '同じ試行をくり返して「n回のうち r回」→ 反復試行',
      steps: [
        `1回で${ev.name}が出る確率 p = ${F(ev.p, ev.q)}、出ない確率 ${F(ev.q - ev.p, ev.q)}`,
        `${nC(n, r)} × ${powF(ev.p, ev.q, r)} × ${powF(ev.q - ev.p, ev.q, n - r)}`,
        `= ${C(n, r)} × ${F(ev.p ** r * (ev.q - ev.p) ** (n - r), den)} = ${FR(num, den)}`,
      ],
    };
  } },
  { m: 'rep', level: 2, make() {
    const [p, q] = pick([[1, 3], [2, 3], [2, 5], [3, 5]]);
    const n = ri(4, 5), r = n - 1;
    const t1 = C(n, r) * p ** r * (q - p), t2 = p ** n, den = q ** n;
    return {
      q: `A と B が試合をする。1試合で A が勝つ確率は ${frac(p, q)} で、引き分けはない。${n}試合するとき、A が${r}勝以上する確率を求めよ。`,
      ans: red(t1 + t2, den),
      hint: `「${r}勝以上」＝「ちょうど${r}勝」または「${n}勝」。それぞれ反復試行で求めて足そう。`,
      why: '同じ試合をくり返して「n試合のうち r勝」→ 反復試行',
      steps: [
        `ちょうど${r}勝：${nC(n, r)} × ${powF(p, q, r)} × ${frac(q - p, q)} = ${F(t1, den)}`,
        `${n}勝：${powF(p, q, n)} = ${F(t2, den)}`,
        `足す：${F(t1, den)} + ${F(t2, den)} = ${FR(t1 + t2, den)}`,
      ],
    };
  } },

  // 条件付き確率・乗法定理
  { m: 'cond', level: 1, make() {
    const a = ri(3, 6), b = ri(2, 5), n = a + b;
    const num = a * (a - 1), den = n * (n - 1);
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、もとに戻さずに1個ずつ2回玉を取り出すとき、2回とも赤玉である確率を求めよ。`,
      ans: red(num, den),
      hint: '1回目に赤を取り出すと、袋の中の赤玉と全体の数が1つずつ減る。',
      why: 'もとに戻さないので2回目の確率が1回目で変わる → 乗法定理（順にかける）',
      steps: [
        `1回目に赤：${F(a, n)}`,
        `1回目が赤だったとき、2回目も赤：${F(a - 1, n - 1)}（赤${a - 1}個、全体${n - 1}個）`,
        `${F(a, n)} × ${F(a - 1, n - 1)} = ${FR(num, den)}`,
      ],
    };
  } },
  { m: 'cond', level: 1, make() {
    const a = ri(3, 6), b = ri(2, 5), n = a + b;
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、もとに戻さずに1個ずつ2回玉を取り出す。1回目に赤玉が出たとき、2回目も赤玉である確率を求めよ。`,
      ans: red(a - 1, n - 1),
      hint: '「1回目に赤玉が出たとき」なので、1回目が終わったあとの袋の中だけを考えよう。',
      why: '「〜が出たとき」がある → 条件付き確率（条件のもとで考える）',
      steps: [`1回目に赤玉を取り出したあと、袋の中は赤玉${a - 1}個、白玉${b}個の合計${n - 1}個。`, `その中から赤玉を取り出す確率は ${FR(a - 1, n - 1)}`],
    };
  } },
  { m: 'cond', level: 2, make() {
    const n = pick([5, 6, 8, 10]), k = ri(2, Math.min(4, n - 2));
    const num = k * (k - 1) + (n - k) * k, den = n * (n - 1);
    return {
      q: `${n}本のうち当たりが${k}本入っているくじを、A, B の2人がこの順に1本ずつ引く。引いたくじはもとに戻さない。B が当たりを引く確率を求めよ。`,
      ans: red(num, den),
      hint: 'A が当たった場合と、A が外れた場合に分けて、乗法定理でかけてから足そう。',
      why: 'もとに戻さずに順に引く → 乗法定理（A の結果で場合分けしてかける）',
      steps: [
        `A 当たり → B 当たり：${F(k, n)} × ${F(k - 1, n - 1)} = ${F(k * (k - 1), den)}`,
        `A 外れ → B 当たり：${F(n - k, n)} × ${F(k, n - 1)} = ${F((n - k) * k, den)}`,
        `足す：${FR(num, den)}（A が当たる確率と同じ。くじは引く順番によらない）`,
      ],
    };
  } },
  { m: 'cond', level: 2, make() {
    const s = pick([8, 9, 10]);
    let A = 0, AB = 0;
    for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) {
      if (x + y >= s) { A++; if (x === 6 || y === 6) AB++; }
    }
    return {
      q: `大小2個のさいころを同時に投げたところ、出た目の和が${s}以上であった。このとき、少なくとも一方が6の目である条件付き確率を求めよ。`,
      ans: red(AB, A),
      hint: `「和が${s}以上」の目の出方だけを全体と考えよう。`,
      why: '「〜であった。このとき」がある → 条件付き確率',
      steps: [
        `条件「和が${s}以上」になる目の出方：${A}通り（これが新しい全体）`,
        `その中で、少なくとも一方が6：${AB}通り`,
        `${FR(AB, A)}`,
      ],
    };
  } },
  { m: 'cond', level: 2, make() {
    const pa = pick([40, 50, 60, 70]), pb = 100 - pa;
    const da = ri(1, 5), db = ri(1, 5);
    const num = pa * da, den = pa * da + pb * db;
    return {
      q: `ある製品は工場 A で${pa}%、工場 B で${pb}%作られている。工場 A の製品の${da}%、工場 B の製品の${db}%が不良品である。製品を1個取り出したところ不良品であったとき、それが工場 A の製品である確率を求めよ。`,
      ans: red(num, den),
      hint: '「不良品であった」が条件。不良品全体の中で、工場 A の不良品が占める割合を求めよう。',
      why: '結果（不良品）から原因（どの工場か）をさかのぼる → 条件付き確率',
      steps: [
        `工場 A の不良品：${frac(pa, 100)} × ${frac(da, 100)} = ${F(pa * da, 10000)}`,
        `工場 B の不良品：${frac(pb, 100)} × ${frac(db, 100)} = ${F(pb * db, 10000)}`,
        `不良品である確率：${F(den, 10000)}`,
        `${FR(num, den)}`,
      ],
    };
  } },

  // 最大値・最小値
  { m: 'maxmin', level: 1, make() {
    const n = ri(2, 3), k = ri(2, 5);
    return {
      q: `1個のさいころを${n}回投げるとき、出た目の最大値が${k}以下である確率を求めよ。`,
      ans: red(k ** n, 6 ** n),
      hint: `「最大値が${k}以下」＝「すべての目が${k}以下」。`,
      why: '「最大値」がある → 最大値・最小値の考え方（すべての目が〜以下）',
      steps: [`すべての目が${k}以下であればよい。1回で${k}以下の確率は ${F(k, 6)}`, `${powF(k, 6, n)} = ${FR(k ** n, 6 ** n)}`],
    };
  } },
  { m: 'maxmin', level: 1, make() {
    const n = ri(2, 3), k = ri(2, 6);
    const num = k ** n - (k - 1) ** n, den = 6 ** n;
    return {
      q: `1個のさいころを${n}回投げるとき、出た目の最大値が${k}である確率を求めよ。`,
      ans: red(num, den),
      hint: `「最大値が${k}以下」から「最大値が${k - 1}以下」を引こう。`,
      why: '「最大値」がある → 「すべて k 以下」−「すべて k−1 以下」',
      steps: [
        `最大値が${k}以下（すべて${k}以下）：${powF(k, 6, n)} = ${F(k ** n, den)}`,
        `最大値が${k - 1}以下（すべて${k - 1}以下）：${powF(k - 1, 6, n)} = ${F((k - 1) ** n, den)}`,
        `引く：${F(k ** n, den)} − ${F((k - 1) ** n, den)} = ${FR(num, den)}`,
      ],
    };
  } },
  { m: 'maxmin', level: 2, make() {
    const n = 3, k = ri(1, 5);
    const num = (7 - k) ** n - (6 - k) ** n, den = 6 ** n;
    return {
      q: `1個のさいころを${n}回投げるとき、出た目の最小値が${k}である確率を求めよ。`,
      ans: red(num, den),
      hint: `「最小値が${k}以上」＝「すべての目が${k}以上」。そこから「すべて${k + 1}以上」を引こう。`,
      why: '「最小値」がある → 「すべて k 以上」−「すべて k+1 以上」',
      steps: [
        `すべて${k}以上：${powF(7 - k, 6, n)} = ${F((7 - k) ** n, den)}`,
        `すべて${k + 1}以上：${powF(6 - k, 6, n)} = ${F((6 - k) ** n, den)}`,
        `引く：${FR(num, den)}`,
      ],
    };
  } },

  // 期待値
  { m: 'expect', level: 1, make() {
    const n = pick([10, 20, 50, 100]), x = pick([500, 1000, 2000]), m = ri(2, 5), y = pick([100, 200, 300]);
    const num = x + m * y;
    return {
      q: `1等${x}円が1本、2等${y}円が${m}本、残りははずれのくじが全部で${n}本ある。このくじを1本引くときの賞金の期待値を求めよ。`,
      ans: red(num, n), unit: '円',
      hint: '「賞金 × その確率」をすべて足そう。はずれは0円。',
      why: '「期待値」を求める → 期待値（値 × 確率 の和）',
      steps: [
        `${x} × ${frac(1, n)} + ${y} × ${F(m, n)} + 0 × ${F(n - 1 - m, n)}`,
        `= ${FR(num, n)}（円）`,
      ],
    };
  } },
  { m: 'expect', level: 1, make() {
    const n = ri(2, 4);
    const all = 2 ** n;
    const rows = Array.from({ length: n + 1 }, (_, r) => r);
    const sum = rows.reduce((a, r) => a + r * C(n, r), 0);
    return {
      q: `1枚の硬貨を${n}回投げるとき、表が出る回数の期待値を求めよ。`,
      ans: red(sum, all), unit: '回',
      hint: '表が0回、1回、…の確率を表にして、「回数 × 確率」を足そう。',
      why: '「期待値」を求める → 確率分布の表を作って期待値',
      steps: [
        `<div class="table-wrap"><table class="dist"><tr><th>表の回数</th>${rows.map((r) => `<td>${r}</td>`).join('')}</tr><tr><th>確率</th>${rows.map((r) => `<td>${F(C(n, r), all)}</td>`).join('')}</tr></table></div>`,
        `${rows.map((r) => `${r} × ${F(C(n, r), all)}`).join(' + ')} = ${FR(sum, all)}`,
      ],
    };
  } },
  { m: 'expect', level: 2, make() {
    const a = pick([300, 600, 1200]), b = pick([60, 120, 300]);
    const num = a + 3 * b;
    return {
      q: `1個のさいころを投げて、1の目が出たら${a}円、偶数の目が出たら${b}円、それ以外の目では0円もらえるゲームがある。もらえる金額の期待値を求めよ。`,
      ans: red(num, 6), unit: '円',
      hint: '1の目は1通り、偶数の目は3通り、それ以外（3, 5）は2通り。',
      why: '「期待値」を求める → 値 × 確率 の和',
      steps: [
        `<div class="table-wrap"><table class="dist"><tr><th>金額</th><td>${a}</td><td>${b}</td><td>0</td></tr><tr><th>確率</th><td>${frac(1, 6)}</td><td>${frac(3, 6)}</td><td>${frac(2, 6)}</td></tr></table></div>`,
        `${a} × ${frac(1, 6)} + ${b} × ${frac(3, 6)} + 0 × ${frac(2, 6)} = ${FR(num, 6)}（円）`,
      ],
    };
  } },
  { m: 'expect', level: 2, make() {
    const a = ri(2, 5), b = ri(2, 5), n = a + b;
    const all = C(n, 2), p0 = C(b, 2), p1 = a * b, p2 = C(a, 2);
    const sum = p1 + 2 * p2;
    return {
      q: `赤玉${a}個、白玉${b}個が入った袋から、同時に2個の玉を取り出すとき、取り出した赤玉の個数の期待値を求めよ。`,
      ans: red(sum, all), unit: '個',
      hint: '赤玉が0個、1個、2個の確率を表にしよう。',
      why: '「期待値」を求める → 確率分布の表を作って期待値',
      steps: [
        `全体：${nC(n, 2)} = ${all}通り`,
        `<div class="table-wrap"><table class="dist"><tr><th>赤玉の個数</th><td>0</td><td>1</td><td>2</td></tr><tr><th>確率</th><td>${F(p0, all)}</td><td>${F(p1, all)}</td><td>${F(p2, all)}</td></tr></table></div>`,
        `0 × ${F(p0, all)} + 1 × ${F(p1, all)} + 2 × ${F(p2, all)} = ${FR(sum, all)}`,
      ],
    };
  } },
];

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
