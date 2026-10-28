
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../calculator.js';

const context = { angleMode: 'DEG', ans: null };

function check(expression, expected) {
  const actual = evaluate(expression, context);
  assert.equal(actual.ok, true, `${expression} should succeed`);
  assert.equal(actual.value, expected);
}

function checkError(expression) {
  const actual = evaluate(expression, context);
  assert.equal(actual.ok, false, `${expression} should return an error`);
}

test('basic arithmetic', () => {
  check('2+3', '5');
  check('10−4', '6');
  check('3×4', '12');
  check('8÷2', '4');
});

test('operator precedence and parentheses', () => {
  check('2+3×4', '14');
  check('(2+3)×4', '20');
  check('2^3', '8');
});

test('scientific functions', () => {
  check('√(9)', '3');
  check('sin(30)', '0.5');
  check('cos(0)', '1');
  check('5!', '120');
});

test('constants and percentages', () => {
  check('π', '3.141592654');
  check('50%', '0.5');
});

test('handles mathematical errors', () => {
  checkError('5÷0');
  checkError('√(−1)');
  checkError('log(−10)');
});

test('handles invalid expressions', () => {
  checkError('(2+3');
  checkError('2+');
  checkError('');
});