# NOVA Scientific

A scientific calculator built with HTML5, CSS3 and vanilla JavaScript, with a
connected calculation engine and a separate quadratic-equation solver.

## Run locally

The JavaScript uses ES modules, which browsers block on `file://`. Serve the
folder instead:

```bash
npm start
# open http://localhost:8080
```

## Structure

| Path | Role |
| --- | --- |
| `index.html` | Semantic markup: header, display, keypad, history, and quadratic solver |
| `css/style.css` | Design tokens (dark/light themes), layout, and components |
| `js/main.js` | UI controller: input, rendering, theme, keyboard, history, and mode toggle |
| `js/calculator.js` | Scientific expression parser and evaluator |
| `js/quadratic.js` | Quadratic equation solver for roots and vertex |
| `js/scientific.js` | Scientific key labels, SHIFT variants, and inserted text |
| `js/history.js` | In-memory history store |

## Quadratic solver

Select **Quadratic solver** in the header to switch from the scientific
calculator. Enter coefficients for `ax² + bx + c = 0` and select **Find roots**.
The solver reports the equation, discriminant, roots, and vertex. It handles
two real roots, repeated roots, complex roots, the degenerate linear case
(`a = 0`), equations with no solution, and identities with infinitely many
solutions.

## Changes in this update

- Added a toggle button to switch between the existing scientific calculator
  and a dedicated quadratic solver view.
- Added coefficient validation and results for equation form, discriminant,
  roots, and vertex.
- Added handling for real, repeated, and complex roots, linear equations, no
  solution, and infinitely many solutions.
