/**
 * Calculation engine for NOVA Scientific.
 *
 * Supports:
 *   - Addition (+), subtraction (−), multiplication (×), division (÷)
 *   - Operator precedence: ^  >  ×÷  >  +−  (with right-associative ^)
 *   - Parentheses for explicit grouping
 *   - Percentage (%) — converts to /100
 *   - Factorial (!)
 *   - Scientific functions: sin, cos, tan, asin, acos, atan, log, ln, abs, √, ∛
 *   - Constants: π, e, Ans
 *   - Scientific notation via E (e.g. 2E3 → 2000)
 *   - Implicit multiplication: 2π, 3(4), (2)(3), π2
 *   - Sign toggling: leading −
 *   - Powers: 10^(…), e^(…), x^y
 *   - Invalid expression and math-error handling
 *
 * The UI calls evaluate() and expects:
 *   { ok: true,  value: string }   — formatted result
 *   { ok: false, error: string }   — short status-bar message
 */
export const ENGINE_CONNECTED = true;

/* ------------------------------------------------------------------ */
/*  Tokeniser                                                          */
/* ------------------------------------------------------------------ */

const TOKEN_TYPES = {
  NUMBER:   'NUMBER',
  OP:       'OP',
  LPAREN:   'LPAREN',
  RPAREN:   'RPAREN',
  FUNC:     'FUNC',
  PERCENT:  'PERCENT',
  FACTORIAL:'FACTORIAL',
  POW:      'POW',
  END:      'END',
};

/**
 * Turn the display string into a flat token list.
 * Inserts implicit multiplication where the UI allows juxtaposition
 * (e.g. "2π", "3(", "(2)(3)", "π2").
 */
function tokenise(raw) {
  const tokens = [];
  let i = 0;

  const peek = () => raw[i] ?? '';
  const advance = () => raw[i++];

  // Whether the last pushed token can be followed by implicit ×
  const implicitMulBefore = () => {
    if (!tokens.length) return false;
    const last = tokens[tokens.length - 1].type;
    return last === TOKEN_TYPES.NUMBER || last === TOKEN_TYPES.RPAREN
        || last === TOKEN_TYPES.PERCENT || last === TOKEN_TYPES.FACTORIAL;
  };

  while (i < raw.length) {
    const ch = peek();

    // Whitespace — skip
    if (ch === ' ' || ch === '\t') { advance(); continue; }

    // Numbers: digits and decimal points
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(raw[i + 1] ?? ''))) {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      let num = '';
      while (i < raw.length && /[\d.]/.test(raw[i])) num += advance();
      // Scientific notation via E: 2E3 → 2×10^3 — handled as part of number
      if (peek() === 'E' && i + 1 < raw.length) {
        advance(); // consume E
        let exp = '';
        if (peek() === '−' || peek() === '-') exp += advance();
        if (!/\d/.test(peek())) throw new SyntaxError('Invalid scientific notation');
        while (i < raw.length && /\d/.test(raw[i])) exp += advance();
        const val = parseFloat(num) * Math.pow(10, parseFloat(exp.replace('−', '-')));
        tokens.push({ type: TOKEN_TYPES.NUMBER, value: val });
      } else {
        if (num.split('.').length > 2) throw new SyntaxError('Invalid number: multiple decimal points');
        tokens.push({ type: TOKEN_TYPES.NUMBER, value: parseFloat(num) });
      }
      continue;
    }

    // Constants
    if (ch === 'π') {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      advance();
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: Math.PI });
      continue;
    }
    // Standalone 'e' constant (not followed by ^ which would be "e^(")
    if (ch === 'e' && raw.substr(i, 2) !== 'e^') {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      advance();
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: Math.E });
      continue;
    }

    // E for scientific notation at the start or after operator
    if (ch === 'E') {
      // standalone E without preceding number — treat as ×10^
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      advance();
      let exp = '';
      if (peek() === '−' || peek() === '-') exp += advance();
      if (!/\d/.test(peek())) throw new SyntaxError('Invalid scientific notation');
      while (i < raw.length && /\d/.test(raw[i])) exp += advance();
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: Math.pow(10, parseFloat(exp.replace('−', '-'))) });
      continue;
    }

    // Named functions and e^(, 10^(
    const funcMatch = raw.slice(i).match(
      /^(10\^\(|e\^\(|asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|abs\(|√\(|∛\()/
    );
    if (funcMatch) {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      const name = funcMatch[1].replace('(', '');
      i += funcMatch[1].length;
      tokens.push({ type: TOKEN_TYPES.FUNC, value: name });
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: '(' });
      continue;
    }

    // Ans placeholder — will be substituted
    if (raw.substr(i, 3) === 'Ans') {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      i += 3;
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: 'Ans' });
      continue;
    }

    // Operators
    if (ch === '+' || ch === '×' || ch === '÷') {
      advance();
      tokens.push({ type: TOKEN_TYPES.OP, value: ch });
      continue;
    }
    // − (minus / subtraction)
    if (ch === '−') {
      advance();
      tokens.push({ type: TOKEN_TYPES.OP, value: '−' });
      continue;
    }

    // Power
    if (ch === '^') {
      advance();
      tokens.push({ type: TOKEN_TYPES.POW, value: '^' });
      continue;
    }

    // Percent
    if (ch === '%') {
      advance();
      tokens.push({ type: TOKEN_TYPES.PERCENT, value: '%' });
      continue;
    }

    // Factorial
    if (ch === '!') {
      advance();
      tokens.push({ type: TOKEN_TYPES.FACTORIAL, value: '!' });
      continue;
    }

    // Parentheses
    if (ch === '(') {
      if (implicitMulBefore()) tokens.push({ type: TOKEN_TYPES.OP, value: '×' });
      advance();
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: '(' });
      continue;
    }
    if (ch === ')') {
      advance();
      tokens.push({ type: TOKEN_TYPES.RPAREN, value: ')' });
      continue;
    }

    // 1÷( from the reciprocal key — already handled above as digits + ÷ + (

    throw new SyntaxError(`Unexpected character: ${ch}`);
  }

  tokens.push({ type: TOKEN_TYPES.END, value: null });
  return tokens;
}

/* ------------------------------------------------------------------ */
/*  Recursive-descent parser (produces a value directly)               */
/*                                                                     */
/*  Grammar (precedence low → high):                                   */
/*    expr     → term   ( (+|−)  term   )*                             */
/*    term     → unary  ( (×|÷)  unary  )*                             */
/*    unary    → (−)* power                                            */
/*    power    → postfix ( ^ unary )*    (right-assoc)                  */
/*    postfix  → primary ( ! | % )*                                    */
/*    primary  → NUMBER | FUNC ( expr ) | ( expr )                     */
/* ------------------------------------------------------------------ */

function parse(tokens) {
  let pos = 0;
  const current = () => tokens[pos];
  const eat = (type) => {
    if (current().type !== type) {
      throw new SyntaxError(
        type === TOKEN_TYPES.RPAREN
          ? 'Missing closing parenthesis'
          : `Expected ${type} but got ${current().type}`
      );
    }
    return tokens[pos++];
  };

  function expr() {
    let left = term();
    while (current().type === TOKEN_TYPES.OP && (current().value === '+' || current().value === '−')) {
      const op = eat(TOKEN_TYPES.OP).value;
      const right = term();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function term() {
    let left = unary();
    while (current().type === TOKEN_TYPES.OP && (current().value === '×' || current().value === '÷')) {
      const op = eat(TOKEN_TYPES.OP).value;
      const right = unary();
      if (op === '÷') {
        if (right === 0) throw new RangeError('Cannot divide by zero');
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function unary() {
    let negCount = 0;
    while (current().type === TOKEN_TYPES.OP && current().value === '−') {
      eat(TOKEN_TYPES.OP);
      negCount++;
    }
    let val = power();
    return negCount % 2 === 1 ? -val : val;
  }

  function power() {
    let base = postfix();
    if (current().type === TOKEN_TYPES.POW) {
      eat(TOKEN_TYPES.POW);
      const exp = unary(); // right-associative: parse exponent as unary
      base = Math.pow(base, exp);
    }
    return base;
  }

  function postfix() {
    let val = primary();
    while (current().type === TOKEN_TYPES.PERCENT || current().type === TOKEN_TYPES.FACTORIAL) {
      if (current().type === TOKEN_TYPES.PERCENT) {
        eat(TOKEN_TYPES.PERCENT);
        val = val / 100;
      } else {
        eat(TOKEN_TYPES.FACTORIAL);
        val = factorial(val);
      }
    }
    return val;
  }

  function primary() {
    const tok = current();

    // Number literal (or Ans — already substituted)
    if (tok.type === TOKEN_TYPES.NUMBER) {
      eat(TOKEN_TYPES.NUMBER);
      return tok.value;
    }

    // Function call: name ( expr )
    if (tok.type === TOKEN_TYPES.FUNC) {
      const fn = eat(TOKEN_TYPES.FUNC).value;
      eat(TOKEN_TYPES.LPAREN);
      const arg = expr();
      eat(TOKEN_TYPES.RPAREN);
      return applyFunc(fn, arg);
    }

    // Parenthesised expression
    if (tok.type === TOKEN_TYPES.LPAREN) {
      eat(TOKEN_TYPES.LPAREN);
      const val = expr();
      eat(TOKEN_TYPES.RPAREN);
      return val;
    }

    throw new SyntaxError('Unexpected end of expression');
  }

  const result = expr();

  if (current().type !== TOKEN_TYPES.END) {
    throw new SyntaxError('Invalid expression');
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Built-in functions                                                 */
/* ------------------------------------------------------------------ */

let _angleMode = 'DEG';

function toRad(x) { return _angleMode === 'DEG' ? (x * Math.PI) / 180 : x; }
function fromRad(x) { return _angleMode === 'DEG' ? (x * 180) / Math.PI : x; }

function applyFunc(name, arg) {
  switch (name) {
    case 'sin':  return cleanTrig(Math.sin(toRad(arg)));
    case 'cos':  return cleanTrig(Math.cos(toRad(arg)));
    case 'tan': {
      const r = toRad(arg);
      // Detect exact multiples of 90° where tan is undefined
      if (_angleMode === 'DEG' && arg % 180 !== 0 && Math.abs(arg % 180) === 90) {
        throw new RangeError('tan is undefined at this angle');
      }
      return cleanTrig(Math.tan(r));
    }
    case 'asin':
      if (arg < -1 || arg > 1) throw new RangeError('asin argument must be between −1 and 1');
      return fromRad(Math.asin(arg));
    case 'acos':
      if (arg < -1 || arg > 1) throw new RangeError('acos argument must be between −1 and 1');
      return fromRad(Math.acos(arg));
    case 'atan':
      return fromRad(Math.atan(arg));
    case 'log':
      if (arg <= 0) throw new RangeError('log requires a positive number');
      return Math.log10(arg);
    case 'ln':
      if (arg <= 0) throw new RangeError('ln requires a positive number');
      return Math.log(arg);
    case '10^': return Math.pow(10, arg);
    case 'e^':  return Math.exp(arg);
    case '√':
      if (arg < 0) throw new RangeError('Cannot take square root of a negative number');
      return Math.sqrt(arg);
    case '∛':   return Math.cbrt(arg);
    case 'abs':  return Math.abs(arg);
    default:     throw new SyntaxError(`Unknown function: ${name}`);
  }
}

/** Round away floating-point dust on trig results (sin(180°) → 0, not 1.2e-16). */
function cleanTrig(x) {
  if (Math.abs(x) < 1e-14) return 0;
  if (Math.abs(x - 1) < 1e-14) return 1;
  if (Math.abs(x + 1) < 1e-14) return -1;
  return x;
}

/** Factorial — integers 0…170 only (beyond 170! overflows to Infinity). */
function factorial(n) {
  if (!Number.isFinite(n)) throw new RangeError('Factorial requires a finite number');
  if (n < 0 || !Number.isInteger(n)) throw new RangeError('Factorial requires a non-negative integer');
  if (n > 170) throw new RangeError('Factorial result is too large');
  let result = 1;
  for (let k = 2; k <= n; k++) result *= k;
  return result;
}

/* ------------------------------------------------------------------ */
/*  Result formatting                                                  */
/* ------------------------------------------------------------------ */

function formatResult(value) {
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return 'Undefined';
    return value > 0 ? 'Infinity' : '-Infinity';
  }
  // Use toPrecision for very large / very small magnitudes, otherwise fixed
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-7)) {
    // Scientific notation, trim trailing zeros
    return value.toExponential(10).replace(/\.?0+e/, 'e');
  }
  // Up to 10 significant digits, strip trailing zeros
  let str = parseFloat(value.toPrecision(12)).toString();
  // Avoid long repeating decimals (e.g. 1/3)
  if (str.includes('.') && str.split('.')[1].length > 10) {
    str = parseFloat(value.toPrecision(10)).toString();
  }
  return { ok: true, value: formatResult(result) };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * @param {string} expression
 * @param {{ angleMode: 'DEG'|'RAD', ans: string|null }} context
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
export function evaluate(expression, context) {
  if (!expression || !expression.trim()) {
    return { ok: false, error: 'Enter an expression first' };
  }

  try {
    _angleMode = context.angleMode ?? 'DEG';

    // Tokenise
    const tokens = tokenise(expression);

    // Substitute Ans
    const ansValue = context.ans !== null && context.ans !== undefined ? parseFloat(context.ans) : 0;
    for (const tok of tokens) {
      if (tok.type === TOKEN_TYPES.NUMBER && tok.value === 'Ans') {
        tok.value = Number.isFinite(ansValue) ? ansValue : 0;
      }
    }

    // Parse & evaluate
    const result = parse(tokens);

    if (typeof result !== 'number') {
      return { ok: false, error: 'Invalid expression' };
    }

    return { ok: true, value: formatResult(result) };
  } catch (err) {
    if (err instanceof RangeError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof SyntaxError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: 'Invalid expression' };
  }
}
