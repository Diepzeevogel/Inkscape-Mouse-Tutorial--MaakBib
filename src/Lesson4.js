/**
 * Lesson 4: Marquee Selection (Box Selection)
 * Demonstrates:
 * - First unlock the toolbox with the key (rotate over center)
 * - Then use marquee/box selection to select all tools
 * - Drag tools into the open toolbox
 */

import { canvas, resetViewport } from './canvas.js';
import { AnimationController } from './AnimationController.js';
import { assetLoader } from './AssetLoader.js';
import { 
  ASSETS, 
  SVG_IDS, 
  LAYOUT,
  STYLE 
} from './constants.js';
import { markLessonCompleted } from './utils.js';

class Lesson4State {
  constructor() {
    this.isActive = false;
    this.phase = 'unlock'; // 'unlock' or 'collect'
    this.objects = {
      owlWithHelmet: null,
      toolboxClosed: null,
      toolboxOpen: null,
      key: null,
      tools: [] // wrench, screwdriver, saw, pencil, hammer
    };
    this.completed = false;
    this.isDragging = false;
    this.keyUnlocked = false;
  }

  reset() {
    this.isActive = false;
    this.phase = 'unlock';
    this.objects = { 
      owlWithHelmet: null, 
      toolboxClosed: null, 
      toolboxOpen: null, 
      key: null, 
      tools: [] 
    };
    this.completed = false;
    this.isDragging = false;
    this.keyUnlocked = false;
  }
}

const lesson4State = new Lesson4State();
let animationController = null;

/**
 * Update page metadata for Lesson 4
 */
function updatePageMetadata() {
  try {
    document.title = 'Inkscape Les 4: Selectiekader';
    const brand = document.querySelector('#toolbar .brand');
    if (brand) {
      const img = brand.querySelector('img');
      brand.innerHTML = '';
      if (img) brand.appendChild(img);
      brand.appendChild(document.createTextNode(' Inkscape Les 4: Selectiekader'));
    }
  } catch (error) {
    console.warn('[Lesson4] Failed to update metadata:', error);
  }
}

/**
 * Update instruction panel based on current phase
 */
function updateInstructionPanel() {
  try {
    const panel = document.getElementById('panel');
    if (!panel) return;

    if (lesson4State.phase === 'unlock') {
      panel.innerHTML = `
        <h3>Opdracht</h3>
        <p>De gereedschapskist zit op slot!</p>
        <p>Gebruik de sleutel om hem te openen.</p>
        <ol>
          <li><img src="assets/icons/left-click.svg" alt="Left click" style="width:30px;height:30px;vertical-align:middle">&nbsp; Selecteer de sleutel</li>
          <li><i class="fa-solid fa-arrows-up-down-left-right"></i>&nbsp; Sleep de sleutel naar het slot</li>
          <li><i class="fa-solid fa-rotate"></i>&nbsp; Draai de sleutel om te openen</li>
        </ol>
      `;
    } else {
      panel.innerHTML = `
        <h3>Opdracht</h3>
        <p>De kist is open! Nu moet het gereedschap erin.</p>
        <p>Gebruik het selectiekader om alles te selecteren.</p>
        <ol>
          <li><img src="assets/icons/left-click.svg" alt="Left click" style="width:30px;height:30px;vertical-align:middle">&nbsp; Klik en sleep om een selectiekader te maken</li>
          <li>Zorg dat alle gereedschappen binnen het kader vallen</li>
          <li><i class="fa-solid fa-arrows-up-down-left-right"></i>&nbsp;Sleep alles naar de gereedschapskist</li>
        </ol>
      `;
    }
  } catch (error) {
    console.warn('[Lesson4] Failed to update panel:', error);
  }
}

/**
 * Load all SVG assets for Lesson 4
 */
async function loadLessonAssets() {
  // Load owl with helmet from Lesson 1 (end state)
  const lesson1Assets = await assetLoader.loadFabricGroups(ASSETS.LESSON_1_SVG, ['Owl_with_Helmet']);
  
  // Load Lesson 4 tools and toolbox
  const identifiers = ['ToolboxClosed', 'ToolboxOpen', 'Key', 'Wrench', 'Screwdriver', 'Saw', 'Pencil', 'Hammer'];
  const groups = await assetLoader.loadFabricGroups(ASSETS.LESSON_4_SVG, identifiers);
  
  return {
    owlWithHelmet: lesson1Assets['Owl_with_Helmet'],
    toolboxClosed: groups['ToolboxClosed'],
    toolboxOpen: groups['ToolboxOpen'],
    key: groups['Key'],
    wrench: groups['Wrench'],
    screwdriver: groups['Screwdriver'],
    saw: groups['Saw'],
    pencil: groups['Pencil'],
    hammer: groups['Hammer']
  };
}

/**
 * Setup owl with helmet (end state from Lesson 1)
 */
function setupOwlWithHelmet(owlWithHelmet) {
  if (!owlWithHelmet) {
    console.warn('[Lesson4] Owl with helmet not found');
    return;
  }
  
  owlWithHelmet.set({
    selectable: false,
    evented: false,
    visible: true
  });
  
  canvas.add(owlWithHelmet);
  owlWithHelmet.setCoords();
  
  try {
    owlWithHelmet.tutorialId = 'Owl_with_Helmet';
  } catch (e) {
    console.warn('[Lesson4] Could not set tutorialId:', e);
  }
  
  lesson4State.objects.owlWithHelmet = owlWithHelmet;
  console.log('[Lesson4] Owl with helmet added to canvas');
}

/**
 * Setup closed toolbox (initially visible, becomes hidden when unlocked)
 */
function setupToolboxClosed(toolboxClosed) {
  if (!toolboxClosed) {
    console.warn('[Lesson4] ToolboxClosed not found');
    return;
  }
  
  toolboxClosed.set({ 
    selectable: false, 
    evented: false, 
    visible: true 
  });
  
  const baseX = canvas.getWidth() * LAYOUT.TOOLBOX_X_RATIO;
  const topY = canvas.getHeight() / 2 + LAYOUT.TOOLBOX_Y_OFFSET;
  
  toolboxClosed.left = baseX;
  toolboxClosed.top = topY;
  
  canvas.add(toolboxClosed);
  toolboxClosed.setCoords();
  
  try { 
    toolboxClosed.tutorialId = 'ToolboxClosed'; 
  } catch (e) {
    console.warn('[Lesson4] Could not set tutorialId:', e);
  }
  
  lesson4State.objects.toolboxClosed = toolboxClosed;
  console.log('[Lesson4] ToolboxClosed added');
}

/**
 * Setup open toolbox (initially hidden, becomes visible when unlocked)
 */
function setupToolboxOpen(toolboxOpen) {
  if (!toolboxOpen) {
    console.warn('[Lesson4] ToolboxOpen not found');
    return;
  }
  
  // The SVG has class="st14" which sets display:none - we need to override this
  // by ensuring all internal objects are visible when we show the group
  if (toolboxOpen._objects) {
    toolboxOpen._objects.forEach(obj => {
      obj.visible = true;
      obj.opacity = 1;
    });
  }
  
  toolboxOpen.set({ 
    selectable: false, 
    evented: false, 
    visible: false, // Hidden until key unlocks
    opacity: 1
  });
  
  const baseX = canvas.getWidth() * LAYOUT.TOOLBOX_X_RATIO;
  const topY = canvas.getHeight() / 2 + LAYOUT.TOOLBOX_Y_OFFSET;
  
  toolboxOpen.left = baseX;
  toolboxOpen.top = topY;
  
  canvas.add(toolboxOpen);
  toolboxOpen.setCoords();
  
  try { 
    toolboxOpen.tutorialId = 'ToolboxOpen'; 
  } catch (e) {
    console.warn('[Lesson4] Could not set tutorialId:', e);
  }
  
  lesson4State.objects.toolboxOpen = toolboxOpen;
  console.log('[Lesson4] ToolboxOpen added (hidden), internal objects:', toolboxOpen._objects?.length || 0);
}

/**
 * Setup the key object (for unlocking the toolbox)
 */
function setupKey(key) {
  if (!key) {
    console.warn('[Lesson4] Key not found');
    return;
  }
  
  key.set({ 
    selectable: true, 
    evented: true, 
    visible: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true
  });
  
  canvas.add(key);
  key.setCoords();
  
  // Hide scaling controls, show rotation
  if (typeof key.setControlsVisibility === 'function') {
    key.setControlsVisibility({ 
      mt: false, mb: false, ml: false, mr: false, 
      bl: false, br: false, tl: false, tr: false,
      mtr: true // Keep rotation control
    });
  }
  
  try { 
    key.tutorialId = 'Key'; 
  } catch (e) {
    console.warn('[Lesson4] Could not set tutorialId:', e);
  }
  
  lesson4State.objects.key = key;
  console.log('[Lesson4] Key added');
}

/**
 * Setup tool objects at their original SVG positions (not in circle)
 */
function setupTools(tools) {
  const addedTools = [];
  
  Object.values(tools).forEach(tool => {
    if (!tool) return;
    
    tool.set({ 
      selectable: false, // Initially not selectable until toolbox is opened
      evented: false,
      visible: true,
      lockScalingX: true, 
      lockScalingY: true, 
      lockUniScaling: true 
    });
    
    canvas.add(tool);
    tool.setCoords();
    
    // Hide scaling controls
    if (typeof tool.setControlsVisibility === 'function') {
      tool.setControlsVisibility({ 
        mt: false, mb: false, ml: false, mr: false, 
        bl: false, br: false, tl: false, tr: false 
      });
    }
    
    addedTools.push(tool);
  });
  
  // Don't reposition - keep tools at their original SVG positions
  
  lesson4State.objects.tools = addedTools;
  console.log('[Lesson4] Added', addedTools.length, 'tools (initially locked)');
}

/**
 * Check if key is over the center of the closed toolbox
 */
function isKeyOverToolboxCenter() {
  const { key, toolboxClosed } = lesson4State.objects;
  if (!key || !toolboxClosed) {
    return false;
  }
  
  const keyBounds = key.getBoundingRect(true);
  const toolboxBounds = toolboxClosed.getBoundingRect(true);
  
  const keyCenterX = keyBounds.left + keyBounds.width / 2;
  const keyCenterY = keyBounds.top + keyBounds.height / 2;
  const toolboxCenterX = toolboxBounds.left + toolboxBounds.width / 2;
  const toolboxCenterY = toolboxBounds.top + toolboxBounds.height / 2;
  
  const distance = Math.sqrt(
    Math.pow(keyCenterX - toolboxCenterX, 2) +
    Math.pow(keyCenterY - toolboxCenterY, 2)
  );
  
  // Allow 50px tolerance for being "over center"
  return distance < 50;
}

/**
 * Check if key has been rotated enough (any rotation counts)
 */
function hasKeyRotated() {
  const { key } = lesson4State.objects;
  if (!key) return false;
  
  // Check if key has been rotated at least 15 degrees from original
  const currentAngle = key.angle || 0;
  return Math.abs(currentAngle) >= 15;
}

/**
 * Handle unlocking the toolbox
 */
function handleUnlock() {
  if (lesson4State.keyUnlocked) return;
  
  lesson4State.keyUnlocked = true;
  lesson4State.phase = 'collect';
  
  const { key, toolboxClosed, toolboxOpen, tools } = lesson4State.objects;
  
  // Clear selection first to remove selection box
  canvas.discardActiveObject();
  
  // Hide key and closed toolbox
  if (key) {
    key.visible = false;
    key.selectable = false;
    key.evented = false;
    key.setCoords();
  }
  
  if (toolboxClosed) {
    toolboxClosed.visible = false;
    toolboxClosed.setCoords();
  }
  
  // Show open toolbox
  if (toolboxOpen) {
    toolboxOpen.visible = true;
    toolboxOpen.opacity = 1;
    toolboxOpen.setCoords();
    
    // Bring to front so it's not hidden behind other objects
    canvas.bringToFront(toolboxOpen);
  }
  
  // Enable tools for selection
  tools.forEach(tool => {
    tool.selectable = true;
    tool.evented = true;
    tool.setCoords();
  });
  
  // Enable box selection for marquee
  if (canvas) {
    canvas.selection = true;
    canvas.allowBoxSelection = true;
  }
  
  // Update instructions
  updateInstructionPanel();
  
  canvas.requestRenderAll();
  
  console.log('[Lesson4] Toolbox unlocked! Marquee selection enabled.');
}

/**
 * Check if pointer is over the open toolbox
 */
function isPointerOverToolbox(event) {
  if (!event || !lesson4State.objects.toolboxOpen) return false;
  
  const pointer = canvas.getPointer(event);
  const toolboxRect = lesson4State.objects.toolboxOpen.getBoundingRect(true);
  
  return (
    pointer.x >= toolboxRect.left && 
    pointer.x <= toolboxRect.left + toolboxRect.width &&
    pointer.y >= toolboxRect.top && 
    pointer.y <= toolboxRect.top + toolboxRect.height
  );
}

/**
 * Check if all tools are selected
 */
function areAllToolsSelected() {
  const activeObjects = canvas.getActiveObjects();
  const toolCount = lesson4State.objects.tools.length;
  
  if (activeObjects.length !== toolCount) return false;
  
  // Verify all active objects are tools
  return activeObjects.every(obj => lesson4State.objects.tools.includes(obj));
}

/**
 * Handle successful tool collection
 */
function handleSuccess() {
  if (lesson4State.completed) return;
  
  lesson4State.completed = true;
  
  const selectedTools = canvas.getActiveObjects().slice();
  selectedTools.forEach(tool => canvas.remove(tool));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  
  // Animate toolbox with double bounce
  if (lesson4State.objects.toolboxOpen) {
    animationController.doubleBounce(lesson4State.objects.toolboxOpen, () => {
      try { markLessonCompleted(4); } catch (e) {}
      showNextButton();
    });
  } else {
    try { markLessonCompleted(4); } catch (e) {}
    showNextButton();
  }
  
  // Cleanup and restore selection behavior
  cleanupEventHandlers();
  
  console.info('[Lesson4] All tools collected!');
}

/**
 * Show next lesson button
 */
function showNextButton() {
  const panel = document.getElementById('panel');
  if (!panel) return;
  
  let button = document.getElementById('next-tutorial-btn-4');
  if (button) return;

  // Replace aside panel text with a short completion message
  panel.innerHTML = '<p>Goed gedaan, je bent klaar voor de volgende les</p>';

  button = document.createElement('button');
  button.id = 'next-tutorial-btn-4';
  button.style.cssText = `
    display: block;
    width: 100%;
    height: 64px;
    margin: 32px auto 0 auto;
    background: ${STYLE.PRIMARY_COLOR};
    border: none;
    border-radius: ${STYLE.BUTTON_BORDER_RADIUS};
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  button.innerHTML = '<i class="fa-solid fa-arrow-right" style="font-size:2.5em;color:white;"></i>';
  
  button.onclick = () => {
    import('./tutorial.js').then(module => {
      module.startLesson5();
    });
  };
  
  panel.appendChild(button);
}

/**
 * Handle key modified event (for unlock phase) - fires after rotation/move complete
 */
function handleKeyModified(event) {
  if (lesson4State.phase !== 'unlock') return;
  if (lesson4State.keyUnlocked) return;
  
  const obj = event.target;
  if (obj !== lesson4State.objects.key) return;
  
  const isOverCenter = isKeyOverToolboxCenter();
  const hasRotated = hasKeyRotated();
  
  // Check if key is over toolbox center and has been rotated
  if (isOverCenter && hasRotated) {
    handleUnlock();
  }
}

/**
 * Handle key rotating event (for unlock phase)
 */
function handleKeyRotating(event) {
  if (lesson4State.phase !== 'unlock') return;
  if (lesson4State.keyUnlocked) return;
  
  const obj = event.target;
  if (obj !== lesson4State.objects.key) return;
  
  const isOverCenter = isKeyOverToolboxCenter();
  const hasRotated = hasKeyRotated();
  
  // Check if key is over toolbox center and has been rotated
  if (isOverCenter && hasRotated) {
    handleUnlock();
  }
}

/**
 * Handle key moving event (for unlock phase)
 */
function handleKeyMoving(event) {
  if (lesson4State.phase !== 'unlock') return;
  if (lesson4State.keyUnlocked) return;
  
  // Just track position, unlock happens on rotation
}

/**
 * Handle object moving event (for collect phase)
 */
function handleObjectMoving(event) {
  if (lesson4State.phase !== 'collect') return;
  if (lesson4State.completed) return;
  
  lesson4State.isDragging = true;
  
  if (!event || !event.e) return;
  if (!areAllToolsSelected()) return;
  
  if (isPointerOverToolbox(event.e)) {
    handleSuccess();
  }
}

/**
 * Handle mouse up event
 */
function handleMouseUp(event) {
  lesson4State.isDragging = false;
}

/**
 * Attach event handlers
 */
function attachEventHandlers() {
  canvas.on('object:rotating', handleKeyRotating);
  canvas.on('object:modified', handleKeyModified);
  canvas.on('object:moving', handleKeyMoving);
  canvas.on('object:moving', handleObjectMoving);
  canvas.on('mouse:up', handleMouseUp);
}

/**
 * Cleanup event handlers
 */
function cleanupEventHandlers() {
  canvas.off('object:rotating', handleKeyRotating);
  canvas.off('object:modified', handleKeyModified);
  canvas.off('object:moving', handleKeyMoving);
  canvas.off('object:moving', handleObjectMoving);
  canvas.off('mouse:up', handleMouseUp);
}

/**
 * Cleanup function
 */
function cleanup() {
  if (animationController) {
    animationController.stopAllAnimations();
  }
  
  cleanupEventHandlers();
  
  if (lesson4State.objects.owlWithHelmet && canvas.contains(lesson4State.objects.owlWithHelmet)) {
    canvas.remove(lesson4State.objects.owlWithHelmet);
  }
  
  if (lesson4State.objects.toolboxClosed && canvas.contains(lesson4State.objects.toolboxClosed)) {
    canvas.remove(lesson4State.objects.toolboxClosed);
  }
  
  if (lesson4State.objects.toolboxOpen && canvas.contains(lesson4State.objects.toolboxOpen)) {
    canvas.remove(lesson4State.objects.toolboxOpen);
  }
  
  if (lesson4State.objects.key && canvas.contains(lesson4State.objects.key)) {
    canvas.remove(lesson4State.objects.key);
  }
  
  lesson4State.objects.tools.forEach(tool => {
    if (tool && canvas.contains(tool)) {
      canvas.remove(tool);
    }
  });
  
  lesson4State.reset();
  canvas.requestRenderAll();
  
  console.log('[Lesson4] Cleanup complete');
}

/**
 * Start Lesson 4
 */
export async function startLesson4() {
  if (lesson4State.isActive) {
    console.log('[Lesson4] Already active');
    return;
  }
  
  lesson4State.isActive = true;
  lesson4State.phase = 'unlock';
  
  // Initially disable box selection until toolbox is unlocked
  if (canvas) {
    canvas.selection = true;
    canvas.allowBoxSelection = false;
  }
  
  try {
    history.replaceState(null, '', '#lesson=4');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch (e) {
    console.warn('[Lesson4] Could not update URL:', e);
  }
  
  updatePageMetadata();
  updateInstructionPanel();
  
  // Reset viewport to default position and zoom
  resetViewport();
  
  // Initialize animation controller with current canvas
  if (!animationController) {
    animationController = new AnimationController(canvas);
  }
  
  console.info('[Lesson4] Loading assets...');
  
  const assets = await loadLessonAssets();
  
  if (!assets.owlWithHelmet) console.warn('[Lesson4] Owl with helmet not found');
  if (!assets.toolboxClosed) console.warn('[Lesson4] ToolboxClosed not found');
  if (!assets.toolboxOpen) console.warn('[Lesson4] ToolboxOpen not found');
  if (!assets.key) console.warn('[Lesson4] Key not found');
  
  // Setup owl with helmet first (background element)
  if (assets.owlWithHelmet) setupOwlWithHelmet(assets.owlWithHelmet);
  
  // Setup both toolbox states
  if (assets.toolboxClosed) setupToolboxClosed(assets.toolboxClosed);
  if (assets.toolboxOpen) setupToolboxOpen(assets.toolboxOpen);
  
  // Setup key
  if (assets.key) setupKey(assets.key);
  
  // Setup tools (at their original positions, initially not selectable)
  const tools = {
    wrench: assets.wrench,
    screwdriver: assets.screwdriver,
    saw: assets.saw,
    pencil: assets.pencil,
    hammer: assets.hammer
  };
  
  setupTools(tools);
  attachEventHandlers();
  
  canvas.requestRenderAll();
  
  console.info('[Lesson4] Started successfully');
}

/**
 * Restart Lesson 4
 */
export async function restartLesson4() {
  cleanup();
  canvas.getObjects().slice().forEach(obj => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  
  lesson4State.isActive = false;
  await startLesson4();
}

export { cleanup as cleanupLesson4 };
