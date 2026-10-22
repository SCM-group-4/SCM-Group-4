# NOVA Scientific

A scientific calculator built with HTML5, CSS3 and vanilla JavaScript.
The calculation engine is connected and supports arithmetic, scientific
functions, DEG/RAD trigonometry, constants, factorials, percentages, and
scientific notation.

## Run locally

The JavaScript uses ES modules, which browsers block on `file://`. Serve the folder instead:

```bash
cd scientific-calculator
python3 -m http.server 8080     # or: npm start
# open http://localhost:8080
```

## Structure

| Path | Role |
| --- | --- |
| `index.html` | Semantic markup: header, display, keypad, history |
| `css/style.css` | Design tokens (dark/light themes), layout, components |
| `js/main.js` | UI controller: input, rendering, theme, keyboard, history |
| `js/calculator.js` | Calculation engine: parser, scientific functions, formatting |
| `js/scientific.js` | Scientific key labels, SHIFT variants, inserted expressions |
| `js/history.js` | In-memory history store |

The keypad supports inverse trigonometric functions, cube roots, cubes, and
powers of ten or e through the SHIFT key. Results and errors are shown on the
display, and successful calculations are added to history.
