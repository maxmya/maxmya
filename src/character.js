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
  setOutlineThickness
} from './parts.js';

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

  render(ctx, pose = getAnimationPose('idle'), options = {}) {
    const isFlipped = this.direction >= 5;
    const dir = isFlipped ? 8 - this.direction : this.direction; 
    const sign = isFlipped ? -1 : 1;

    setOutlineThickness(this.outlineThickness);

    ctx.save();
    if (isFlipped) ctx.scale(-1, 1);

    const torsoY = pose.torsoY || 0;
    const torsoX = pose.torsoX || 0;
    const torsoAngle = pose.torsoAngle || 0;
    const headAngle = pose.headAngle || 0;
    const headY = pose.headY || 0;

    // Flip angles if mirrored
    let lArmAngle = pose.leftArmAngle || 0;
    let rArmAngle = pose.rightArmAngle || 0;
    let lLegAngle = pose.leftLegAngle || 0;
    let rLegAngle = pose.rightLegAngle || 0;

    if (isFlipped) {
      lArmAngle = pose.rightArmAngle || 0;
      rArmAngle = pose.leftArmAngle || 0;
      lLegAngle = pose.rightLegAngle || 0;
      rLegAngle = pose.leftLegAngle || 0;
    }

    const capeWave = (pose.capeWave || 0) * sign;
    const weaponSwing = (pose.weaponSwing || 0) * sign;

    // Humanoid Proportions
    const armLength = 24 * this.height;
    const legLength = 26 * this.height;
    const torsoHeight = 48 * this.height;
    
    // Joint Roots (Y goes UP as negative)
    const hipY = -legLength + torsoY;
    const neckY = hipY - torsoHeight;
    const shoulderY = neckY + (8 * this.height);

    // Shoulder & Hip widths change based on direction profile & build
    let hipW = 6 * this.build;
    let shoulderW = 14 * this.build;
    
    if (dir === 2) { // Profile
      hipW = 2;
      shoulderW = 2;
    } else if (dir === 1 || dir === 3) { // 3/4
      hipW = 4 * this.build;
      shoulderW = 10 * this.build;
    }

    if (options.drawShadow !== false) {
      ctx.save();
      ctx.beginPath();
      const breathingScale = 1 - (torsoY / 24);
      ctx.ellipse(0, 0, 24 * breathingScale * this.build, 6 * breathingScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    const drawCapeLayer = () => {
      ctx.save();
      ctx.translate(torsoX, hipY);
      ctx.rotate(torsoAngle * sign);
      ctx.translate(0, neckY - hipY);
      drawCape(ctx, this.capeStyle, this.capeColor, capeWave, dir);
      ctx.restore();
    };

    const drawLeftLegLayer = () => {
      ctx.save();
      ctx.translate(torsoX - hipW, hipY);
      ctx.rotate(lLegAngle);
      
      // Draw bare leg first
      drawPants(ctx, 'trousers', this.skin, legLength, dir, this.build);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, legLength, dir, this.build);
      
      ctx.translate(0, legLength);
      drawShoe(ctx, this.shoesStyle, this.shoesColor, dir);
      ctx.restore();
    };

    const drawLeftArmLayer = () => {
      ctx.save();
      ctx.translate(torsoX, hipY);
      ctx.rotate(torsoAngle * sign); 
      ctx.translate(-shoulderW, shoulderY - hipY); 
      ctx.rotate(lArmAngle);
      
      // Draw bare arm first
      drawSleeve(ctx, 'normal', this.skin, armLength, dir, this.build);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, armLength, dir, this.build);
      
      ctx.save();
      ctx.translate(0, armLength);
      
      if (!isFlipped) this.lastRenderedJoints.leftHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      ctx.beginPath();
      ctx.arc(0, 0.5, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = this.skin;
      ctx.strokeStyle = '#0b0f19';
      ctx.lineWidth = this.outlineThickness || 3.5;
      ctx.fill(); ctx.stroke();
      drawLeftHandItem(ctx, this.shieldStyle, this.shieldColor, dir);
      ctx.restore();
      ctx.restore();
    };

    const drawTorsoLayer = () => {
      ctx.save();
      ctx.translate(torsoX, hipY);
      ctx.rotate(torsoAngle * sign);
      
      this.lastRenderedJoints.hip = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      ctx.translate(0, neckY - hipY); // Move to neck to draw down
      
      this.lastRenderedJoints.neck = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      
      drawShirt(ctx, this.shirtStyle, this.shirtColor, this.height, this.build, dir, this.gender, this.bust);
      ctx.restore();
    };

    const drawRightLegLayer = () => {
      ctx.save();
      ctx.translate(torsoX + hipW, hipY);
      ctx.rotate(rLegAngle);
      
      // Draw bare leg first
      drawPants(ctx, 'trousers', this.skin, legLength, dir, this.build);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, legLength, dir, this.build);
      
      ctx.translate(0, legLength);
      drawShoe(ctx, this.shoesStyle, this.shoesColor, dir);
      ctx.restore();
    };

    const drawHeadLayer = () => {
      ctx.save();
      ctx.translate(torsoX, hipY);
      ctx.rotate(torsoAngle * sign);
      ctx.translate(0, neckY - hipY); 
      
      if (!isFlipped) this.lastRenderedJoints.head = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      ctx.rotate(headAngle * sign);

      if (dir === 0 || dir === 1 || dir === 2) {
        ctx.beginPath();
        ctx.rect(-4 * this.build, 4, 8 * this.build, -14);
        ctx.fillStyle = this.skin;
        ctx.strokeStyle = '#0b0f19';
        ctx.lineWidth = this.outlineThickness || 3.5;
        ctx.fill(); ctx.stroke();
      }

      ctx.translate(0, -26); 
      ctx.scale(0.85, 0.85);
      
      drawHeadShape(ctx, this.headShape, this.skin, dir, this.build, this.noseSize, this.noseShape);
      if (dir !== 4) drawEyes(ctx, this.eyeStyle, this.eyeColor, this.isBlinking, dir, this.eyeDistance);
      if (dir !== 4 && dir !== 3) drawMouth(ctx, this.mouthStyle, dir, this.mouthSize, this.mouthPos);
      drawHair(ctx, this.hairStyle, this.hairColor, dir);
      drawHat(ctx, this.hatStyle, this.hatColor, dir);
      ctx.restore();
    };

    const drawRightArmLayer = () => {
      ctx.save();
      ctx.translate(torsoX, hipY);
      ctx.rotate(torsoAngle * sign); // Follow torso
      ctx.translate(shoulderW, shoulderY - hipY); // Move to shoulder
      ctx.rotate(rArmAngle);
      
      // Draw bare arm first
      drawSleeve(ctx, 'normal', this.skin, armLength, dir, this.build);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, armLength, dir, this.build);
      
      ctx.save();
      ctx.translate(0, armLength);
      
      if (!isFlipped) this.lastRenderedJoints.rightHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      ctx.beginPath();
      ctx.arc(0, 0.5, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = this.skin;
      ctx.strokeStyle = '#0b0f19';
      ctx.lineWidth = this.outlineThickness || 3.5;
      ctx.fill(); ctx.stroke();
      drawWeapon(ctx, this.weaponStyle, this.weaponColor, weaponSwing, dir);
      ctx.restore();
      ctx.restore();
    };

    // Z-Sorting logic based on direction (0: S, 1: SE, 2: E, 3: NE, 4: N)
    let layers = [];
    switch (dir) {
      case 0:
      case 1:
        layers = [drawCapeLayer, drawLeftArmLayer, drawLeftLegLayer, drawTorsoLayer, drawRightLegLayer, drawHeadLayer, drawRightArmLayer];
        break;
      case 2:
        layers = [drawCapeLayer, drawLeftArmLayer, drawLeftLegLayer, drawTorsoLayer, drawRightLegLayer, drawHeadLayer, drawRightArmLayer];
        break;
      case 3:
      case 4:
        layers = [drawTorsoLayer, drawLeftLegLayer, drawRightLegLayer, drawLeftArmLayer, drawRightArmLayer, drawHeadLayer, drawCapeLayer];
        break;
    }

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
