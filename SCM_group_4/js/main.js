/**
 * NOVA Scientific — UI controller.
 * Owns input editing, display rendering, theme, keyboard and history UI.
 * Mathematical evaluation is delegated to calculator.js (not connected yet).
 */
import { evaluate } from './calculator.js';
import { ANGLE_MODES, SCIENTIFIC_KEYS, resolveKey } from './scientific.js';
import * as history from './history.js';

const THEME_STORAGE_KEY = 'nova-theme';
const IDLE_STATUS = 'Interface preview · calculation engine not connected';
const OPERATORS = new Set(['+', '−', '×', '÷']);
// Splits an expression into editable tokens so DEL removes "sin(" as one unit.
const TOKEN_PATTERN = /10\^\(|e\^\(|[a-z]+\(|[√∛]\(|Ans|[\s\S]/gu;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const ui = {
  root: document.documentElement,
  display: $('#display'),
  expression: $('#expression'),
  result: $('#result'),
  status: $('#status'),
  badgeShift: $('#badge-shift'),
  badgeAngle: $('#badge-angle'),
  keypad: $('#keypad'),
  shiftKey: $('[data-action="shift"]'),
  angleKey: $('[data-action="angle"]'),
  themeToggle: $('#theme-toggle'),
  settingsToggle: $('#settings-toggle'),
  settingsPanel: $('#settings-panel'),
  historyList: $('#history-list'),
  historyEmpty: $('#history-empty'),
  historyClear: $('#history-clear'),
};

const state = { tokens: [], result: '0', angle: 'DEG', shift: false, ans: null, status: null };

/* ---------- Input editing ---------- */

const tokenize = (text) => text.match(TOKEN_PATTERN) ?? [];
const lastToken = () => state.tokens.at(-1) ?? '';
const isDigit = (t) => /^\d$/.test(t);
const setStatus = (message, kind = 'info') => { state.status = { message, kind }; };
const openDepth = () =>
  state.tokens.reduce((d, t) => (t.endsWith('(') ? d + 1 : t === ')' ? d - 1 : d), 0);

function inputDecimal() {
  for (let i = state.tokens.length - 1; i >= 0; i--) {
    if (state.tokens[i] === '.') return setStatus('This number already has a decimal point');
    if (!isDigit(state.tokens[i])) break;
  }
  if (!isDigit(lastToken())) state.tokens.push('0');
  state.tokens.push('.');
}

function inputOperator(op) {
  const prev = lastToken();
  const before = state.tokens.at(-2) ?? '';
  const atStart = (t) => !t || t.endsWith('(');
  if (atStart(prev)) {
    return op === '−' ? state.tokens.push(op) : setStatus('Start with a number or function');
  }
  if (OPERATORS.has(prev)) {
    if (atStart(before)) return setStatus('Enter a number first');
    state.tokens[state.tokens.length - 1] = op; // replace the previous operator
    return;
  }
  state.tokens.push(op);
}

function inputClose() {
  if (openDepth() <= 0) return setStatus('There is no open parenthesis to close');
  if (lastToken().endsWith('(')) return setStatus('Enter a value first');
  state.tokens.push(')');
}

function inputFunction(name) {
  const def = resolveKey(name, state.shift);
  if (!def) return;
  tokenize(def.insert).forEach((t) => state.tokens.push(t));
  if (state.shift && SCIENTIFIC_KEYS[name].shift) state.shift = false; // SHIFT applies once
}

function isNegatedWhole(t) {
  if (t[0] !== '−' || t[1] !== '(') return false;
  let depth = 0;
  for (let i = 1; i < t.length; i++) {
    if (t[i].endsWith('(')) depth++;
    else if (t[i] === ')' && --depth === 0) return i === t.length - 1;
  }
  return false;
}

function toggleSign() {
  const t = state.tokens;
  if (!t.length) t.push('−');
  else if (t.length === 1 && t[0] === '−') t.length = 0;
  else if (isNegatedWhole(t)) { t.splice(0, 2); t.pop(); }
  else state.tokens = ['−', '(', ...t, ')'];
}

function calculate() {
  const expression = state.tokens.join('');
  if (!expression) return setStatus('Enter an expression first');
  const outcome = evaluate(expression, { angleMode: state.angle, ans: state.ans });
  if (outcome.ok) {
    state.result = outcome.value;
    state.ans = outcome.value;
    history.addEntry(expression, outcome.value);
    setStatus('', 'success');
  } else {
    setStatus(outcome.error, 'error');
  }
}

const handlers = {
  digit: (v) => state.tokens.push(v),
  decimal: inputDecimal,
  operator: inputOperator,
  insert: (v) => tokenize(v).forEach((t) => state.tokens.push(t)),
  close: inputClose,
  fn: inputFunction,
  sign: toggleSign,
  delete: () => state.tokens.pop(),
  clear: () => { state.tokens = []; state.result = '0'; },
  equals: calculate,
  shift: () => { state.shift = !state.shift; },
  angle: () => { state.angle = state.angle === 'DEG' ? 'RAD' : 'DEG'; },
};

function perform(action, value) {
  const handler = handlers[action];
  if (!handler) return;
  state.status = null;
  handler(value);
  render();
}

/* ---------- Rendering ---------- */

function fitResult() {
  const el = ui.result;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && size > 20) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
}

function updateFunctionKeys() {
  $$('[data-fn]').forEach((btn) => {
    const def = resolveKey(btn.dataset.fn, state.shift);
    btn.textContent = def.label;
    btn.setAttribute('aria-label', def.aria);
  });
}

function render() {
  ui.expression.textContent = state.tokens.join('');
  ui.expression.scrollLeft = ui.expression.scrollWidth;
  ui.result.textContent = state.result;
  fitResult();

  ui.badgeShift.classList.toggle('is-on', state.shift);
  ui.shiftKey.classList.toggle('is-active', state.shift);
  ui.shiftKey.setAttribute('aria-pressed', String(state.shift));

  const current = ANGLE_MODES[state.angle];
  const other = ANGLE_MODES[state.angle === 'DEG' ? 'RAD' : 'DEG'];
  ui.badgeAngle.textContent = current.short;
  ui.angleKey.setAttribute('aria-label', `Angle mode: ${current.name}. Switch to ${other.name}`);
  ui.angleKey.classList.toggle('is-active', state.angle === 'RAD');

  updateFunctionKeys();

  const status = state.status ?? { message: IDLE_STATUS, kind: 'idle' };
  ui.status.textContent = status.message;
  ui.display.dataset.state = status.kind;
}

function renderHistory(entries) {
  const items = entries.map((entry) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    const expr = document.createElement('span');
    const res = document.createElement('span');
    btn.type = 'button';
    btn.className = 'history__item';
    btn.dataset.id = String(entry.id);
    btn.setAttribute('aria-label', `Reuse ${entry.expression} equals ${entry.result}`);
    expr.className = 'history__expr';
    expr.textContent = entry.expression;
    res.className = 'history__result';
    res.textContent = entry.result;
    btn.append(expr, res);
    li.append(btn);
    return li;
  });
  ui.historyList.replaceChildren(...items);
  ui.historyList.hidden = entries.length === 0;
  ui.historyEmpty.hidden = entries.length > 0;
  ui.historyClear.disabled = entries.length === 0;
}

/* ---------- Theme & settings ---------- */

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  } catch { return 'dark'; }
}

function applyTheme(theme, persist = false) {
  ui.root.dataset.theme = theme;
  ui.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  if (!persist) return;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* storage unavailable */ }
}

function setSettingsOpen(open) {
  ui.settingsPanel.hidden = !open;
  ui.settingsToggle.setAttribute('aria-expanded', String(open));
}

/* ---------- Keyboard ---------- */

const KEY_MAP = {
  '+': ['operator', '+'], '-': ['operator', '−'], '*': ['operator', '×'], '/': ['operator', '÷'],
  '(': ['insert', '('], ')': ['close', ')'], '%': ['insert', '%'], '^': ['insert', '^'], '!': ['insert', '!'],
  '.': ['decimal'], ',': ['decimal'], '=': ['equals'], Enter: ['equals'],
  Escape: ['clear'], Backspace: ['delete'],
};

function flashKey(action, value) {
  const selector = value === undefined
    ? `[data-action="${action}"]`
    : `[data-action="${action}"][data-value="${CSS.escape(value)}"]`;
  const btn = ui.keypad.querySelector(selector);
  if (!btn) return;
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), 120);
}

function onKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Escape' && !ui.settingsPanel.hidden) return setSettingsOpen(false);
  // Let Enter activate focused header or history buttons natively.
  if (event.key === 'Enter' && event.target.closest('.app-header, .history')) return;
  const mapped = isDigit(event.key) ? ['digit', event.key] : KEY_MAP[event.key];
  if (!mapped) return;
  event.preventDefault();
  perform(...mapped);
  flashKey(...mapped);
}

/* ---------- Events & init ---------- */

ui.keypad.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (btn) perform(btn.dataset.action, btn.dataset.value ?? btn.dataset.fn);
});

ui.historyList.addEventListener('click', (event) => {
  const btn = event.target.closest('.history__item');
  const entry = btn && history.getEntries().find((e) => String(e.id) === btn.dataset.id);
  if (!entry) return;
  // Selecting an entry restores both its expression (editable) and its result.
  state.tokens = tokenize(entry.expression);
  state.result = entry.result;
  setStatus('Loaded from history');
  render();
});

ui.historyClear.addEventListener('click', () => {
  history.clearHistory();
  setStatus('History cleared');
  render();
});

ui.themeToggle.addEventListener('click', () => {
  applyTheme(ui.root.dataset.theme === 'dark' ? 'light' : 'dark', true);
});

ui.settingsToggle.addEventListener('click', () => setSettingsOpen(ui.settingsPanel.hidden));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.settings')) setSettingsOpen(false);
});
document.addEventListener('keydown', onKeydown);
window.addEventListener('resize', fitResult);

history.subscribe(renderHistory);
applyTheme(readTheme());
renderHistory(history.getEntries());
render();
