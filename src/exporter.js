/**
 * ChromaForge 2D - Spritesheet Compiler & Config Exporter
 * Renders keyframe loops to grid arrays, compiles transparent PNGs, and loads/saves JSON configs.
 */

import { getAnimationPose } from './animations.js?v=6';

export function compileSpritesheet(character, options = {}) {
  const frameSize = parseInt(options.frameSize) || 128;
  const frameCount = parseInt(options.frameCount) || 8;
  const padding = parseInt(options.padding) || 4;
  const layout = options.layout || 'single_dir'; 
  const drawShadow = options.drawShadow !== false;
  const currentAnim = options.currentAnim || 'walk';
  const attackStyle = options.attackStyle || 'melee';
  
  let rows = 1;
  let cols = frameCount;
  const oldDir = character.direction;

  if (layout === 'all_dir') {
    rows = 8;
  }

  const totalWidth = cols * frameSize + (cols - 1) * padding;
  const totalHeight = rows * frameSize + (rows - 1) * padding;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = totalWidth;
  exportCanvas.height = totalHeight;
  const ctx = exportCanvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  window.isOutlinePass = false;

  const baseScale = frameSize / 128;

  // Metadata object tracking joint positions for each generated frame
  const metadata = {
    frameSize,
    frameCount: cols,
    directions: rows,
    frames: []
  };

  for (let r = 0; r < rows; r++) {
    if (layout === 'all_dir') {
      character.direction = r; // Render directions 0 to 7
    }

    for (let c = 0; c < cols; c++) {
      const progress = c / cols;
      const pose = getAnimationPose(currentAnim, progress, character.direction, attackStyle);

      const cellX = c * (frameSize + padding);
      const cellY = r * (frameSize + padding);
      const cx = cellX + frameSize / 2;
      const cy = cellY + frameSize * 0.82;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(baseScale, baseScale);
      character.render(ctx, pose, { drawShadow });
      ctx.restore();

      // Capture absolute joint positions relative to this frame's cell
      const joints = character.lastRenderedJoints;
      const frameData = {
        direction: character.direction,
        frameIndex: c,
        progress: progress,
        joints: {}
      };
      
      if (joints) {
        for (const [jointName, pos] of Object.entries(joints)) {
          // Adjust from global canvas space to local frame space
          frameData.joints[jointName] = {
            x: Math.round(pos.x - cellX),
            y: Math.round(pos.y - cellY)
          };
        }
      }
      metadata.frames.push(frameData);
    }
  }

  character.direction = oldDir; // Restore original direction

  return { exportCanvas, metadata };
}

export function downloadPNG(spritesheetCanvas, filename = 'spritesheet.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = spritesheetCanvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates a LibGDX .atlas format string and triggers a download.
 */
export function generateLibGDXAtlas(filename, pngFilename, options) {
  const frameSize = parseInt(options.frameSize) || 128;
  const frameCount = parseInt(options.frameCount) || 8;
  const padding = parseInt(options.padding) || 4;
  const layout = options.layout || 'single_dir';
  const currentAnim = options.currentAnim || 'walk';

  const rows = layout === 'all_dir' ? 8 : 1;
  const totalWidth = frameCount * frameSize + (frameCount - 1) * padding;
  const totalHeight = rows * frameSize + (rows - 1) * padding;
  
  let atlasText = "";
  atlasText += `${pngFilename}\n`;
  atlasText += `size: ${totalWidth},${totalHeight}\n`;
  atlasText += `format: RGBA8888\n`;
  atlasText += `filter: Linear,Linear\n`;
  atlasText += `repeat: none\n`;

  const directions = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];

  for (let r = 0; r < rows; r++) {
    const dirSuffix = layout === 'all_dir' ? `_${directions[r]}` : '';
    for (let c = 0; c < frameCount; c++) {
      const cellX = c * (frameSize + padding);
      const cellY = r * (frameSize + padding);
      
      atlasText += `${currentAnim}${dirSuffix}\n`;
      atlasText += `  rotate: false\n`;
      atlasText += `  xy: ${cellX}, ${cellY}\n`;
      atlasText += `  size: ${frameSize}, ${frameSize}\n`;
      atlasText += `  orig: ${frameSize}, ${frameSize}\n`;
      atlasText += `  offset: 0, 0\n`;
      atlasText += `  index: ${c}\n`;
    }
  }

  const blob = new Blob([atlasText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function downloadMetadataJSON(metadataObj, filename = 'metadata.json') {
  const data = JSON.stringify(metadataObj, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function downloadConfigJSON(character, filename = 'character_preset.json') {
  const data = JSON.stringify(character.getConfig(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function parseConfigJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        resolve(config);
      } catch (err) {
        reject(new Error('Invalid JSON structure: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsText(file);
  });
}
