const CURRENCIES = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['JPY', 'Japanese Yen'],
  ['CAD', 'Canadian Dollar'],
  ['AUD', 'Australian Dollar'],
  ['CHF', 'Swiss Franc'],
  ['CNY', 'Chinese Yuan'],
  ['INR', 'Indian Rupee'],
  ['NZD', 'New Zealand Dollar'],
  ['SEK', 'Swedish Krona'],
  ['NOK', 'Norwegian Krone'],
  ['DKK', 'Danish Krone'],
  ['PLN', 'Polish Zloty'],
  ['CZK', 'Czech Koruna'],
  ['SGD', 'Singapore Dollar'],
  ['HKD', 'Hong Kong Dollar'],
  ['KRW', 'South Korean Won'],
  ['MXN', 'Mexican Peso'],
  ['BRL', 'Brazilian Real'],
  ['ZAR', 'South African Rand'],
  ['TRY', 'Turkish Lira'],
];

export function convertAmount(amount, rate) {
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError('Amount and exchange rate must be finite numbers, and the rate must be positive.');
  }
  const converted = amount * rate;
  if (!Number.isFinite(converted)) throw new RangeError('The converted amount is outside the supported range.');
  return converted;
}

export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount);
}

export async function fetchExchangeRate(from, to, fetchImpl = globalThis.fetch) {
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    throw new RangeError('Select valid three-letter currency codes.');
  }

  const url = new URL('https://api.frankfurter.dev/v1/latest');
  url.searchParams.set('base', from);
  url.searchParams.set('symbols', to);
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Exchange rate service returned HTTP ${response.status}.`);

  const data = await response.json();
  const rate = data?.rates?.[to];
  if (!Number.isFinite(rate) || rate <= 0 || typeof data?.date !== 'string') {
    throw new Error('The exchange rate service returned an invalid response.');
  }

  return { rate, date: data.date };
}

export function initializeCurrencyConverter() {
  const toggle = document.getElementById('currency-toggle');
  const panel = document.getElementById('currency-panel');
  const form = document.getElementById('currency-form');
  const amountInput = document.getElementById('currency-amount');
  const fromSelect = document.getElementById('currency-from');
  const toSelect = document.getElementById('currency-to');
  const swapButton = document.getElementById('currency-swap');
  const submitButton = document.getElementById('currency-submit');
  const output = document.getElementById('currency-output');
  const rateOutput = document.getElementById('currency-rate');
  const status = document.getElementById('currency-status');

  if (!toggle || !panel || !form || !amountInput || !fromSelect || !toSelect
    || !swapButton || !submitButton || !output || !rateOutput || !status) {
    throw new Error('Currency converter markup is incomplete.');
  }

  for (const [code, name] of CURRENCIES) {
    for (const select of [fromSelect, toSelect]) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${code} — ${name}`;
      select.append(option);
    }
  }

  fromSelect.value = 'USD';
  toSelect.value = 'EUR';

  let activeRequest = null;
  const clearResult = () => {
    activeRequest?.abort();
    activeRequest = null;
    submitButton.disabled = false;
    submitButton.textContent = 'Convert';
    output.textContent = '—';
    rateOutput.textContent = '';
    status.textContent = 'Enter an amount and select Convert.';
    status.dataset.state = 'idle';
  };

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) amountInput.focus();
  });

  form.addEventListener('input', clearResult);
  form.addEventListener('change', clearResult);

  swapButton.addEventListener('click', () => {
    [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
    clearResult();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (amountInput.value.trim() === '' || !Number.isFinite(amount)) {
      status.textContent = 'Enter a valid amount.';
      status.dataset.state = 'error';
      return;
    }

    const controller = new AbortController();
    activeRequest = controller;
    submitButton.disabled = true;
    submitButton.textContent = 'Converting…';
    status.textContent = 'Getting the latest available exchange rate…';
    status.dataset.state = 'loading';

    try {
      const { rate, date } = from === to
        ? { rate: 1, date: null }
        : await fetchExchangeRate(from, to, (url) => fetch(url, { signal: controller.signal }));
      if (controller.signal.aborted) return;

      output.textContent = formatCurrency(convertAmount(amount, rate), to);
      rateOutput.textContent = from === to
        ? `1 ${from} = 1 ${to}`
        : `1 ${from} = ${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 8 }).format(rate)} ${to} · Rate date: ${date}`;
      status.textContent = from === to ? 'Same currency; no exchange rate was needed.' : 'Conversion complete.';
      status.dataset.state = 'success';
    } catch (error) {
      if (controller.signal.aborted) return;
      status.textContent = error instanceof Error
        ? error.message
        : 'Exchange rates are unavailable right now. Please try again.';
      status.dataset.state = 'error';
    } finally {
      if (activeRequest === controller) {
        activeRequest = null;
        submitButton.disabled = false;
        submitButton.textContent = 'Convert';
      }
    }
  });
}

if (typeof document !== 'undefined') initializeCurrencyConverter();
