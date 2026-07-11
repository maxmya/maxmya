/**
 * ChromaForge 2D - Viewport Canvas Engine
 * Manages rendering viewport, zoom, panning, world grid, and frame-rate loops.
 */

import { getAnimationPose } from './animations.js';

export class ViewportCanvas {
  /**
   * @param {HTMLCanvasElement} canvasElement - Viewport canvas
   * @param {Character} characterInstance - Active character state
   */
  constructor(canvasElement, characterInstance) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.character = characterInstance;

    // Viewport Camera State
    this.zoom = 2.5; // default 2.5x zoom
    this.panX = 0;
    this.panY = -20;
    
    // Drag state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    // Grid config
    this.showGrid = true;

    // Animation playback state
    this.animation = 'walk';
    this.speed = 1.0;
    this.isPlaying = true;
    this.currentFrame = 0;
    this.frameCount = 60; // timeline length
    
    // Performance timers
    this.lastTime = performance.now();
    this.frameIndexCallback = null; // fires on frame update

    this.initEvents();
    this.resize();
  }

  /**
   * Register drag-and-pan events on the canvas viewport
   */
  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.requestRender();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
    });

    // Zoom on wheel scroll
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      if (e.deltaY < 0) {
        this.setZoom(this.zoom * zoomFactor);
      } else {
        this.setZoom(this.zoom / zoomFactor);
      }
    });
  }

  /**
   * Resizes the canvas backing store to match layout size
   */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.requestRender();
  }

  /**
   * Zoom control
   */
  setZoom(value) {
    this.zoom = Math.max(0.5, Math.min(8.0, value)); // clamp zoom between 0.5x and 8x
    if (this.frameIndexCallback) {
      this.frameIndexCallback(Math.round(this.zoom * 100)); // triggers HUD update
    }
    this.requestRender();
  }

  /**
   * Restore default camera values
   */
  resetCamera() {
    this.zoom = 2.5;
    this.panX = 0;
    this.panY = -20;
    this.setZoom(this.zoom);
  }

  /**
   * Start loop
   */
  startLoop() {
    const loop = (timestamp) => {
      const elapsed = (timestamp - this.lastTime) / 1000.0;
      this.lastTime = timestamp;

      // Update character internal timers (for blinking)
      this.character.update(elapsed);

      if (this.isPlaying) {
        // Animation timeline increment: 60 fps base animation cycles
        // Complete animation cycle every 1.5 seconds * speed modifier
        const animDuration = 1.25 / this.speed; // seconds per cycle
        const framesPerSec = this.frameCount / animDuration;
        this.currentFrame = (this.currentFrame + elapsed * framesPerSec) % this.frameCount;

        if (this.frameIndexCallback) {
          this.frameIndexCallback(null, Math.floor(this.currentFrame));
        }
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Force immediately redraw outside loop
   */
  requestRender() {
    this.render();
  }

  /**
   * Main render call
   */
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // World center coordinates
    const cx = this.canvas.width / 2 + this.panX;
    const cy = this.canvas.height / 2 + 80 + this.panY; // Offset Y down to leave space for head

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw grid
    if (this.showGrid) {
      this.drawGrid();
    }

    // Get normalized frame progress (0.0 to 1.0)
    const progress = this.currentFrame / this.frameCount;
    const pose = getAnimationPose(this.animation, progress);

    // Render character at world origin Y:0 (ground level)
    this.character.render(this.ctx, pose, { drawShadow: true });

    this.ctx.restore();
  }

  /**
   * Draws a glowing coordinate helper grid
   */
  drawGrid() {
    const size = 160;
    const step = 32;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;

    // Draw minor gridlines
    for (let x = -size; x <= size; x += step) {
      if (x === 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, -size);
      this.ctx.lineTo(x, size);
      this.ctx.stroke();
    }
    for (let y = -size; y <= size; y += step) {
      if (y === 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(-size, y);
      this.ctx.lineTo(size, y);
      this.ctx.stroke();
    }

    // Draw major axes (Ground line & Center origin axis)
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)'; // Faint Cyan
    this.ctx.lineWidth = 1.5;
    
    // Y-Axis (Center vertical)
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(0, size);
    this.ctx.stroke();

    // X-Axis (Ground horizontal line)
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)'; // Faint Purple
    this.ctx.beginPath();
    this.ctx.moveTo(-size, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.stroke();

    // Small Origin Crosshair center circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.fill();

    this.ctx.restore();
  }
}
