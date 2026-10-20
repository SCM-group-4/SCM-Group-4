# NOVA Scientific

A scientific calculator built with HTML5, CSS3 and vanilla JavaScript.
**Status: UI phase.** The calculation engine is not connected yet.

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
| `js/main.js` | UI controller: input, rendering, theme, keyboard, history UI |
| `js/calculator.js` | Engine integration point (`evaluate`) — stub |
| `js/scientific.js` | Scientific key labels, SHIFT variants, inserted text |
| `js/history.js` | In-memory history store |

## Connecting the engine later

Implement `evaluate(expression, { angleMode, ans })` in `js/calculator.js` and return
`{ ok: true, value }` or `{ ok: false, error }`. `main.js` already renders results, errors and history from that shape.
