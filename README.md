
# Inkscape Mouse Interaction Tutorials

This is an interactive Fabric.js demo that teaches common mouse interactions used in vector editors. This project emulates small lesson flows (placing a helmet on an owl, collecting tools into a toolbox) for learning selection and drag interactions.

**Files (high level)**
- `index.html` — demo page and panel layout
- `src/main.js` — application entrypoint, overlay wiring, lesson buttons and hash-based routing
- `src/canvas.js` — Fabric canvas init, input/panning/selection handlers
- `src/tutorial.js` — lesson loaders, `startTutorial()`, `startTutorialDirect()`, `startSecondTutorial()`, and `prepareLesson2State()`
- `src/overlay.js` — welcome overlay and select-tool overlay button
- `src/utils.js` — helpers for extracting SVG fragments and creating Fabric groups
- `assets/tutorials/les1.svg`, `assets/tutorials/les2.svg` — lesson SVGs
- `assets/icons/tutorial_icons/les1.svg`, `assets/icons/tutorial_icons/les2.svg` — lesson icons used in the fixed button bar

**Tutorial Behavior**
- Lesson 1: Places an owl, a draggable helmet, and a helmet target; helmet target pulses (looping opacity animation). When the helmet is dropped close to the target, the final `owl_with_helmet` group is shown and a button to proceed appears.
- Lesson 2: Lays out tools around a canvas `Toolbox` group. User needs to use `Shift+click` multi-select to select all items. Dragging selected tools over the toolbox collects them and triggers a bounce animation on the toolbox.

**Lesson Buttons (bottom bar)**
- Buttons are rendered in a fixed container appended to `document.body` and visually aligned to the bottom-center of the aside `#panel`. They survive panel content updates.
- Clicking a lesson button switches to that lesson (clears the canvas and runs the appropriate prepare/start sequence). Clicking the active lesson acts as a refresh (re-runs that lesson's initialization).

**URL-based starts**
- Open `/#lesson=1` — starts Lesson 1 directly (removes overlays). `startTutorialDirect()` awaits full initialization to avoid partial states.
- Open `/#lesson=2` — prepares the Owl-with-Helmet state (if not present) and then starts Lesson 2.

**Controls**
- Left click: select an object
- Shift + click: add/remove from selection (multi-select)
- Drag: draw a selection box (unless box selection is disabled for the lesson)
- Space / middle mouse + drag: pan the canvas
- Mouse wheel: default scroll/pan; hold `Ctrl` + wheel to zoom

**Run locally**
Start a static server from the repository root and open the demo in a browser.

Python 3:
```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Node (if you have `http-server`):
```bash
npx http-server -c-1 .
```

**Next steps**
- Add a small `README` section describing the lesson icon file format and how to add new lessons (icons placed in `assets/icons/tutorial_icons/`).
- Make the lesson buttons auto-discover lesson files instead of hardcoding the list.