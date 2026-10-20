/**
 * Calculation engine — INTEGRATION POINT (not implemented in the UI phase).
 *
 * The UI calls evaluate() when "=" is pressed and only depends on this shape:
 *   { ok: true,  value: string }   a formatted result
 *   { ok: false, error: string }   a short message shown in the display status area
 *
 * Expressions use display symbols: × ÷ − π e Ans E ^ ! % and function names
 * such as sin( asin( log( ln( √( ∛( abs( 10^( e^(.
 * Replace the body below; main.js does not need to change.
 */
export const ENGINE_CONNECTED = false;

/**
 * @param {string} expression
 * @param {{ angleMode: 'DEG'|'RAD', ans: string|null }} context
 */
export function evaluate(expression, context) { // eslint-disable-line no-unused-vars
  return { ok: false, error: 'Calculation engine not connected' };
}
