/**
 * Lesson 2: Rotate (REFACTORED)
 * Demonstrates the improvements from Phase 1 refactoring:
 * - Uses AnimationController for pulse animation
 * - Uses AssetLoader for SVG loading
 * - Uses constants instead of magic numbers
 * - Clear separation of concerns
 * - Improved naming and readability
 */

import { canvas, resetViewport } from './canvas.js';
import { AnimationController } from './AnimationController.js';
import { assetLoader } from './AssetLoader.js';
import { 
  ASSETS, 
  SVG_IDS, 
  INTERACTION_THRESHOLD,
  STYLE 
} from './constants.js';
import { markLessonCompleted } from './utils.js';

// Tutorial state container
class Lesson2State {
  constructor() {
    this.isActive = false;
    this.isInitializing = false;
    this.objects = {
      owl: null,
      wrench: null,
      wrenchOutline: null
    };
    this.animations = {
      wrenchOutlinePulse: null
    };
    this.targetRotation = null;
  }

  reset() {
    this.isActive = false;
    this.objects = {
      owl: null,
      wrench: null,
      wrenchOutline: null
    };
    this.animations = {
      wrenchOutlinePulse: null
    };
    this.targetRotation = null;
  }
}

const lesson2State = new Lesson2State();
let animationController = null;

/**
 * Update page title and toolbar for Lesson 2
 */
function updatePageMetadata() {
  try {
    document.title = 'Inkscape Les 2: Draaien';
    
    const brand = document.querySelector('#toolbar .brand');
    if (brand) {
      const img = brand.querySelector('img');
      brand.innerHTML = '';
      if (img) brand.appendChild(img);
      brand.appendChild(document.createTextNode(' Inkscape Les 2: Draaien'));
    }
  } catch (error) {
    console.warn('[Lesson2] Failed to update page metadata:', error);
  }
}

/**
 * Update instruction panel with lesson objectives
 */
function updateInstructionPanel() {
  try {
    const panel = document.getElementById('panel');
    if (!panel) return;

    panel.innerHTML = `
      <h3>Opdracht</h3>
      <p>Het uiltje heeft een moersleutel nodig!</p>
      <p>Draai de moersleutel naar de juiste hoek.</p>
      <ul>
        <li><img src="assets/icons/left-click.svg" alt="Left click" style="width:30px;height:30px;vertical-align:middle">&nbsp; Linker muisknop: Selecteer de moersleutel</li>
        <li><img src="assets/icons/left-click.svg" alt="Left click" style="width:30px;height:30px;vertical-align:middle">&nbsp; Linker muisknop: Klik een tweede keer op de moersleutel om hem te kunnen draaien.</li>
        <li><i class="fa-solid fa-arrows-rotate"></i>&nbsp; Sleep met de muis op een van de hoekpunten om te roteren</li>
        <li><i class="fa-solid fa-arrows-up-down-left-right"></i>&nbsp; Sleep de sleutel naar de juiste positie</li>
        <li><i class="fa-solid fa-hand-pointer"></i>&nbsp; Laat los om te plaatsen</li>
      </ul>
    `;
  } catch (error) {
    console.warn('[Lesson2] Failed to update instruction panel:', error);
  }
}

/**
 * Load all required SVG assets for Lesson 2
 * @returns {Promise<Object>} Loaded Fabric groups
 */
async function loadLessonAssets() {
  // Load all required identifiers
  const identifiers = [
    'OwlBefore',      // Initial owl (background)
    'Wrench_Outline', // Animated outline
    'UserWrench',     // User's draggable wrench
    'OwlAfter'        // Final owl with wrench in place
  ];

  const groups = await assetLoader.loadFabricGroups(ASSETS.LESSON_2_SVG, identifiers);

  return {
    owlBefore: groups['OwlBefore'],
    wrenchOutline: groups['Wrench_Outline'],
    userWrench: groups['UserWrench'],
    owlAfter: groups['OwlAfter']
  };
}

/**
 * Setup owl object (non-interactive background element)
 * @param {fabric.Group} owlGroup - Loaded owl group
 */
function setupOwl(owlGroup) {
  owlGroup.set({
    selectable: false,
    evented: false,
    visible: true
  });
  canvas.add(owlGroup);
  lesson2State.objects.owlBefore = owlGroup;
  console.log('[Lesson2] OwlBefore added to canvas');
}

function setupOwlAfter(owlGroup) {
  owlGroup.set({
    selectable: false,
    evented: false,
    visible: false
  });
  canvas.add(owlGroup);
  lesson2State.objects.owlAfter = owlGroup;
  console.log('[Lesson2] OwlAfter added to canvas (hidden)');
}

/**
 * Setup wrench outline indicator with pulsing animation
 * @param {fabric.Group} outlineGroup - Loaded wrench outline group
 */
function setupWrenchOutline(outlineGroup) {
  outlineGroup.set({
    selectable: false,
    evented: false,
    visible: true,
    opacity: 1.0
  });
  canvas.add(outlineGroup);
  lesson2State.objects.wrenchOutline = outlineGroup;
  // Start pulsing animation
  console.log('[Lesson2] Starting pulse animation for wrench outline');
  const animationId = animationController.startPulseAnimation(outlineGroup, 'wrench-outline-pulse');
  lesson2State.animations.wrenchOutlinePulse = animationId;
  console.log('[Lesson2] Wrench outline added with pulse animation, ID:', animationId);
  canvas.requestRenderAll();
}

/**
 * Setup draggable and rotatable wrench object
 * @param {fabric.Group} wrenchGroup - Loaded wrench group
 */
function setupWrench(wrenchGroup) {
  lesson2State.originalWrenchRotation = wrenchGroup.angle || 0;
  wrenchGroup.set({
    selectable: true,
    evented: true,
    visible: true
  });
  canvas.add(wrenchGroup);
  lesson2State.objects.userWrench = wrenchGroup;
  console.log('[Lesson2] UserWrench added to canvas (rotatable)');
}
/**
 * Get target rotation from the wrench inside the owl
 * The Wrench in the SVG is drawn at approximately 30 degrees counterclockwise
 * @returns {number} The rotation angle of the target wrench
 */
function getTargetRotation() {
  // The wrench inside the owl is baked into the SVG paths
  // Based on visual inspection, it appears to be rotated about 30 degrees counterclockwise
  // In Fabric.js, we use 330 degrees which is equivalent to -30 degrees
  return 330;  // 330 degrees = -30 degrees (counterclockwise)
}

/**
 * Check if wrench is positioned and rotated correctly to match the target
 * @returns {boolean} True if wrench position and rotation match target within tolerance
 */
function isWrenchAtTargetPosition() {
  const { userWrench, wrenchOutline } = lesson2State.objects;
  if (!userWrench || !wrenchOutline) return false;

  // Check rotation match
  const currentRotation = userWrench.angle || 0;
  const targetRotation = getTargetRotation();
  let angleDiff = Math.abs(currentRotation - targetRotation);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  if (angleDiff >= 5) return false;

  // Check position match (bounding box overlap with outline)
  const wrenchBounds = userWrench.getBoundingRect(true);
  const outlineBounds = wrenchOutline.getBoundingRect(true);
  const wrenchCenterX = wrenchBounds.left + wrenchBounds.width / 2;
  const wrenchCenterY = wrenchBounds.top + wrenchBounds.height / 2;
  const outlineCenterX = outlineBounds.left + outlineBounds.width / 2;
  const outlineCenterY = outlineBounds.top + outlineBounds.height / 2;
  const distance = Math.sqrt(
    Math.pow(wrenchCenterX - outlineCenterX, 2) +
    Math.pow(wrenchCenterY - outlineCenterY, 2)
  );
  return distance < 20;
}

/**
 * Handle successful wrench placement
 */
function handleSuccess() {
  const { owlBefore, owlAfter, userWrench, wrenchOutline } = lesson2State.objects;
  console.log('[Lesson2] handleSuccess called');
  // Stop the outline animation
  if (wrenchOutline) {
    animationController.stopAnimation('wrench-outline-pulse');
    wrenchOutline.visible = false;
    wrenchOutline.opacity = 0;
    wrenchOutline.setCoords();
  }
  // Remove user's wrench
  if (userWrench) {
    canvas.remove(userWrench);
  }
  // Hide OwlBefore
  if (owlBefore) {
    owlBefore.visible = false;
    owlBefore.setCoords();
  }
  // Show OwlAfter
  if (owlAfter) {
    owlAfter.visible = true;
    owlAfter.setCoords();
  }
  // Make everything non-selectable
  const allObjects = canvas.getObjects();
  allObjects.forEach(obj => {
    obj.selectable = false;
    obj.evented = false;
  });
  canvas.requestRenderAll();
  showNextButton();
  try { markLessonCompleted(2); } catch (e) {}
  console.log('[Lesson2] Success! Wrench positioned and rotated correctly.');
}

/**
 * Display button to proceed to next lesson
 */
function showNextButton() {
  const panel = document.getElementById('panel');
  if (!panel) return;

  let button = document.getElementById('next-tutorial-btn');
  if (button) return; // Already exists

  // Replace aside panel text with a short completion message
  panel.innerHTML = '<p>Goed gedaan, je bent klaar voor de volgende les</p>';

  button = document.createElement('button');
  button.id = 'next-tutorial-btn';
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
    // Import dynamically to avoid circular dependencies
    import('./tutorial.js').then(module => {
      module.startLesson3();
    });
  };

  panel.appendChild(button);
}

/**
 * Attach event handler for wrench rotation and movement
 */
function attachEventHandlers() {
  const checkHandler = (event) => {
    const obj = event.target;
    if (obj !== lesson2State.objects.userWrench) return;
    if (isWrenchAtTargetPosition()) {
      // Remove handler to prevent multiple triggers
      canvas.off('object:rotating', checkHandler);
      canvas.off('object:moving', checkHandler);
      canvas.off('object:modified', checkHandler);
      handleSuccess();
    }
  };

  // Check on move, rotate, and after modification
  canvas.on('object:rotating', checkHandler);
  canvas.on('object:moving', checkHandler);
  canvas.on('object:modified', checkHandler);
}

/**
 * Cleanup function to remove all lesson objects and animations
 */
function cleanup() {
  // Stop all animations
  if (animationController) {
    animationController.stopAllAnimations();
  }

  // Remove all objects
  Object.values(lesson2State.objects).forEach(obj => {
    if (obj && canvas.contains(obj)) {
      canvas.remove(obj);
    }
  });

  // Remove event handlers
  canvas.off('object:rotating');
  canvas.off('object:moving');

  // Reset state
  lesson2State.reset();
  
  canvas.requestRenderAll();
  
  console.log('[Lesson2] Cleanup complete');
}

/**
 * Main entry point: Start Lesson 2
 * @returns {Promise<void>}
 */
export async function startLesson2() {
  if (lesson2State.isActive) {
    console.log('[Lesson2] Already active');
    return;
  }

  lesson2State.isActive = true;

  try {
    // Update URL hash
    history.replaceState(null, '', '#lesson=2');
    // Trigger hashchange event to update lesson buttons
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch (error) {
    console.warn('[Lesson2] Could not update URL:', error);
  }

  // Update UI
  updatePageMetadata();
  updateInstructionPanel();

  // Reset viewport to default position and zoom
  resetViewport();

  // Initialize animation controller with current canvas
  if (!animationController) {
    animationController = new AnimationController(canvas);
  }

  console.info('[Lesson2] Loading assets...');


  // Load all assets
  const assets = await loadLessonAssets();
  if (!assets.owlBefore) console.warn('[Lesson2] OwlBefore not found');
  if (!assets.wrenchOutline) console.warn('[Lesson2] Wrench_Outline not found');
  if (!assets.userWrench) console.warn('[Lesson2] UserWrench not found');
  if (!assets.owlAfter) console.warn('[Lesson2] OwlAfter not found');

  // Setup scene objects
  if (assets.owlBefore) setupOwl(assets.owlBefore);
  if (assets.owlAfter) setupOwlAfter(assets.owlAfter);
  if (assets.wrenchOutline) setupWrenchOutline(assets.wrenchOutline);
  if (assets.userWrench) setupWrench(assets.userWrench);

  // Attach interaction handlers
  attachEventHandlers();

  canvas.requestRenderAll();
  
  console.info('[Lesson2] Started successfully');
}

/**
 * Restart Lesson 2 (with cleanup)
 * @returns {Promise<void>}
 */
export async function restartLesson2() {
  if (lesson2State.isInitializing) return;
  
  lesson2State.isInitializing = true;

  try {
    // Cleanup existing state
    cleanup();
    
    // Clear canvas
    canvas.getObjects().slice().forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  } catch (error) {
    console.error('[Lesson2] Cleanup failed:', error);
  }

  // Restart
  lesson2State.isActive = false;
  await startLesson2();
  
  lesson2State.isInitializing = false;
}

// Export cleanup for external use
export { cleanup as cleanupLesson2 };
