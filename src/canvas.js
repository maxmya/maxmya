/**
 * ChromaForge 2D - Viewport Canvas Engine
 * Manages rendering viewport, zoom, panning, world grid, and frame-rate loops.
 */

import { getAnimationPose } from './animations.js?v=13';

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
    this.showSkeleton = false;
    this.attackStyle = 'melee';
    // Mirrors the export's "Bake Arrow Into Sprites" setting so the preview shows what will
    // actually land in the sheet.
    this.drawArrow = true;

    // Animation playback state
    this.animation = 'idle';
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
   * Resizes the canvas backing store to match layout size with DPI awareness
   */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
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
    const dpr = this.dpr || 1;
    const logicalW = this.canvas.width / dpr;
    const logicalH = this.canvas.height / dpr;
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, logicalW, logicalH);

    // World center coordinates
    const cx = logicalW / 2 + this.panX;
    const cy = logicalH / 2 + 80 + this.panY; // Offset Y down to leave space for head

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw grid
    if (this.showGrid) {
      this.drawGrid();
    }

    // Get normalized frame progress (0.0 to 1.0)
    const progress = this.currentFrame / this.frameCount;
    const pose = getAnimationPose(this.animation, progress, this.character.direction, this.attackStyle);

    // Render character at world origin Y:0 (ground level)
    this.character.render(this.ctx, pose, { drawShadow: true, drawArrow: this.drawArrow });

    // Draw skeleton inside the same camera transform so joints align at any zoom
    if (this.showSkeleton) {
      this.drawSkeleton();
    }

    this.ctx.restore();
    this.ctx.restore();
  }

  /** 
     * Draws a skeletal bone and joint node overlay on top of the viewport 
     * Uses world coordinates from character, transforms them to screen space 
     */
    drawSkeleton() {
      const joints = this.character.lastRenderedJoints;
      if (!joints || Object.keys(joints).length === 0) return;

      this.ctx.save();

      // lastRenderedJoints are captured via ctx.getTransform() during character.render(),
      // so they're already absolute device-pixel coordinates (post dpr/camera/zoom/pan).
      // Reset to identity and draw them directly instead of re-applying the camera transform.
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = this.dpr || 1;

      // Connect bones
      const bones = [
        ['hip', 'neck'],
        ['neck', 'head'],
        ['neck', 'leftShoulder'],
        ['neck', 'rightShoulder'],
        ['leftShoulder', 'leftElbow'],
        ['leftElbow', 'leftHand'],
        ['rightShoulder', 'rightElbow'],
        ['rightElbow', 'rightHand'],
        ['hip', 'leftHip'],
        ['hip', 'rightHip'],
        ['leftHip', 'leftKnee'],
        ['leftKnee', 'leftFoot'],
        ['rightHip', 'rightKnee'],
        ['rightKnee', 'rightFoot']
      ];

      this.ctx.strokeStyle = '#06b6d4'; // Cyan bones
      this.ctx.lineWidth = 2.5 * dpr;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (const [j1, j2] of bones) {
        if (joints[j1] && joints[j2]) {
          this.ctx.beginPath();
          this.ctx.moveTo(joints[j1].x, joints[j1].y);
          this.ctx.lineTo(joints[j2].x, joints[j2].y);
          this.ctx.stroke();
        }
      }

      // Draw nodes
      for (const [name, pos] of Object.entries(joints)) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 4.5 * dpr, 0, Math.PI * 2);
      
        // Node coloring
        if (name === 'head') {
          this.ctx.fillStyle = '#ef4444'; // Red
        } else if (name === 'leftHand' || name === 'rightHand') {
          this.ctx.fillStyle = '#fbbf24'; // Yellow
        } else if (name === 'leftFoot' || name === 'rightFoot') {
          this.ctx.fillStyle = '#10b981'; // Green
        } else if (name === 'leftElbow' || name === 'rightElbow' || name === 'leftKnee' || name === 'rightKnee') {
          this.ctx.fillStyle = '#f97316'; // Orange
        } else {
          this.ctx.fillStyle = '#8b5cf6'; // Purple
        }
      
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5 * dpr;
        this.ctx.fill();
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

  /**
   * Draws a glowing coordinate helper grid
   */
  drawGrid() {
    const size = 160;
    const step = 32;

    this.ctx.save();
    
    // Transform coordinates to render flat grid on the isometric ground plane
    const cos30 = 0.866025;
    const sin30 = 0.5;
    this.ctx.transform(cos30, sin30, -cos30, sin30, 0, 0);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    // Draw minor gridlines on the ground plane
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

    // Draw major axes (Ground axes)
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)'; // Faint Cyan X-axis
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(0, size);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.28)'; // Faint Purple Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(-size, 0);
    this.ctx.lineTo(size, 0);
    this.ctx.stroke();

    this.ctx.restore();

    // Draw a small vertical Z-axis line at the origin (0, 0)
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)'; // Red vertical axis
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -64);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.fill();
    this.ctx.restore();
  }
}
