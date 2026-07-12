/**
 * ChromaForge 2D - Character Model
 * Manages customization state, serialization, and coordinate-aware layered rendering.
 */

import {
  drawHeadShape,
  drawEyes,
  drawMouth,
  drawHair,
  drawShirt,
  drawSleeve,
  drawPants,
  drawShoe,
  drawHat,
  drawCape,
  drawWeapon,
  drawLeftHandItem,
  drawHandShape,
  setOutlineThickness
} from './parts.js?v=7';

/** Isometric facing profile for each logical direction (0-4, pre-flip). */
function getIsoProfile(dir) {
  switch (dir) {
    case 0: return { sinTilt: 0, cosTilt: 1.0, headSkew: 0, bodySkew: 0, depthScale: 1.0, faceX: 0, showFace: true };     // South (front)
    case 1: return { sinTilt: 0.18, cosTilt: 0.98, headSkew: 0.25, bodySkew: 0.3, depthScale: 0.92, faceX: 2, showFace: true };  // SE
    case 2: return { sinTilt: 0.0, cosTilt: 1.0, headSkew: 0.0, bodySkew: 0.0, depthScale: 0.6, faceX: 6, showFace: true };    // East (profile)
    case 3: return { sinTilt: -0.15, cosTilt: 0.98, headSkew: -0.2, bodySkew: -0.25, depthScale: 0.88, faceX: 0, showFace: false }; // NE
    case 4: return { sinTilt: 0, cosTilt: 1.0, headSkew: 0, bodySkew: 0, depthScale: 0.8, faceX: 0, showFace: false };    // North (back)
    default: return { sinTilt: 0.18, cosTilt: 0.98, headSkew: 0.25, bodySkew: 0.3, depthScale: 0.92, faceX: 2, showFace: true };
  }
}

/** Screen-space forward vector for limb stride projection per world direction. */
function getFacingVector(direction) {
  switch (direction) {
    case 0: return { fx: 0, fy: 1.0 };       // South — step toward camera
    case 1: return { fx: 0.707, fy: 0.707 }; // SE
    case 2: return { fx: 1.0, fy: 0 };       // East — profile stride
    case 3: return { fx: 0.707, fy: -0.707 }; // NE
    case 4: return { fx: 0, fy: -1.0 };      // North — step away
    case 5: return { fx: -0.707, fy: -0.707 }; // NW (mirrored at render)
    case 6: return { fx: -1.0, fy: 0 };      // West
    case 7: return { fx: -0.707, fy: 0.707 };  // SW
    default: return { fx: 0, fy: 1.0 };
  }
}

function projectLimbSwing(swingAngle, limbLength, direction, height) {
  const facing = getFacingVector(direction);
  const stride = swingAngle * 9 * height;
  const fx = stride * facing.fx;
  const fy = limbLength + stride * facing.fy;
  return {
    angle: Math.atan2(fx, fy),
    length: Math.hypot(fx, fy)
  };
}

function lightenSkin(hex, amount = 0.08) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount) | 0;
  const g = Math.min(255, ((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount) | 0;
  const b = Math.min(255, (num & 0xff) + (255 - (num & 0xff)) * amount) | 0;
  return `rgb(${r},${g},${b})`;
}

function darkenSkin(hex, amount = 0.12) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (num & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

export class Character {
  constructor(config = {}) {
    this.build = config.build || 1.0;
    this.height = config.height || 1.0;
    this.direction = config.direction || 0; // 0:S, 1:SE, 2:E, 3:NE, 4:N, 5:NW, 6:W, 7:SW
    
    this.gender = config.gender || 'male';
    this.bust = config.bust !== undefined ? config.bust : 0.5;

    // Face Details
    this.eyeDistance = config.eyeDistance !== undefined ? config.eyeDistance : 1.0;
    this.noseSize = config.noseSize !== undefined ? config.noseSize : 1.0;
    this.noseShape = config.noseShape || 'normal';
    this.mouthSize = config.mouthSize !== undefined ? config.mouthSize : 1.0;
    this.mouthPos = config.mouthPos !== undefined ? config.mouthPos : 0;

    this.outlineThickness = config.outlineThickness !== undefined ? config.outlineThickness : 3.5;

    this.skin = config.skin || '#ffdbac';
    this.headShape = config.headShape || 'round';
    
    this.hairStyle = config.hairStyle || 'spiky';
    this.hairColor = config.hairColor || '#4a3728';
    
    this.eyeStyle = config.eyeStyle || 'normal';
    this.eyeColor = config.eyeColor || '#3b82f6';
    
    this.mouthStyle = config.mouthStyle || 'smile';
    
    this.shirtStyle = config.shirtStyle || 'tunic';
    this.shirtColor = config.shirtColor || '#3b82f6';
    
    this.pantsStyle = config.pantsStyle || 'trousers';
    this.pantsColor = config.pantsColor || '#4b5563';
    
    this.shoesStyle = config.shoesStyle || 'boots';
    this.shoesColor = config.shoesColor || '#78350f';
    
    this.hatStyle = config.hatStyle || 'none';
    this.hatColor = config.hatColor || '#6b7280';
    
    this.capeStyle = config.capeStyle || 'none';
    this.capeColor = config.capeColor || '#dc2626';
    
    this.weaponStyle = config.weaponStyle || 'sword';
    this.weaponColor = config.weaponColor || '#d1d5db';
    
    this.shieldStyle = config.shieldStyle || 'none';
    this.shieldColor = config.shieldColor || '#9ca3af';

    // Blinking timer state
    this.blinkTimer = 0;
    this.isBlinking = false;
    
    // Store exact pixel coordinates of joints from the last render pass
    this.lastRenderedJoints = {};
  }

  update(deltaTime) {
    this.blinkTimer += deltaTime;
    if (this.isBlinking) {
      if (this.blinkTimer > 0.12) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    } else {
      if (this.blinkTimer > 3.8 + Math.random() * 2) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }
    }
  }

  render(ctx, pose, options = {}) {
    this.lastRenderedJoints = {};
    const isFlipped = this.direction >= 5;
    const dir = isFlipped ? 8 - this.direction : this.direction;
    const iso = getIsoProfile(dir);

    setOutlineThickness(this.outlineThickness);

    ctx.save();
    if (isFlipped) ctx.scale(-1, 1);

    const torsoY = pose.torsoY || 0;
    const torsoX = pose.torsoX || 0;
    const torsoAngle = pose.torsoAngle || 0;
    const headAngle = pose.headAngle || 0;
    const headY = pose.headY || 0;

    const facing = getFacingVector(this.direction);
    const torsoX_screen = torsoX * facing.fx;
    const torsoY_screen = (torsoX * facing.fy) + torsoY;

    let lArmAngle = pose.leftArmAngle || 0;
    let rArmAngle = pose.rightArmAngle || 0;
    let lLegAngle = pose.leftLegAngle || 0;
    let rLegAngle = pose.rightLegAngle || 0;



    const capeWave = (pose.capeWave || 0);
    const weaponSwing = (pose.weaponSwing || 0);

    // Humanoid Proportions (Feminine body scaling)
    let currentHeight = this.height;
    let currentBuild = this.build;
    if (this.gender === 'female') {
      currentHeight *= 0.88; // Slightly shorter
      currentBuild *= 0.82;  // Slender build
    }

    const armLength = 16 * currentHeight;
    const legLength = 16 * currentHeight;
    const torsoHeight = 28 * currentHeight;
    
    // Joint Roots (Y goes UP as negative)
    const hipY = -legLength + torsoY_screen;
    const neckY = hipY - torsoHeight;
    const shoulderY = neckY + (8 * currentHeight);

        // Shoulder & Hip widths change based on direction profile & build
        let hipW = 6 * currentBuild * iso.depthScale;
        let shoulderW = 14 * currentBuild * iso.depthScale;

        if (dir === 2 || dir === 6) {
          hipW = 3 * currentBuild;
          shoulderW = 3 * currentBuild;
        } else if (dir === 1 || dir === 3 || dir === 5 || dir === 7) {
          hipW = 5 * currentBuild;
          shoulderW = 11 * currentBuild;
        }

        const cosTilt = iso.cosTilt;
        const sinTilt = iso.sinTilt;

    if (options.drawShadow !== false) {
      ctx.save();
      ctx.translate(torsoX_screen, torsoX * facing.fy);
      ctx.beginPath();
      const breathingScale = Math.max(0, 1 - (torsoY / 24));
      ctx.ellipse(0, 0, 24 * breathingScale * currentBuild, 6 * breathingScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    const drawCapeLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen, hipY);
      ctx.rotate(torsoAngle);
      ctx.translate(0, neckY - hipY);
      drawCape(ctx, this.capeStyle, this.capeColor, capeWave, dir);
      ctx.restore();
    };

    const drawLeftLegLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen - hipW * cosTilt, hipY - hipW * sinTilt);
      
      if (!isFlipped) this.lastRenderedJoints.leftHip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightHip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      const legProj = projectLimbSwing(lLegAngle, legLength, this.direction, currentHeight);
      const computedLegAngle = legProj.angle;
      const computedLegLength = legProj.length;
      
      ctx.rotate(computedLegAngle);
      
      // Draw bare leg first
      drawPants(ctx, 'trousers', this.skin, computedLegLength, dir, currentBuild);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, computedLegLength, dir, currentBuild);
      
      ctx.translate(0, computedLegLength);
      
      // Apply foot rotation from pose animation
      if (pose) {
        ctx.rotate(isFlipped ? pose.rightFootAngle : pose.leftFootAngle);
      }
      
      if (!isFlipped) this.lastRenderedJoints.leftFoot = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightFoot = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      drawShoe(ctx, this.shoesStyle, this.shoesColor, dir, true);
      ctx.restore();
    };

    const drawLeftArmLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen, hipY);
      ctx.rotate(torsoAngle); 
      ctx.translate(-shoulderW * cosTilt, shoulderY - hipY - shoulderW * sinTilt); 
      
      if (!isFlipped) this.lastRenderedJoints.leftShoulder = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightShoulder = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      const armProj = projectLimbSwing(lArmAngle, armLength, this.direction, currentHeight);
      const computedArmAngle = armProj.angle;
      const computedArmLength = armProj.length;
      
      ctx.rotate(computedArmAngle);
      
      // Draw bare arm first
      drawSleeve(ctx, 'normal', this.skin, computedArmLength, dir, currentBuild);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, computedArmLength, dir, currentBuild);
      
      ctx.save();
      ctx.translate(0, computedArmLength);
      
      if (!isFlipped) this.lastRenderedJoints.leftHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
 
      drawHandShape(ctx, this.skin, true, dir);
      drawLeftHandItem(ctx, this.shieldStyle, this.shieldColor, dir);
      ctx.restore();
      ctx.restore();
    };

    const drawTorsoLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen, hipY);
      ctx.rotate(torsoAngle);
      
      // Shears torso texture vertically to align with 2.5D depth profile
      ctx.transform(1, sinTilt * iso.bodySkew, 0, 1, 0, 0);
      
      this.lastRenderedJoints.hip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      ctx.translate(0, neckY - hipY); // Move to neck to draw down
      
      this.lastRenderedJoints.neck = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      drawShirt(ctx, this.shirtStyle, this.shirtColor, currentHeight, currentBuild, dir, this.gender, this.bust);
      ctx.restore();
    };

    const drawRightLegLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen + hipW * cosTilt, hipY + hipW * sinTilt);
      
      if (!isFlipped) this.lastRenderedJoints.rightHip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftHip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      const legProj = projectLimbSwing(rLegAngle, legLength, this.direction, currentHeight);
      const computedLegAngle = legProj.angle;
      const computedLegLength = legProj.length;
      
      ctx.rotate(computedLegAngle);
      
      // Draw bare leg first
      drawPants(ctx, 'trousers', this.skin, computedLegLength, dir, currentBuild);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, computedLegLength, dir, currentBuild);
      
      ctx.translate(0, computedLegLength);
      
      // Apply foot rotation from pose animation
      if (pose) {
        ctx.rotate(isFlipped ? pose.leftFootAngle : pose.rightFootAngle);
      }
      
      if (!isFlipped) this.lastRenderedJoints.rightFoot = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftFoot = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      drawShoe(ctx, this.shoesStyle, this.shoesColor, dir, false);
      ctx.restore();
    };

    const drawHeadLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen, hipY);
      ctx.rotate(torsoAngle);
      ctx.translate(0, neckY - hipY);
      ctx.rotate(headAngle);
      ctx.translate(0, headY);

      // Shears head shape slightly to match isometric rotation
      ctx.transform(1, sinTilt * iso.headSkew, 0, 1, 0, 0);

      // Neck — no outline, blends smoothly into head and torso
      ctx.beginPath();
      ctx.roundRect(-4.5 * currentBuild, 4, 9 * currentBuild, -14, 4);
      const neckGrad = ctx.createLinearGradient(-4.5 * currentBuild, -10, 4.5 * currentBuild, -10);
      neckGrad.addColorStop(0, darkenSkin(this.skin, 0.04));
      neckGrad.addColorStop(0.3, this.skin);
      neckGrad.addColorStop(0.5, lightenSkin(this.skin, 0.06));
      neckGrad.addColorStop(0.7, this.skin);
      neckGrad.addColorStop(1, darkenSkin(this.skin, 0.06));
      ctx.fillStyle = neckGrad;
      ctx.fill();
      // No outline — blends with head above and torso below

      ctx.translate(0, -18); 
      this.lastRenderedJoints.head = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      ctx.scale(0.85, 0.85);
      
      let eyeStyleToDraw = pose.eyeStyleOverride || this.eyeStyle;
      let mouthStyleToDraw = pose.mouthStyleOverride || this.mouthStyle;
      let blinkState = this.isBlinking;

      if (pose && pose.animation === 'hurt') {
        blinkState = true;
        mouthStyleToDraw = 'frown';
      } else if (pose && pose.animation === 'die') {
        eyeStyleToDraw = 'dead';
        mouthStyleToDraw = 'frown';
        blinkState = false;
      } else if (pose && pose.animation === 'jump') {
        mouthStyleToDraw = 'open';
      }

      drawHeadShape(ctx, this.headShape, this.skin, dir, currentBuild, this.noseSize, this.noseShape, this.gender);
      if (iso.showFace) {
        drawEyes(ctx, eyeStyleToDraw, this.eyeColor, blinkState, dir, this.eyeDistance, this.gender, iso.faceX);
        drawMouth(ctx, mouthStyleToDraw, dir, this.mouthSize, this.mouthPos, this.gender, iso.faceX);
      }
      drawHair(ctx, this.hairStyle, this.hairColor, dir);
      drawHat(ctx, this.hatStyle, this.hatColor, dir);
      ctx.restore();
    };

    const drawRightArmLayer = () => {
      ctx.save();
      ctx.translate(torsoX_screen, hipY);
      ctx.rotate(torsoAngle); // Follow torso
      ctx.translate(shoulderW * cosTilt, shoulderY - hipY + shoulderW * sinTilt); // Move to shoulder
      
      if (!isFlipped) this.lastRenderedJoints.rightShoulder = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftShoulder = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      const armProj = projectLimbSwing(rArmAngle, armLength, this.direction, currentHeight);
      const computedArmAngle = armProj.angle;
      const computedArmLength = armProj.length;
      
      ctx.rotate(computedArmAngle);
      
      // Draw bare arm first
      drawSleeve(ctx, 'normal', this.skin, computedArmLength, dir, currentBuild);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, computedArmLength, dir, currentBuild);
      
      ctx.save();
      ctx.translate(0, computedArmLength);
      
      if (!isFlipped) this.lastRenderedJoints.rightHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
 
      drawHandShape(ctx, this.skin, false, dir);
      drawWeapon(ctx, this.weaponStyle, this.weaponColor, weaponSwing, dir);
      ctx.restore();
      ctx.restore();
    };

    // Swap left/right drawing functions when flipped to maintain proper layering
    const leftArm = isFlipped ? drawRightArmLayer : drawLeftArmLayer;
    const rightArm = isFlipped ? drawLeftArmLayer : drawRightArmLayer;
    const leftLeg = isFlipped ? drawRightLegLayer : drawLeftLegLayer;
    const rightLeg = isFlipped ? drawLeftLegLayer : drawRightLegLayer;

    // Z-Sorting logic based on direction (0: S, 1: SE, 2: E, 3: NE, 4: N)
    let layers = [];
    switch (dir) {
      case 0:
      case 1:
      case 2:
        layers = [drawCapeLayer, leftArm, leftLeg, drawTorsoLayer, rightLeg, drawHeadLayer, rightArm];
        break;
      case 3:
      case 4:
        layers = [leftArm, rightArm, leftLeg, rightLeg, drawTorsoLayer, drawHeadLayer, drawCapeLayer];
        break;
    }

    // Single pass - parts.js handles outlines internally for crisp vectors
    window.isOutlinePass = false;
    layers.forEach(draw => draw());
    
    ctx.restore();
  }

  getConfig() {
    return {
      build: this.build,
      height: this.height,
      direction: this.direction,
      gender: this.gender,
      bust: this.bust,
      outlineThickness: this.outlineThickness,
      eyeDistance: this.eyeDistance,
      noseSize: this.noseSize,
      noseShape: this.noseShape,
      mouthSize: this.mouthSize,
      mouthPos: this.mouthPos,
      skin: this.skin,
      headShape: this.headShape,
      hairStyle: this.hairStyle,
      hairColor: this.hairColor,
      eyeStyle: this.eyeStyle,
      eyeColor: this.eyeColor,
      mouthStyle: this.mouthStyle,
      shirtStyle: this.shirtStyle,
      shirtColor: this.shirtColor,
      pantsStyle: this.pantsStyle,
      pantsColor: this.pantsColor,
      shoesStyle: this.shoesStyle,
      shoesColor: this.shoesColor,
      hatStyle: this.hatStyle,
      hatColor: this.hatColor,
      capeStyle: this.capeStyle,
      capeColor: this.capeColor,
      weaponStyle: this.weaponStyle,
      weaponColor: this.weaponColor,
      shieldStyle: this.shieldStyle,
      shieldColor: this.shieldColor
    };
  }

  setConfig(config = {}) {
    if (config.build !== undefined) this.build = config.build;
    if (config.height !== undefined) this.height = config.height;
    if (config.direction !== undefined) this.direction = config.direction;
    if (config.gender) this.gender = config.gender;
    if (config.bust !== undefined) this.bust = config.bust;
    if (config.skin) this.skin = config.skin;
    if (config.headShape) this.headShape = config.headShape;
    if (config.hairStyle) this.hairStyle = config.hairStyle;
    if (config.hairColor) this.hairColor = config.hairColor;
    if (config.eyeStyle) this.eyeStyle = config.eyeStyle;
    if (config.eyeColor) this.eyeColor = config.eyeColor;
    if (config.mouthStyle) this.mouthStyle = config.mouthStyle;
    if (config.shirtStyle) this.shirtStyle = config.shirtStyle;
    if (config.shirtColor) this.shirtColor = config.shirtColor;
    if (config.pantsStyle) this.pantsStyle = config.pantsStyle;
    if (config.pantsColor) this.pantsColor = config.pantsColor;
    if (config.shoesStyle) this.shoesStyle = config.shoesStyle;
    if (config.shoesColor) this.shoesColor = config.shoesColor;
    if (config.hatStyle) this.hatStyle = config.hatStyle;
    if (config.hatColor) this.hatColor = config.hatColor;
    if (config.capeStyle) this.capeStyle = config.capeStyle;
    if (config.capeColor) this.capeColor = config.capeColor;
    if (config.weaponStyle) this.weaponStyle = config.weaponStyle;
    if (config.weaponColor) this.weaponColor = config.weaponColor;
    if (config.shieldStyle) this.shieldStyle = config.shieldStyle;
    if (config.shieldColor) this.shieldColor = config.shieldColor;
  }
}
