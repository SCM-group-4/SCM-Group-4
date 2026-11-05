import test from 'node:test';
import assert from 'node:assert/strict';
import { convertAmount, fetchExchangeRate, formatCurrency } from '../currency.js';

test('converts an amount using a positive rate', () => {
  assert.ok(Math.abs(convertAmount(10, 0.92) - 9.2) < 1e-12);
  assert.equal(convertAmount(-10, 2), -20);
});

test('rejects invalid amounts and rates', () => {
  assert.throws(() => convertAmount(Number.NaN, 1), RangeError);
  assert.throws(() => convertAmount(1, 0), RangeError);
  assert.throws(() => convertAmount(Number.MAX_VALUE, 2), RangeError);
});

test('formats results using the selected currency', () => {
  assert.match(formatCurrency(12.5, 'USD'), /12\.50/);
  assert.match(formatCurrency(1200, 'JPY'), /1,200/);
});

test('requests and validates the selected exchange rate', async () => {
  let requestUrl;
  const result = await fetchExchangeRate('USD', 'EUR', async (url) => {
    requestUrl = new URL(url);
    return {
      ok: true,
      json: async () => ({ date: '2026-11-04', rates: { EUR: 0.92 } }),
    };
  });

  assert.equal(requestUrl.searchParams.get('base'), 'USD');
  assert.equal(requestUrl.searchParams.get('symbols'), 'EUR');
  assert.deepEqual(result, { rate: 0.92, date: '2026-11-04' });
});

test('reports unavailable or malformed exchange-rate responses', async () => {
  await assert.rejects(
    fetchExchangeRate('USD', 'EUR', async () => ({ ok: false, status: 503 })),
    /HTTP 503/
  );
  await assert.rejects(
    fetchExchangeRate('USD', 'EUR', async () => ({
      ok: true,
      json: async () => ({ date: '2026-11-04', rates: {} }),
    })),
    /invalid response/
  );
  await assert.rejects(fetchExchangeRate('US!', 'EUR', async () => {
    throw new Error('fetch should not run');
  }), /valid three-letter currency codes/);
});
