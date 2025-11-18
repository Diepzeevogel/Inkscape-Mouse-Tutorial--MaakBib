import { initCanvas, centerCanvas, canvas } from './canvas.js';
import { installWelcomeOverlay, createSelectOverlayButton } from './overlay.js';
import { startTutorial } from './tutorial.js';

// Initialize canvas
initCanvas('c');
centerCanvas();

// Install overlay and hook select tool
const welcomeOverlay = installWelcomeOverlay();
const selectTool = document.getElementById('tool-select');
const selectButtonOverlay = createSelectOverlayButton(() => {
  if (welcomeOverlay && welcomeOverlay.parentNode) welcomeOverlay.parentNode.removeChild(welcomeOverlay);
  if (selectButtonOverlay && selectButtonOverlay.parentNode) selectButtonOverlay.parentNode.removeChild(selectButtonOverlay);
  if (selectTool) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    selectTool.classList.add('active');
  }
  startTutorial();
});
document.body.appendChild(selectButtonOverlay);

// Wire the select tool in the left toolbar
if (selectTool) {
  selectTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    selectTool.classList.add('active');
    if (welcomeOverlay && welcomeOverlay.parentNode) welcomeOverlay.parentNode.removeChild(welcomeOverlay);
    if (selectButtonOverlay && selectButtonOverlay.parentNode) selectButtonOverlay.parentNode.removeChild(selectButtonOverlay);
    startTutorial();
  });
}

// Disable all non-select tools for the first lesson
document.querySelectorAll('#leftToolbar .tool-btn').forEach(b => {
  if (b.id !== 'tool-select') {
    b.disabled = true;
    b.setAttribute('aria-disabled', 'true');
  }
});

// Remove overlay when selection is made in Fabric
if (canvas) {
  canvas.on('selection:created', () => {
    if (welcomeOverlay && welcomeOverlay.parentNode) welcomeOverlay.parentNode.removeChild(welcomeOverlay);
    if (selectButtonOverlay && selectButtonOverlay.parentNode) selectButtonOverlay.parentNode.removeChild(selectButtonOverlay);
  });
}

// Keyboard shortcut to activate the select tool and dismiss overlay
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'v') {
    if (welcomeOverlay && welcomeOverlay.parentNode) welcomeOverlay.parentNode.removeChild(welcomeOverlay);
    if (selectTool) {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      selectTool.classList.add('active');
    }
  }
});

// Highlight select tool
if (selectTool) selectTool.classList.add('highlight');

// Expose for debugging
window.startTutorial = startTutorial;

// Ensure Fabric.js canvases are styled correctly
// --- Canvas CSS: ensure pointer events and scrolling work ---
const style = document.createElement('style');
style.innerHTML = `
  canvas.lower-canvas, canvas.upper-canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    height: 100% !important;
    pointer-events: auto !important;
    touch-action: none;
  }
  canvas.lower-canvas {
    z-index: 0;
    background: #fff;
  }
  canvas.upper-canvas {
    z-index: 1;
    background: transparent !important;
  }
`;
document.head.appendChild(style);
// Note: pointer-events: auto is required for scrolling and selection to work with Fabric.js.
