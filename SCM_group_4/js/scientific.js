/**
 * Scientific key definitions: labels, accessible names and the text each key
 * inserts, with an optional SHIFT (inverse) variant.
 * The UI uses this map to keep key labels and inserted expressions in sync
 * with the calculation engine.
 */
export const ANGLE_MODES = Object.freeze({
  DEG: { short: 'DEG', name: 'degrees' },
  RAD: { short: 'RAD', name: 'radians' },
});

export const SCIENTIFIC_KEYS = Object.freeze({
  sin:    { label: 'sin', aria: 'Sine',            insert: 'sin(', shift: { label: 'sin⁻¹', aria: 'Inverse sine',    insert: 'asin(' } },
  cos:    { label: 'cos', aria: 'Cosine',          insert: 'cos(', shift: { label: 'cos⁻¹', aria: 'Inverse cosine',  insert: 'acos(' } },
  tan:    { label: 'tan', aria: 'Tangent',         insert: 'tan(', shift: { label: 'tan⁻¹', aria: 'Inverse tangent', insert: 'atan(' } },
  log:    { label: 'log₁₀', aria: 'Base-10 logarithm', insert: 'log(', shift: { label: '10ˣ', aria: 'Ten to the power', insert: '10^(' } },
  ln:     { label: 'ln',  aria: 'Natural logarithm', insert: 'ln(',  shift: { label: 'eˣ',  aria: 'E to the power',   insert: 'e^(' } },
  abs:    { label: '|x|', aria: 'Absolute value',  insert: 'abs(' },
  square: { label: 'x²',  aria: 'Square',          insert: '^2',   shift: { label: 'x³',  aria: 'Cube',             insert: '^3' } },
  sqrt:   { label: '√x',  aria: 'Square root',     insert: '√(',   shift: { label: '³√x', aria: 'Cube root',        insert: '∛(' } },
  pow:    { label: 'xʸ',  aria: 'Power',           insert: '^' },
  inv:    { label: '1/x', aria: 'Reciprocal',      insert: '1÷(' },
  fact:   { label: 'x!',  aria: 'Factorial',       insert: '!' },
});

/** Returns { label, aria, insert } for a key, honouring SHIFT when a variant exists. */
export function resolveKey(name, shiftActive) {
  const def = SCIENTIFIC_KEYS[name];
  if (!def) return null;
  const v = shiftActive && def.shift ? def.shift : def;
  return { label: v.label, aria: v.aria, insert: v.insert };
}
