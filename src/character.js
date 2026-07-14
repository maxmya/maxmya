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
  drawJointBlend,
  getLimbWidth,
  getBowArrowGeometry,
  setOutlineThickness
} from './parts.js?v=10';
import { LIMB_PROPORTIONS, getLimbSegments, solveTwoBoneIK } from './skeleton.js?v=1';

// Knee bend direction for the leg IK solver. +1/-1 controls which way the knee folds;
// flip this if the skeleton overlay shows knees bending backwards.
const LEG_BEND_DIR = 1;

// Elbow bend direction for the archer off-hand IK solver (see leftHandOverrideTarget
// in render()). -1 drops the elbow below the string line, the way a drawing arm actually
// folds; +1 cocks it up over the arrow.
const LEFT_ARM_BEND_DIR = -1;

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

/**
 * Screen-space forward vector for limb stride projection per world direction, in the
 * LOCAL (pre-flip) frame. Directions 5-7 (NW/W/SW) intentionally return the same vector
 * as their mirror-source directions 3/1/2 rather than a separately negated one — the
 * horizontal mirroring itself is applied once, at render time, via ctx.scale(-1, 1).
 * Baking an extra sign flip in here would double-cancel it (this used to happen and
 * broke direction-dependent horizontal offsets like the attack lunge, though it went
 * unnoticed in symmetric cyclic animations like walk/run/idle).
 */
function getFacingVector(direction) {
  const isFlipped = direction >= 5;
  const dir = isFlipped ? 8 - direction : direction;
  switch (dir) {
    case 0: return { fx: 0, fy: 1.0 };       // South — step toward camera
    case 1: return { fx: 0.707, fy: 0.707 }; // SE / (NW mirrored)
    case 2: return { fx: 1.0, fy: 0 };       // East — profile stride / (West mirrored)
    case 3: return { fx: 0.707, fy: -0.707 }; // NE / (SW mirrored)
    case 4: return { fx: 0, fy: -1.0 };      // North — step away
    default: return { fx: 0, fy: 1.0 };
  }
}

/** Stride-projected end-effector target, in the limb root's local unrotated frame. */
function getStrideTarget(swingAngle, limbLength, direction, height) {
  const facing = getFacingVector(direction);
  const stride = swingAngle * 9 * height;
  return {
    x: stride * facing.fx,
    y: limbLength + stride * facing.fy
  };
}

function projectLimbSwing(swingAngle, limbLength, direction, height) {
  const t = getStrideTarget(swingAngle, limbLength, direction, height);
  return {
    angle: Math.atan2(t.x, t.y),
    length: Math.hypot(t.x, t.y)
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

    // Exact pixel coordinates of non-joint attachment points from the last render pass —
    // things a game engine hangs its own sprites on rather than reading out of the sheet.
    // Currently just `arrow` (present only while a bow is drawn). Same canvas space as
    // lastRenderedJoints; exporter.js rebases both into frame-local coords.
    this.lastRenderedAttachments = {};
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
    this.lastRenderedAttachments = {};

    // options.drawArrow === false omits the arrow's pixels but still records its attachment
    // point, so a game can render its own arrow sprite (flaming, poison, none) at runtime.
    const drawArrow = options.drawArrow !== false;
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

    // Archer-style off-hand coupling: when the pose specifies a draw amount, the left
    // (string) hand IK-targets a point that interpolates between "at the bow" (the
    // right/weapon hand's own resolved position) and "pulled back to the chest anchor",
    // instead of using a hand-authored angle. This keeps the string hand geometrically
    // anchored to the weapon hand regardless of how the weapon arm itself is posed.
    //
    // Sign convention: a limb rotated by angle `a` renders its tip at SCREEN offset
    // (-len * sin a, len * cos a), so a solveTwoBoneIK target (tx, ty) resolves to the
    // screen point (-tx, ty) — the solver's X axis runs opposite to the screen's. The
    // target below is built in screen space and negated in X on the way in; feeding it
    // raw is what mirrored the string hand onto the wrong side of the body.
    const { upper: sharedUpperArmLen, lower: sharedForearmLen } = getLimbSegments(armLength, LIMB_PROPORTIONS.upperArmRatio, LIMB_PROPORTIONS.forearmRatio);

    // pose.rightArmScreenAngle is already a screen-space shoulder rotation and is used as-is;
    // pose.rightArmAngle is a stride-like swing and goes through the facing projection, which
    // zeroes its horizontal component for South/North. See the note in animations.js.
    const rightShoulderAngle = pose.rightArmScreenAngle !== undefined
      ? pose.rightArmScreenAngle
      : projectLimbSwing(rArmAngle, armLength, this.direction, currentHeight).angle;

    const rightElbowAngle = pose.rightElbowAngle || 0;

    // The weapon is drawn in the hand's frame, so it inherits the whole arm's rotation, on
    // top of the fixed -45° blade tilt drawWeapon bakes in. That tilt is right for a blade
    // but makes an aimed bow flop over as the arm rises, so for a bow draw specifically we
    // cancel both out: the bow then stays upright and pose.weaponSwing reads as a tilt
    // relative to upright (0 = vertical bow, string toward the body, limbs up/down). A blade
    // keeps its inherited rotation — that IS the swing.
    const isBowDraw = pose.drawAmount !== undefined && this.weaponStyle === 'bow';
    const weaponSwing_arm = isBowDraw
      ? weaponSwing - (rightShoulderAngle + rightElbowAngle) + Math.PI / 4
      : weaponSwing;

    let leftHandOverrideTarget = null;
    let bowNock = null;
    if (pose.drawAmount !== undefined) {
      const totalRightAngle = rightShoulderAngle + rightElbowAngle;

      // Weapon hand, as a screen offset from the right shoulder.
      const rightHandX = -sharedUpperArmLen * Math.sin(rightShoulderAngle) - sharedForearmLen * Math.sin(totalRightAngle);
      const rightHandY = sharedUpperArmLen * Math.cos(rightShoulderAngle) + sharedForearmLen * Math.cos(totalRightAngle);

      // Same point, re-expressed as a screen offset from the LEFT shoulder: the shoulders
      // are symmetric ±shoulderW offsets from the torso centerline along the tilt axis,
      // so the right one sits 2*shoulderW away from the left one.
      const nockX = rightHandX + 2 * shoulderW * cosTilt;
      const nockY = rightHandY + 2 * shoulderW * sinTilt;

      // Full draw: string hand pulled back to the chest anchor — just inboard of the torso
      // centerline at collarbone height, which is the deepest a 16px arm can pull and still
      // clear the body silhouette. (A real archer anchors at the jaw, but the head on this
      // chibi is wide enough that the hand would vanish behind it.) Shoulders are wider
      // apart (2*shoulderW) than an arm is long, so the nock end of this lerp is out of
      // reach and the solver clamps it to a fully extended arm pointing at the bow — that
      // is the intended "reaching for the string" read at drawAmount 0.
      const anchorX = shoulderW * cosTilt * 0.85;
      const anchorY = shoulderW * sinTilt + armLength * 0.12;

      const drawAmt = Math.max(0, pose.drawAmount);
      leftHandOverrideTarget = {
        x: -(nockX + (anchorX - nockX) * drawAmt),
        y: nockY + (anchorY - nockY) * drawAmt
      };

      // Where the string hand ACTUALLY lands (the solver clamps the target to arm reach),
      // so the bowstring can be drawn bent onto it. Resolve the same IK the left arm layer
      // will run, then re-express the result in the bow's own frame: the bow ends up
      // rotated by exactly (arm rotation + weapon swing) relative to screen, and the
      // counter-rotation above collapses that to plain `weaponSwing`.
      const ik = solveTwoBoneIK(leftHandOverrideTarget.x, leftHandOverrideTarget.y, sharedUpperArmLen, sharedForearmLen, LEFT_ARM_BEND_DIR);
      const ikTotal = ik.angle1 + ik.angle2;
      const stringHandX = -sharedUpperArmLen * Math.sin(ik.angle1) - sharedForearmLen * Math.sin(ikTotal);
      const stringHandY = sharedUpperArmLen * Math.cos(ik.angle1) + sharedForearmLen * Math.cos(ikTotal);

      // Screen delta from the weapon hand (bow grip) to the string hand.
      const dx = (stringHandX - 2 * shoulderW * cosTilt) - rightHandX;
      const dy = (stringHandY - 2 * shoulderW * sinTilt) - rightHandY;

      const bowTilt = weaponSwing; // total on-screen rotation of the bow, post-counter-rotation
      const pulledX = dx * Math.cos(bowTilt) + dy * Math.sin(bowTilt);
      const pulledY = -dx * Math.sin(bowTilt) + dy * Math.cos(bowTilt);

      // Blend the string back onto its resting line as the draw slackens. At drawAmount 0
      // the string hand is reaching for a nock it cannot physically touch (see above), so
      // taking its position literally would hang the string off the hand and cock the arrow
      // at the floor; the string should just be at rest instead.
      const pull = Math.min(1, drawAmt);
      const REST_STRING_X = -2;
      bowNock = {
        x: REST_STRING_X + (pulledX - REST_STRING_X) * pull,
        y: pulledY * pull
      };
    }

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

      const footTarget = getStrideTarget(lLegAngle, legLength, this.direction, currentHeight);
      const { upper: thighLen, lower: shinLen } = getLimbSegments(legLength, LIMB_PROPORTIONS.thighRatio, LIMB_PROPORTIONS.shinRatio);
      const { angle1: hipAngle, angle2: kneeAngle } = solveTwoBoneIK(footTarget.x, footTarget.y, thighLen, shinLen, LEG_BEND_DIR);

      ctx.rotate(hipAngle);

      // Draw bare thigh first
      drawPants(ctx, 'trousers', this.skin, thighLen, dir, currentBuild);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, thighLen, dir, currentBuild);

      ctx.translate(0, thighLen);

      if (!isFlipped) this.lastRenderedJoints.leftKnee = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightKnee = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      drawJointBlend(ctx, getLimbWidth('leg', dir, currentBuild), this.pantsStyle !== 'none' ? this.pantsColor : this.skin);

      ctx.rotate(kneeAngle);

      // Draw bare shin first
      drawPants(ctx, 'trousers', this.skin, shinLen, dir, currentBuild, 0.85);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, shinLen, dir, currentBuild, 0.85);

      ctx.translate(0, shinLen);

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

      const { upper: upperArmLen, lower: forearmLen } = getLimbSegments(armLength, LIMB_PROPORTIONS.upperArmRatio, LIMB_PROPORTIONS.forearmRatio);
      let shoulderAngle, elbowAngle;
      if (leftHandOverrideTarget) {
        const ik = solveTwoBoneIK(leftHandOverrideTarget.x, leftHandOverrideTarget.y, upperArmLen, forearmLen, LEFT_ARM_BEND_DIR);
        shoulderAngle = ik.angle1;
        elbowAngle = ik.angle2;
      } else {
        shoulderAngle = projectLimbSwing(lArmAngle, armLength, this.direction, currentHeight).angle;
        elbowAngle = pose.leftElbowAngle || 0;
      }

      ctx.rotate(shoulderAngle);

      // Draw bare upper arm first
      drawSleeve(ctx, 'normal', this.skin, upperArmLen, dir, currentBuild);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, upperArmLen, dir, currentBuild);

      ctx.translate(0, upperArmLen);

      if (!isFlipped) this.lastRenderedJoints.leftElbow = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.rightElbow = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      drawJointBlend(ctx, getLimbWidth('arm', dir, currentBuild), this.shirtStyle !== 'none' ? this.shirtColor : this.skin);

      ctx.rotate(elbowAngle);

      // Draw bare forearm first
      drawSleeve(ctx, 'normal', this.skin, forearmLen, dir, currentBuild, 0.85);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, forearmLen, dir, currentBuild, 0.85);

      ctx.save();
      ctx.translate(0, forearmLen);

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

      const footTarget = getStrideTarget(rLegAngle, legLength, this.direction, currentHeight);
      const { upper: thighLen, lower: shinLen } = getLimbSegments(legLength, LIMB_PROPORTIONS.thighRatio, LIMB_PROPORTIONS.shinRatio);
      const { angle1: hipAngle, angle2: kneeAngle } = solveTwoBoneIK(footTarget.x, footTarget.y, thighLen, shinLen, LEG_BEND_DIR);

      ctx.rotate(hipAngle);

      // Draw bare thigh first
      drawPants(ctx, 'trousers', this.skin, thighLen, dir, currentBuild);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, thighLen, dir, currentBuild);

      ctx.translate(0, thighLen);

      if (!isFlipped) this.lastRenderedJoints.rightKnee = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftKnee = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      drawJointBlend(ctx, getLimbWidth('leg', dir, currentBuild), this.pantsStyle !== 'none' ? this.pantsColor : this.skin);

      ctx.rotate(kneeAngle);

      // Draw bare shin first
      drawPants(ctx, 'trousers', this.skin, shinLen, dir, currentBuild, 0.85);
      // Draw clothing
      if (this.pantsStyle !== 'none') drawPants(ctx, this.pantsStyle, this.pantsColor, shinLen, dir, currentBuild, 0.85);

      ctx.translate(0, shinLen);

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

      const { upper: upperArmLen, lower: forearmLen } = getLimbSegments(armLength, LIMB_PROPORTIONS.upperArmRatio, LIMB_PROPORTIONS.forearmRatio);
      const shoulderAngle = rightShoulderAngle;
      const elbowAngle = rightElbowAngle;

      ctx.rotate(shoulderAngle);

      // Draw bare upper arm first
      drawSleeve(ctx, 'normal', this.skin, upperArmLen, dir, currentBuild);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, upperArmLen, dir, currentBuild);

      ctx.translate(0, upperArmLen);

      if (!isFlipped) this.lastRenderedJoints.rightElbow = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftElbow = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      drawJointBlend(ctx, getLimbWidth('arm', dir, currentBuild), this.shirtStyle !== 'none' ? this.shirtColor : this.skin);

      ctx.rotate(elbowAngle);

      // Draw bare forearm first
      drawSleeve(ctx, 'normal', this.skin, forearmLen, dir, currentBuild, 0.85);
      // Draw sleeve
      if (this.shirtStyle !== 'none') drawSleeve(ctx, this.shirtStyle, this.shirtColor, forearmLen, dir, currentBuild, 0.85);

      ctx.save();
      ctx.translate(0, forearmLen);

      if (!isFlipped) this.lastRenderedJoints.rightHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };
      else this.lastRenderedJoints.leftHand = { x: ctx.getTransform().e, y: ctx.getTransform().f };

      drawHandShape(ctx, this.skin, false, dir);
      // Record the arrow as a canvas-space attachment BEFORE (and regardless of) drawing it,
      // so an export that omits the arrow pixels still tells the game where to put its own.
      // The bow's frame is this hand's frame turned by the same angle drawWeapon applies
      // internally, so re-derive that matrix here and project the arrow's endpoints through it.
      if (bowNock && this.weaponStyle === 'bow') {
        const geo = getBowArrowGeometry(bowNock);
        const bowMatrix = ctx.getTransform().rotate((-Math.PI / 4 + weaponSwing_arm) * 180 / Math.PI);
        const nockPt = bowMatrix.transformPoint(new DOMPoint(geo.nock.x, geo.nock.y));
        const tipPt = bowMatrix.transformPoint(new DOMPoint(geo.tip.x, geo.tip.y));
        this.lastRenderedAttachments.arrow = {
          nock: { x: nockPt.x, y: nockPt.y },
          tip: { x: tipPt.x, y: tipPt.y },
          // Canvas convention: y grows downward, so this angle is clockwise-positive.
          angle: Math.atan2(tipPt.y - nockPt.y, tipPt.x - nockPt.x),
          drawAmount: pose.drawAmount
        };
      }

      drawWeapon(ctx, this.weaponStyle, this.weaponColor, weaponSwing_arm, dir, bowNock, drawArrow);
      ctx.restore();
      ctx.restore();
    };

    // Swap left/right drawing functions when flipped to maintain proper layering
    const leftArm = isFlipped ? drawRightArmLayer : drawLeftArmLayer;
    const rightArm = isFlipped ? drawLeftArmLayer : drawRightArmLayer;
    const leftLeg = isFlipped ? drawRightLegLayer : drawLeftLegLayer;
    const rightLeg = isFlipped ? drawLeftLegLayer : drawRightLegLayer;

    // Z-Sorting logic based on direction (0: S, 1: SE, 2: E, 3: NE, 4: N)
    // During an archer draw the string arm reaches across the FRONT of the chest, so for
    // the camera-facing directions it has to hop over the torso in the layer order or the
    // hand disappears into the body. In the away-facing ones (3/4) the left arm is already
    // behind the torso, which is what we want there.
    const isArcherDraw = pose.drawAmount !== undefined;
    let layers = [];
    switch (dir) {
      case 0:
      case 1:
      case 2:
        layers = isArcherDraw
          ? [drawCapeLayer, leftLeg, drawTorsoLayer, rightLeg, leftArm, drawHeadLayer, rightArm]
          : [drawCapeLayer, leftArm, leftLeg, drawTorsoLayer, rightLeg, drawHeadLayer, rightArm];
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
