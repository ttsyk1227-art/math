'use strict';

const $ = (id) => document.getElementById(id);

const screens = {
  setup: $('setup'),
  drill: $('drill'),
  result: $('result'),
};

let state = null;
let timerId = null;

function show(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// むずかしさ（けた数）に応じた数の範囲
function range(level) {
  return { min: level === 1 ? 1 : 10 ** (level - 1), max: 10 ** level - 1 };
}

// 1問つくる。答えはつねに0以上の整数になるようにする
function makeQuestion(op, level) {
  const { min, max } = range(level);
  let a, b, answer;
  switch (op) {
    case '+':
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      break;
    case '-':
      a = randInt(min, max);
      b = randInt(min, max);
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      break;
    case '×':
      // かけ算は大きくなりすぎないよう、かける数は1けたまで（むずかしいは2けた）
      a = randInt(min, max);
      b = level === 3 ? randInt(2, 99) : randInt(2, 9);
      answer = a * b;
      break;
    case '÷':
      // 割り切れる問題だけを出す
      b = level === 3 ? randInt(2, 99) : randInt(2, 9);
      answer = randInt(level === 1 ? 1 : min, max);
      a = answer * b;
      break;
  }
  return { text: `${a} ${op} ${b}`, answer };
}

function readSettings() {
  const ops = [...document.querySelectorAll('input[name="op"]:checked')].map((el) => el.value);
  const level = Number(document.querySelector('input[name="level"]:checked').value);
  const count = Number(document.querySelector('input[name="count"]:checked').value);
  return { ops, level, count };
}

function settingsKey({ ops, level, count }) {
  return `best:${[...ops].sort().join('')}:${level}:${count}`;
}

function loadBest(settings) {
  try {
    const raw = localStorage.getItem(settingsKey(settings));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBest(settings, record) {
  try {
    localStorage.setItem(settingsKey(settings), JSON.stringify(record));
  } catch {
    // 保存できない環境では記録を残さない
  }
}

function updateBestLabel() {
  const settings = readSettings();
  const best = settings.ops.length ? loadBest(settings) : null;
  $('best').textContent = best
    ? `この設定のベスト記録：${best.correct}問正解・${best.seconds.toFixed(1)}秒`
    : '';
}

function start(settings) {
  if (settings.ops.length === 0) {
    $('setup-error').hidden = false;
    return;
  }
  $('setup-error').hidden = true;

  const questions = Array.from({ length: settings.count }, () => {
    const op = settings.ops[randInt(0, settings.ops.length - 1)];
    return makeQuestion(op, settings.level);
  });

  state = { settings, questions, index: 0, mistakes: [], startedAt: performance.now(), locked: false };
  show('drill');
  renderQuestion();

  clearInterval(timerId);
  timerId = setInterval(renderTimer, 100);
}

function elapsed() {
  return (performance.now() - state.startedAt) / 1000;
}

function renderTimer() {
  $('timer').textContent = `${elapsed().toFixed(1)} 秒`;
}

function renderQuestion() {
  const { questions, index } = state;
  $('progress').textContent = `${index + 1} / ${questions.length}`;
  $('bar-fill').style.width = `${(index / questions.length) * 100}%`;
  $('question').textContent = `${questions[index].text} =`;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('answer').value = '';
  $('answer').focus();
  renderTimer();
}

function submitAnswer() {
  if (!state || state.locked) return;
  const input = $('answer').value.trim();
  if (input === '' || !/^\d+$/.test(input)) return;

  const q = state.questions[state.index];
  const given = Number(input);
  const feedback = $('feedback');
  let wait;

  if (given === q.answer) {
    feedback.textContent = 'せいかい！';
    feedback.className = 'feedback ok';
    wait = 400;
  } else {
    state.mistakes.push({ ...q, given });
    feedback.textContent = `ざんねん… こたえは ${q.answer}`;
    feedback.className = 'feedback ng';
    wait = 1200;
  }

  state.locked = true;
  setTimeout(() => {
    state.locked = false;
    state.index += 1;
    if (state.index < state.questions.length) {
      renderQuestion();
    } else {
      finish();
    }
  }, wait);
}

function finish() {
  clearInterval(timerId);
  const seconds = elapsed();
  const total = state.questions.length;
  const correct = total - state.mistakes.length;

  $('score').textContent = `${correct} / ${total}`;
  $('result-time').textContent = `かかった時間：${seconds.toFixed(1)} 秒`;

  const rate = correct / total;
  let message =
    rate === 1 ? 'パーフェクト！すごい！' :
    rate >= 0.8 ? 'よくできました！' :
    rate >= 0.5 ? 'その調子！' :
    'もう一度チャレンジしよう！';

  const best = loadBest(state.settings);
  const isBetter = !best || correct > best.correct || (correct === best.correct && seconds < best.seconds);
  if (isBetter) {
    saveBest(state.settings, { correct, seconds });
    if (best) message += '（ベスト記録こうしん！）';
  }
  $('result-message').textContent = message;

  const list = $('mistakes');
  list.replaceChildren(
    ...state.mistakes.map((m) => {
      const li = document.createElement('li');
      li.innerHTML = `${m.text} = <span class="right">${m.answer}</span>（あなたのこたえ：<span class="wrong">${m.given}</span>）`;
      return li;
    }),
  );
  $('mistakes-wrap').hidden = state.mistakes.length === 0;

  show('result');
}

function quit() {
  clearInterval(timerId);
  state = null;
  updateBestLabel();
  show('setup');
}

$('start-btn').addEventListener('click', () => start(readSettings()));
$('retry-btn').addEventListener('click', () => start(state.settings));
$('back-btn').addEventListener('click', quit);
$('quit-btn').addEventListener('click', quit);

$('answer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submitAnswer();
});

// 数字以外は入力させない
$('answer').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^\d]/g, '');
});

$('keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const input = $('answer');
  if (btn.dataset.key === 'clear') input.value = '';
  else if (btn.dataset.key === 'back') input.value = input.value.slice(0, -1);
  else input.value += btn.textContent;
});

$('setup').addEventListener('change', updateBestLabel);
updateBestLabel();
