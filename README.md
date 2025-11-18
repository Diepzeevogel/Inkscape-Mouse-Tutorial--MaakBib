# Inkscape-Mouse-Tutorial
An attempt at creating a convincing inkscape lookalike environment where kids can learn the different functions of the mouse interactively.

## Demo

This repository contains a small interactive tutorial built with Fabric.js that demonstrates common mouse interactions used in vector editors (select, multi-select, pan, zoom).

### Files
- `index.html` — main demo page
- `src/app.js` — JavaScript logic using Fabric.js
 - `src/main.js` — application entrypoint (ES module)
 - `src/canvas.js` — canvas initialization and input handlers
 - `src/tutorial.js` — tutorial loader and interaction logic
 - `src/overlay.js` — welcome overlay and select highlight button
 - `src/utils.js` — small helpers for SVG parsing and geometry
- `src/style.css` — small stylesheet for layout

### Controls
- Left click: select an object
- Shift + click: add/remove from selection
- Drag: draw a selection box (multiple select)
- Space or middle mouse + drag: pan the canvas
- Mouse wheel: scroll to pan up/down — Ctrl + wheel to zoom
- Ctrl + A: select all; Esc: clear selection

### Run locally
You can open `index.html` directly in some browsers, but it's easiest to run a simple static server from the repository root.

Python 3:
```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Node (if you have `http-server`):
```bash
npx http-server -c-1 .
```

If you want, I can add a tiny dev setup (`package.json`) and a live-reload server — tell me and I'll scaffold it.

