/**
 * Solve ax² + bx + c = 0 and return its roots and vertex when quadratic.
 */
export function solveQuadratic(a, b, c) {
  if (![a, b, c].every(Number.isFinite)) {
    throw new RangeError('Enter finite numbers for all three coefficients.');
  }

  if (a === 0) {
    if (b === 0) {
      return c === 0
        ? { kind: 'all-values', roots: [] }
        : { kind: 'no-solution', roots: [] };
    }

    const root = -c / b;
    if (!Number.isFinite(root)) throw new RangeError('The root is too large to display.');
    return { kind: 'linear', roots: [root] };
  }

  const discriminant = b * b - 4 * a * c;
  if (!Number.isFinite(discriminant)) {
    throw new RangeError('These coefficients are too large to solve reliably.');
  }

  const vertexX = -b / (2 * a);
  const vertexY = -discriminant / (4 * a);
  if (!Number.isFinite(vertexX) || !Number.isFinite(vertexY)) {
    throw new RangeError('The vertex is too large to display.');
  }

  if (discriminant === 0) {
    return {
      kind: 'repeated',
      discriminant,
      roots: [-b / (2 * a)],
      vertex: { x: vertexX, y: vertexY },
    };
  }

  if (discriminant < 0) {
    return {
      kind: 'complex',
      discriminant,
      real: vertexX,
      imaginary: Math.sqrt(-discriminant) / (2 * Math.abs(a)),
      vertex: { x: vertexX, y: vertexY },
    };
  }

  const squareRoot = Math.sqrt(discriminant);
  const q = -0.5 * (b + (b < 0 ? -squareRoot : squareRoot));
  const roots = q === 0
    ? [-b / (2 * a), -b / (2 * a)]
    : [q / a, c / q];
  if (!roots.every(Number.isFinite)) throw new RangeError('A root is too large to display.');

  return {
    kind: 'real',
    discriminant,
    roots: roots.sort((left, right) => left - right),
    vertex: { x: vertexX, y: vertexY },
  };
}
