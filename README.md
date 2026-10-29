# SCM-Group-4

A browser-based scientific calculator with arithmetic and scientific functions,
keyboard support, calculation history, and light/dark themes.

## Quadratic equation solver

The **Quadratic solver** toggle opens a separate tool for solving
`ax² + bx + c = 0`. Enter the coefficients to see the discriminant, roots
(real, repeated, or complex), and vertex. The solver also handles linear
equations, equations with no solution, and identities with infinitely many
solutions.

## Run locally

```sh
cd SCM_group_4
npm start
```

Then open `http://localhost:8080`.

## Changes in this update

- Added a separate, toggleable quadratic solver without changing the existing
  scientific calculator workflow.
- Added input validation and calculations for roots, discriminant, and vertex.
- Added handling for repeated and complex roots, plus degenerate linear cases.
