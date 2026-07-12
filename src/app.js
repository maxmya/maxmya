/**
 * ChromaForge 2D - Main App Controller
 * Integrates viewport loop, character state listeners, presets loader, and export compilers.
 */

import { Character } from './character.js?v=6';
import { ViewportCanvas } from './canvas.js?v=6';
import {
  compileSpritesheet,
  downloadPNG,
  generateLibGDXAtlas,
  downloadMetadataJSON,
  downloadConfigJSON,
  parseConfigJSON
} from './exporter.js?v=6';
import { getAnimationPose } from './animations.js?v=6';

// Initialize on module load
  // 1. Initialize character and canvas engine
  const char = new Character();
  const canvasElement = document.getElementById('view-canvas');
  const viewport = new ViewportCanvas(canvasElement, char);

  // Start rendering frame requests
  viewport.startLoop();

  // Cache DOM element selectors
  const elements = {
    // Customization inputs
    sliderBuild: document.getElementById('slider-build'),
    sliderHeight: document.getElementById('slider-height'),
    dirButtons: document.querySelectorAll('.dir-btn'),
    txtHudDirection: document.getElementById('txt-hud-direction'),
    selectGender: document.getElementById('select-gender'),
    chestWrapper: document.getElementById('chest-wrapper'),
    sliderBust: document.getElementById('slider-bust'),
    sliderOutline: document.getElementById('slider-outline'),
    sliderEyeDist: document.getElementById('slider-eye-dist'),
    sliderNoseSize: document.getElementById('slider-nose-size'),
    selectNoseShape: document.getElementById('select-nose-shape'),
    sliderMouthSize: document.getElementById('slider-mouth-size'),
    sliderMouthPos: document.getElementById('slider-mouth-pos'),
    colorSkin: document.getElementById('color-skin'),
    selectHead: document.getElementById('select-head'),
    selectHair: document.getElementById('select-hair'),
    colorHair: document.getElementById('color-hair'),
    selectEyes: document.getElementById('select-eyes'),
    colorEyes: document.getElementById('color-eyes'),
    selectMouth: document.getElementById('select-mouth'),
    selectShirt: document.getElementById('select-shirt'),
    colorShirt: document.getElementById('color-shirt'),
    selectPants: document.getElementById('select-pants'),
    colorPants: document.getElementById('color-pants'),
    selectShoes: document.getElementById('select-shoes'),
    colorShoes: document.getElementById('color-shoes'),
    selectHat: document.getElementById('select-hat'),
    colorHat: document.getElementById('color-hat'),
    selectCape: document.getElementById('select-cape'),
    colorCape: document.getElementById('color-cape'),
    selectWeapon: document.getElementById('select-weapon'),
    colorWeapon: document.getElementById('color-weapon'),
    selectShield: document.getElementById('select-shield'),
    colorShield: document.getElementById('color-shield'),

    // Viewport HUD controls
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    txtZoom: document.getElementById('txt-zoom'),
    btnGridToggle: document.getElementById('btn-grid-toggle'),
    btnSkeletonToggle: document.getElementById('btn-skeleton-toggle'),
    btnResetCam: document.getElementById('btn-reset-cam'),

    // Playback timeline elements
    btnPlayPause: document.getElementById('btn-play-pause'),
    selectAnim: document.getElementById('select-anim'),
    selectAttackStyle: document.getElementById('select-attack-style'),
    attackStyleContainer: document.getElementById('attack-style-container'),
    animationScrubber: document.getElementById('animation-scrubber'),
    txtFrameIndex: document.getElementById('txt-frame-index'),
    sliderSpeed: document.getElementById('slider-speed'),
    txtSpeed: document.getElementById('txt-speed'),

    // Spritesheet compiler controls
    selectExportLayout: document.getElementById('select-export-layout'),
    selectFrameSize: document.getElementById('select-frame-size'),
    sliderFrameCount: document.getElementById('slider-frame-count'),
    txtFrameCount: document.getElementById('txt-frame-count'),
    sliderPadding: document.getElementById('slider-padding'),
    txtPadding: document.getElementById('txt-padding'),
    checkIncludeShadow: document.getElementById('check-include-shadow'),
    checkExportAtlas: document.getElementById('check-export-atlas'),
    checkExportMetadata: document.getElementById('check-export-metadata'),
    exportPreviewCanvas: document.getElementById('export-preview-canvas'),
    exportDimensions: document.getElementById('export-dimensions'),
    btnExportPng: document.getElementById('btn-export-png'),
    btnExportFrame: document.getElementById('btn-export-frame'),

    // Config imports/exports
    importJson: document.getElementById('import-json'),
    exportJson: document.getElementById('export-json')
  };

  // Predefined Presets Database
  const presets = {
    knight: {
      skin: '#ffdbac',
      headShape: 'square',
      hairStyle: 'bald',
      hairColor: '#242424',
      eyeStyle: 'determined',
      eyeColor: '#4b5563',
      mouthStyle: 'neutral',
      shirtStyle: 'armor',
      shirtColor: '#9ca3af',
      pantsStyle: 'armored',
      pantsColor: '#4b5563',
      shoesStyle: 'armored',
      shoesColor: '#374151',
      hatStyle: 'knight-helm',
      hatColor: '#9ca3af',
      capeStyle: 'cape',
      capeColor: '#dc2626',
      weaponStyle: 'sword',
      weaponColor: '#d1d5db',
      shieldStyle: 'shield',
      shieldColor: '#2563eb'
    },
    mage: {
      skin: '#f1c27d',
      headShape: 'round',
      hairStyle: 'long',
      hairColor: '#d1a054',
      eyeStyle: 'cute',
      eyeColor: '#8b5cf6',
      mouthStyle: 'smile',
      shirtStyle: 'robe',
      shirtColor: '#4c1d95',
      pantsStyle: 'skirt',
      pantsColor: '#311042',
      shoesStyle: 'boots',
      shoesColor: '#1f2937',
      hatStyle: 'wizard-hat',
      hatColor: '#4c1d95',
      capeStyle: 'wings',
      capeColor: '#ec4899',
      weaponStyle: 'staff',
      weaponColor: '#06b6d4',
      shieldStyle: 'spellbook',
      shieldColor: '#ef4444'
    },
    rogue: {
      skin: '#ffdbac',
      headShape: 'pointy',
      hairStyle: 'spiky',
      hairColor: '#242424',
      eyeStyle: 'angry',
      eyeColor: '#10b981',
      mouthStyle: 'neutral',
      shirtStyle: 'ninja',
      shirtColor: '#1e2937',
      pantsStyle: 'trousers',
      pantsColor: '#111827',
      shoesStyle: 'sneakers',
      shoesColor: '#242424',
      hatStyle: 'rogue-hood',
      hatColor: '#1e2937',
      capeStyle: 'cape',
      capeColor: '#111827',
      weaponStyle: 'dagger',
      weaponColor: '#d1d5db',
      shieldStyle: 'none',
      shieldColor: '#9ca3af'
    },
    ranger: {
      skin: '#e0ac69',
      headShape: 'oval',
      hairStyle: 'ponytail',
      hairColor: '#b83232',
      eyeStyle: 'normal',
      eyeColor: '#10b981',
      mouthStyle: 'smile',
      shirtStyle: 'tunic',
      shirtColor: '#047857',
      pantsStyle: 'shorts',
      pantsColor: '#b45309',
      shoesStyle: 'boots',
      shoesColor: '#78350f',
      hatStyle: 'bandana',
      hatColor: '#dc2626',
      capeStyle: 'quiver',
      capeColor: '#78350f',
      weaponStyle: 'bow',
      weaponColor: '#78350f',
      shieldStyle: 'none',
      shieldColor: '#9ca3af'
    },
    cleric: {
      gender: 'female', bust: 0.8, build: 0.9, height: 1.0,
      skin: '#f1c27d', headShape: 'oval', hairStyle: 'bob', hairColor: '#d1a054',
      eyeStyle: 'normal', eyeColor: '#3b82f6', mouthStyle: 'smile',
      shirtStyle: 'cleric-robes', shirtColor: '#ffffff', pantsStyle: 'skirt', pantsColor: '#ffffff',
      shoesStyle: 'barefoot', shoesColor: '#ffffff', hatStyle: 'none', hatColor: '#ffffff',
      capeStyle: 'cape', capeColor: '#fbbf24', weaponStyle: 'mace', weaponColor: '#9ca3af',
      shieldStyle: 'shield', shieldColor: '#fbbf24'
    },
    barbarian: {
      gender: 'male', build: 1.4, height: 1.2,
      skin: '#8d5524', headShape: 'square', hairStyle: 'bald', hairColor: '#242424',
      eyeStyle: 'angry', eyeColor: '#ef4444', mouthStyle: 'teeth',
      shirtStyle: 'none', shirtColor: '#ffffff', pantsStyle: 'shorts', pantsColor: '#3f2717',
      shoesStyle: 'barefoot', shoesColor: '#ffffff', hatStyle: 'none', hatColor: '#ffffff',
      capeStyle: 'none', capeColor: '#ffffff', weaponStyle: 'axe', weaponColor: '#4b5563',
      shieldStyle: 'none', shieldColor: '#ffffff'
    },
    necromancer: {
      gender: 'male', build: 0.8, height: 1.1,
      skin: '#a5f3fc', headShape: 'pointy', hairStyle: 'long', hairColor: '#242424',
      eyeStyle: 'glowing', eyeColor: '#10b981', mouthStyle: 'smirk',
      shirtStyle: 'robe', shirtColor: '#111827', pantsStyle: 'skirt', pantsColor: '#111827',
      shoesStyle: 'boots', shoesColor: '#0f172a', hatStyle: 'rogue-hood', hatColor: '#111827',
      capeStyle: 'cape', capeColor: '#0f172a', weaponStyle: 'wand', weaponColor: '#10b981',
      shieldStyle: 'spellbook', shieldColor: '#4c1d95'
    },
    alien: {
      skin: '#a5f3fc',
      headShape: 'pointy',
      hairStyle: 'bald',
      hairColor: '#4a3728',
      eyeStyle: 'cute',
      eyeColor: '#ec4899',
      mouthStyle: 'blush',
      shirtStyle: 'ninja',
      shirtColor: '#ffffff',
      pantsStyle: 'skirt',
      pantsColor: '#ec4899',
      shoesStyle: 'barefoot',
      shoesColor: '#78350f',
      hatStyle: 'crown',
      hatColor: '#ffffff',
      capeStyle: 'wings',
      capeColor: '#06b6d4',
      weaponStyle: 'staff',
      weaponColor: '#ec4899',
      shieldStyle: 'spellbook',
      shieldColor: '#a5f3fc'
    }
  };

  /**
   * Sync character model changes back to DOM picker values
   */
  function syncUIFromModel() {
    elements.sliderBuild.value = char.build || 1.0;
    elements.sliderHeight.value = char.height || 1.0;
    
    elements.dirButtons.forEach(btn => {
      if (parseInt(btn.dataset.dir) === char.direction) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (elements.txtHudDirection) {
      const dirNames = [
        'South (Front)', 'South-East', 'East (Profile)', 'North-East',
        'North (Back)', 'North-West', 'West (Profile)', 'South-West'
      ];
      elements.txtHudDirection.innerText = dirNames[char.direction] || 'South';
    }
    
    if (elements.selectGender) {
      elements.selectGender.value = char.gender || 'male';
      if (elements.chestWrapper) {
        elements.chestWrapper.style.display = char.gender === 'female' ? 'block' : 'none';
      }
    }
    if (elements.sliderBust) elements.sliderBust.value = char.bust || 0.5;
    if (elements.sliderOutline) elements.sliderOutline.value = char.outlineThickness !== undefined ? char.outlineThickness : 3.5;

    if (elements.sliderEyeDist) elements.sliderEyeDist.value = char.eyeDistance !== undefined ? char.eyeDistance : 1.0;
    if (elements.sliderNoseSize) elements.sliderNoseSize.value = char.noseSize !== undefined ? char.noseSize : 1.0;
    if (elements.selectNoseShape) elements.selectNoseShape.value = char.noseShape || 'normal';
    if (elements.sliderMouthSize) elements.sliderMouthSize.value = char.mouthSize !== undefined ? char.mouthSize : 1.0;
    if (elements.sliderMouthPos) elements.sliderMouthPos.value = char.mouthPos !== undefined ? char.mouthPos : 0;

    elements.colorSkin.value = char.skin;
    elements.selectHead.value = char.headShape;
    elements.selectHair.value = char.hairStyle;
    elements.colorHair.value = char.hairColor;
    elements.selectEyes.value = char.eyeStyle;
    elements.colorEyes.value = char.eyeColor;
    elements.selectMouth.value = char.mouthStyle;
    elements.selectShirt.value = char.shirtStyle;
    elements.colorShirt.value = char.shirtColor;
    elements.selectPants.value = char.pantsStyle;
    elements.colorPants.value = char.pantsColor;
    elements.selectShoes.value = char.shoesStyle;
    elements.colorShoes.value = char.shoesColor;
    elements.selectHat.value = char.hatStyle;
    elements.colorHat.value = char.hatColor;
    elements.selectCape.value = char.capeStyle;
    elements.colorCape.value = char.capeColor;
    elements.selectWeapon.value = char.weaponStyle;
    elements.colorWeapon.value = char.weaponColor;
    elements.selectShield.value = char.shieldStyle;
    elements.colorShield.value = char.shieldColor;

    viewport.requestRender();
    updateExportPreview();
  }

  /**
   * Sync configuration model settings from current DOM inputs
   */
  function syncModelFromUI() {
    char.build = parseFloat(elements.sliderBuild.value);
    char.height = parseFloat(elements.sliderHeight.value);
    
    const activeDirBtn = document.querySelector('.dir-btn.active');
    char.direction = activeDirBtn ? parseInt(activeDirBtn.dataset.dir) : 0;
    
    if (elements.selectGender) {
      char.gender = elements.selectGender.value;
      if (elements.chestWrapper) {
        elements.chestWrapper.style.display = char.gender === 'female' ? 'block' : 'none';
      }
    }
    if (elements.sliderBust) char.bust = parseFloat(elements.sliderBust.value);
    if (elements.sliderOutline) char.outlineThickness = parseFloat(elements.sliderOutline.value);

    if (elements.sliderEyeDist) char.eyeDistance = parseFloat(elements.sliderEyeDist.value);
    if (elements.sliderNoseSize) char.noseSize = parseFloat(elements.sliderNoseSize.value);
    if (elements.selectNoseShape) char.noseShape = elements.selectNoseShape.value;
    if (elements.sliderMouthSize) char.mouthSize = parseFloat(elements.sliderMouthSize.value);
    if (elements.sliderMouthPos) char.mouthPos = parseInt(elements.sliderMouthPos.value);

    char.skin = elements.colorSkin.value;
    char.headShape = elements.selectHead.value;
    char.hairStyle = elements.selectHair.value;
    char.hairColor = elements.colorHair.value;
    char.eyeStyle = elements.selectEyes.value;
    char.eyeColor = elements.colorEyes.value;
    char.mouthStyle = elements.selectMouth.value;
    char.shirtStyle = elements.selectShirt.value;
    char.shirtColor = elements.colorShirt.value;
    char.pantsStyle = elements.selectPants.value;
    char.pantsColor = elements.colorPants.value;
    char.shoesStyle = elements.selectShoes.value;
    char.shoesColor = elements.colorShoes.value;
    char.hatStyle = elements.selectHat.value;
    char.hatColor = elements.colorHat.value;
    char.capeStyle = elements.selectCape.value;
    char.capeColor = elements.colorCape.value;
    char.weaponStyle = elements.selectWeapon.value;
    char.weaponColor = elements.colorWeapon.value;
    char.shieldStyle = elements.selectShield.value;
    char.shieldColor = elements.colorShield.value;

    viewport.requestRender();
    updateExportPreview();
  }

  // --- EVENTS: SIDEBAR CUSTOMIZERS ---

  // Listen to tabs buttons triggers
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Toggle tab header active class
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle pane display
      const activeTabId = `tab-${btn.dataset.tab}`;
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === activeTabId) {
          pane.classList.add('active');
        }
      });
    });
  });

  // Watch for change events on selects & pickers
  const syncInputs = [
    elements.sliderBuild, elements.sliderHeight,
    elements.selectGender, elements.sliderBust, elements.sliderOutline,
    elements.sliderEyeDist, elements.sliderNoseSize, elements.selectNoseShape,
    elements.sliderMouthSize, elements.sliderMouthPos,
    elements.colorSkin, elements.selectHead, elements.selectHair, elements.colorHair,
    elements.selectEyes, elements.colorEyes, elements.selectMouth, elements.selectShirt,
    elements.colorShirt, elements.selectPants, elements.colorPants, elements.selectShoes,
    elements.colorShoes, elements.selectHat, elements.colorHat, elements.selectCape,
    elements.colorCape, elements.selectWeapon, elements.colorWeapon, elements.selectShield,
    elements.colorShield
  ];
  syncInputs.forEach(input => input.addEventListener('input', syncModelFromUI));

  // Direction Pad Button Clicks
  elements.dirButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.dirButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      char.direction = parseInt(btn.dataset.dir);
      
      // Update HUD label
      const dirNames = [
        'South (Front)', 'South-East', 'East (Profile)', 'North-East',
        'North (Back)', 'North-West', 'West (Profile)', 'South-West'
      ];
      if (elements.txtHudDirection) {
        elements.txtHudDirection.innerText = dirNames[char.direction] || 'South';
      }

      viewport.requestRender();
      updateExportPreview();
    });
  });

  // Auto-adjust default proportions and settings when toggling female body
  elements.selectGender.addEventListener('change', () => {
    if (elements.selectGender.value === 'female') {
      elements.sliderBuild.value = 0.85;
      elements.sliderHeight.value = 0.95;
      elements.sliderBust.value = 0.6;
      if (elements.selectHair.value === 'bald' || elements.selectHair.value === 'mohawk') {
        elements.selectHair.value = 'bob';
      }
      elements.selectPants.value = 'skirt';
      if (elements.selectShirt.value === 'none') {
        elements.selectShirt.value = 'casual-shirt';
      }
    } else {
      elements.sliderBust.value = 0;
    }
    syncModelFromUI();
    syncUIFromModel();
  });

  // Swatch presets shortcut clicks
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      const picker = swatch.closest('.color-picker-wrapper').querySelector('input[type="color"]');
      picker.value = color;
      syncModelFromUI();
    });
  });

  // Preset Cards loading
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const presetKey = card.dataset.preset;
      const presetData = presets[presetKey];
      if (presetData) {
        char.setConfig(presetData);
        syncUIFromModel();
      }
    });
  });

  // --- EVENTS: TIMELINE & VIEWPORT HUD ---

  // HUD: Zoom
  elements.btnZoomIn.addEventListener('click', () => viewport.setZoom(viewport.zoom + 0.25));
  elements.btnZoomOut.addEventListener('click', () => viewport.setZoom(viewport.zoom - 0.25));
  elements.btnResetCam.addEventListener('click', () => viewport.resetCamera());

  // HUD: Grid Toggle
  elements.btnGridToggle.addEventListener('click', () => {
    viewport.showGrid = !viewport.showGrid;
    elements.btnGridToggle.classList.toggle('active', viewport.showGrid);
    viewport.requestRender();
  });

  // HUD: Skeleton Toggle
  elements.btnSkeletonToggle.addEventListener('click', () => {
    viewport.showSkeleton = !viewport.showSkeleton;
    elements.btnSkeletonToggle.classList.toggle('active', viewport.showSkeleton);
    viewport.requestRender();
  });

  // HUD callback hook: updates HUD text values when zoomed/frame ticks
  viewport.frameIndexCallback = (zoomPct, frameIndex) => {
    if (zoomPct) {
      elements.txtZoom.innerText = `${zoomPct}%`;
    }
    if (frameIndex !== undefined && frameIndex !== null) {
      elements.animationScrubber.value = frameIndex;
      elements.txtFrameIndex.innerText = `${frameIndex}/${viewport.frameCount}`;
    }
  };

  // Play / Pause Button
  elements.btnPlayPause.addEventListener('click', () => {
    viewport.isPlaying = !viewport.isPlaying;
    const playIcon = elements.btnPlayPause.querySelector('.play-icon');
    playIcon.innerText = viewport.isPlaying ? '⏸' : '▶';
  });

  // Animation Selection Dropdown
  elements.selectAnim.addEventListener('change', () => {
    viewport.animation = elements.selectAnim.value;
    if (elements.selectAnim.value === 'attack') {
      elements.attackStyleContainer.style.display = 'block';
    } else {
      elements.attackStyleContainer.style.display = 'none';
    }
    viewport.currentFrame = 0;
    viewport.requestRender();
    updateExportPreview();
  });

  // Attack Style Dropdown
  elements.selectAttackStyle.addEventListener('change', () => {
    viewport.attackStyle = elements.selectAttackStyle.value;
    viewport.requestRender();
    updateExportPreview();
  });

  // Timeline Scrubber
  elements.animationScrubber.addEventListener('input', () => {
    viewport.isPlaying = false;
    const playIcon = elements.btnPlayPause.querySelector('.play-icon');
    playIcon.innerText = '▶'; // pause playback
    viewport.currentFrame = parseFloat(elements.animationScrubber.value);
    viewport.requestRender();
  });

  // Animation Playback Speed
  elements.sliderSpeed.addEventListener('input', () => {
    viewport.speed = parseFloat(elements.sliderSpeed.value);
    elements.txtSpeed.innerText = `${viewport.speed.toFixed(1)}x`;
  });

  // --- EVENTS: EXPORT SETTINGS ---

  const refreshExportTriggers = [
    elements.selectExportLayout, elements.selectFrameSize,
    elements.sliderFrameCount, elements.sliderPadding, elements.checkIncludeShadow,
    elements.checkExportAtlas, elements.checkExportMetadata
  ];
  refreshExportTriggers.forEach(input => {
    input.addEventListener('input', () => {
      // Sync label text updates
      if (input === elements.sliderFrameCount) {
        elements.txtFrameCount.innerText = `${elements.sliderFrameCount.value} frames`;
      } else if (input === elements.sliderPadding) {
        elements.txtPadding.innerText = `${elements.sliderPadding.value} px`;
      }
      updateExportPreview();
    });
  });

  // Build PNG Spritesheet trigger
  elements.btnExportPng.addEventListener('click', () => {
    const options = {
      frameSize: elements.selectFrameSize.value,
      frameCount: elements.sliderFrameCount.value,
      padding: elements.sliderPadding.value,
      layout: elements.selectExportLayout.value,
      drawShadow: elements.checkIncludeShadow.checked,
      exportAtlas: elements.checkExportAtlas.checked,
      currentAnim: viewport.animation,
      attackStyle: elements.selectAttackStyle.value
    };
    const { exportCanvas, metadata } = compileSpritesheet(char, options);
    const pngName = `chromaforge_${viewport.animation}_sheet.png`;
    downloadPNG(exportCanvas, pngName);
    
    if (options.exportAtlas) {
      const atlasName = `chromaforge_${viewport.animation}_sheet.atlas`;
      generateLibGDXAtlas(atlasName, pngName, options);
    }
    
    if (elements.checkExportMetadata.checked) {
      const metaName = `chromaforge_${viewport.animation}_metadata.json`;
      downloadMetadataJSON(metadata, metaName);
    }
  });

  // Download Current Frame trigger
  elements.btnExportFrame.addEventListener('click', () => {
    const frameSize = parseInt(elements.selectFrameSize.value) || 128;
    const drawShadow = elements.checkIncludeShadow.checked;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameSize;
    tempCanvas.height = frameSize;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    const baseScale = frameSize / 128;
    const cx = frameSize / 2;
    const cy = frameSize * 0.82;

    tempCtx.save();
    tempCtx.translate(cx, cy);
    tempCtx.scale(baseScale, baseScale);

    // Render using current anim progress
    const progress = viewport.currentFrame / viewport.frameCount;
    const pose = getAnimationPose(viewport.animation, progress, char.direction, viewport.attackStyle);
    char.render(tempCtx, pose, { drawShadow });
    tempCtx.restore();

    downloadPNG(tempCanvas, `chromaforge_${viewport.animation}_frame.png`);
  });

  // JSON Save/Load Trigger buttons
  elements.exportJson.addEventListener('click', () => {
    downloadConfigJSON(char, 'chromaforge_config.json');
  });

  elements.importJson.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      parseConfigJSON(e.target.files[0])
        .then(config => {
          char.setConfig(config);
          syncUIFromModel();
          e.target.value = ''; // clear input cache
        })
        .catch(err => alert(err.message));
    }
  });

  /**
   * Refreshes the compiled preview canvas in the right configuration panel
   */
  function updateExportPreview() {
    const options = {
      frameSize: elements.selectFrameSize.value,
      frameCount: elements.sliderFrameCount.value,
      padding: elements.sliderPadding.value,
      layout: elements.selectExportLayout.value,
      drawShadow: elements.checkIncludeShadow.checked,
      currentAnim: viewport.animation,
      attackStyle: elements.selectAttackStyle.value
    };

    const { exportCanvas } = compileSpritesheet(char, options);
    
    // Scale preview drawing context so it fits beautifully in the CSS preview box Y: 160px bounds
    const previewCanvas = elements.exportPreviewCanvas;
    const previewCtx = previewCanvas.getContext('2d');
    
    previewCanvas.width = exportCanvas.width;
    previewCanvas.height = exportCanvas.height;

    // Draw full texture onto preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(exportCanvas, 0, 0);

    // Update Dimensions text labels
    elements.exportDimensions.innerText = `Resolution: ${exportCanvas.width} x ${exportCanvas.height} px`;
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    viewport.resize();
    updateExportPreview();
  });

  // Initial sync & preview render
  syncUIFromModel();
  updateExportPreview();
