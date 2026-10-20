/**
 * In-memory calculation history (newest first). No persistence by design.
 * The UI subscribes to changes; the engine integration only needs addEntry().
 */
const MAX_ENTRIES = 100;
const listeners = new Set();
let entries = [];
let nextId = 1;

const emit = () => listeners.forEach((fn) => fn(getEntries()));

export const getEntries = () => entries.slice();

export function addEntry(expression, result) {
  entries = [{ id: nextId++, expression, result }, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

export function clearHistory() {
  entries = [];
  emit();
}

/** @returns {() => void} unsubscribe function */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
