
const CATEGORIES = {
  length: {
    label: 'Length',
    units: ['Meter (m)', 'Kilometer (km)', 'Centimeter (cm)', 'Millimeter (mm)', 'Mile (mi)', 'Yard (yd)', 'Foot (ft)', 'Inch (in)'],
  },
  mass: {
    label: 'Mass',
    units: ['Kilogram (kg)', 'Gram (g)', 'Milligram (mg)', 'Pound (lb)', 'Ounce (oz)', 'Metric tonne (t)'],
  },
  temperature: {
    label: 'Temperature',
    units: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'],
  },
  area: {
    label: 'Area',
    units: ['Square meter (m²)', 'Square kilometer (km²)', 'Square centimeter (cm²)', 'Hectare (ha)', 'Acre (ac)'],
  },
  volume: {
    label: 'Volume',
    units: ['Liter (L)', 'Milliliter (mL)', 'Cubic meter (m³)', 'US gallon (gal)', 'US cup (cup)'],
  },
  speed: {
    label: 'Speed',
    units: ['Meters per second (m/s)', 'Kilometers per hour (km/h)', 'Miles per hour (mph)', 'Feet per second (ft/s)'],
  },
};

const UNIT_FACTORS = {
  length: [
    1,
    1000,
    0.01,
    0.001,
    1609.344,
    0.9144,
    0.3048,
    0.0254,
  ],
  mass: [
    1,
    0.001,
    0.000001,
    0.45359237,
    0.028349523125,
    1000,
  ],
  area: [
    1,
    1_000_000,
    0.0001,
    10000,
    4046.8564224,
  ],
  volume: [
    1,
    0.001,
    1000,
    3.785411784,
    0.2365882365,
  ],
  speed: [
    1,
    1 / 3.6,
    0.44704,
    0.3048,
  ],
};

function toBaseUnit(category, value, unitIndex) {
  if (category === 'temperature') {
    switch (unitIndex) {
      case 0:
        return value + 273.15;
      case 1:
        return (value - 32) * 5 / 9 + 273.15;
      case 2:
        return value;
      default:
        throw new Error('Unknown temperature unit.');
    }
  }

  return value * UNIT_FACTORS[category][unitIndex];
}

function fromBaseUnit(category, value, unitIndex) {
  if (category === 'temperature') {
    switch (unitIndex) {
      case 0:
        return value - 273.15;
      case 1:
        return (value - 273.15) * 9 / 5 + 32;
      case 2:
        return value;
      default:
        throw new Error('Unknown temperature unit.');
    }
  }

  return value / UNIT_FACTORS[category][unitIndex];
}

function convertValue(category, value, fromIndex, toIndex) {
  if (!Number.isFinite(value)) {
    throw new Error('Enter a valid number.');
  }

  if (
    !CATEGORIES[category] ||
    !CATEGORIES[category].units[fromIndex] ||
    !CATEGORIES[category].units[toIndex]
  ) {
    throw new Error('Please select valid units.');
  }

  const baseValue = toBaseUnit(category, value, fromIndex);
  return fromBaseUnit(category, baseValue, toIndex);
}


export function initConverter() {
  const button = document.querySelector('#converter-toggle');

  if (!button) {
    console.warn('NOVA Scientific: Converter button not found.');
    return;
  }

  // Prevent creating the panel twice if initialization runs again.
  if (document.querySelector('#converter-panel')) return;

  const overlay = document.createElement('div');
  overlay.id = 'converter-panel';
  overlay.className = 'converter-overlay';
  overlay.hidden = true;

  overlay.innerHTML = `
    <section
      class="converter-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="converter-title"
    >
      <header class="converter-header">
        <div>
          <p class="converter-eyebrow">NOVA SCIENTIFIC</p>
          <h2 id="converter-title">Unit Converter</h2>
        </div>
        <button
          class="converter-close"
          type="button"
          aria-label="Close converter"
        >×</button>
      </header>

      <label class="converter-label" for="converter-category">
        Category
      </label>
      <select id="converter-category" class="converter-control">
        ${Object.entries(CATEGORIES)
          .map(([value, category]) =>
            `<option value="${value}">${category.label}</option>`
          )
          .join('')}
      </select>

      <label class="converter-label" for="converter-value">
        Value
      </label>
      <input
        id="converter-value"
        class="converter-control"
        type="number"
        inputmode="decimal"
        placeholder="Enter a value"
        value="1"
      />

      <div class="converter-unit-row">
        <div class="converter-unit-field">
          <label class="converter-label" for="converter-from">From</label>
          <select id="converter-from" class="converter-control"></select>
        </div>

        <button
          id="converter-swap"
          class="converter-swap"
          type="button"
          aria-label="Swap units"
          title="Swap units"
        >⇄</button>

        <div class="converter-unit-field">
          <label class="converter-label" for="converter-to">To</label>
          <select id="converter-to" class="converter-control"></select>
        </div>
      </div>

      <div class="converter-result" aria-live="polite">
        <p class="converter-result-label">Converted result</p>
        <output id="converter-result">1</output>
      </div>

      <p class="converter-note">
        Choose a category and units to convert between measurements.
      </p>
    </section>
  `;

  document.body.appendChild(overlay);

  const categorySelect = overlay.querySelector('#converter-category');
  const valueInput = overlay.querySelector('#converter-value');
  const fromSelect = overlay.querySelector('#converter-from');
  const toSelect = overlay.querySelector('#converter-to');
  const resultOutput = overlay.querySelector('#converter-result');
  const closeButton = overlay.querySelector('.converter-close');
  const swapButton = overlay.querySelector('#converter-swap');

  
  
function populateUnits() {
  const units = CATEGORIES[categorySelect.value].units;

  const options = units
    .map((unit, index) =>
      `<option value="${index}">${unit}</option>`
    )
    .join('');

  fromSelect.innerHTML = options;
  toSelect.innerHTML = options;

  toSelect.selectedIndex = units.length > 1 ? 1 : 0;

  updateResult();
}

function updateResult() {
  const value = Number(valueInput.value);

  if (valueInput.value.trim() === '') {
    resultOutput.textContent = 'Enter a value';
    return;
  }

  try {
    const result = convertValue(
      categorySelect.value,
      value,
      Number(fromSelect.value),
      Number(toSelect.value)
    );

    resultOutput.textContent = Number(result.toPrecision(10)).toLocaleString(
      undefined,
      { maximumFractionDigits: 8 }
    );
  } catch (error) {
    resultOutput.textContent = error.message;
  }
}


  function openPanel() {
    overlay.hidden = false;
    valueInput.focus();
  }

  function closePanel() {
    overlay.hidden = true;
    button.focus();
  }

  button.addEventListener('click', openPanel);
  closeButton.addEventListener('click', closePanel);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closePanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden) {
      closePanel();
    }
  });

  categorySelect.addEventListener('change', populateUnits);

  swapButton.addEventListener('click', () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
  });

  populateUnits();
}
