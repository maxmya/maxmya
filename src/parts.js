/**
 * ChromaForge 2D - High-Quality Vector Parts Library
 * Smooth blended body with gradients, no outlines on body parts.
 */

let currentOutlineThickness = 3.0;

export function setOutlineThickness(thickness) {
  currentOutlineThickness = thickness;
}

/* ─── Utility helpers ─── */

function darken(hex, amount = 0.2) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (num & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

function lighten(hex, amount = 0.25) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount) | 0;
  const g = Math.min(255, ((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount) | 0;
  const b = Math.min(255, (num & 0xff) + (255 - (num & 0xff)) * amount) | 0;
  return `rgb(${r},${g},${b})`;
}

/* ─── Capsule limb (arms / legs) — NO outline, gradient only ─── */

function drawCapsuleLimb(ctx, length, width, color) {
  if (window.isOutlinePass) return;

  ctx.beginPath();
  ctx.arc(0, 0, width, Math.PI, 0);
  ctx.lineTo(width, length);
  ctx.arc(0, length, width, 0, Math.PI);
  ctx.lineTo(-width, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-width, 0, width, 0);
  grad.addColorStop(0, lighten(color, 0.18));
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle highlight stripe for 3D depth
  ctx.beginPath();
  ctx.arc(-width * 0.12, 0, width * 0.4, Math.PI, 0);
  ctx.lineTo(-width * 0.12 + width * 0.4, length);
  ctx.arc(-width * 0.12, length, width * 0.4, 0, Math.PI);
  ctx.lineTo(-width * 0.12 - width * 0.4, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,0.07)`;
  ctx.fill();

  // No outline — body parts blend together
}

/* ─── Head Shapes — NO outline on head itself ─── */

export function drawHeadShape(ctx, type, skinColor, dir = 0, build = 1.0, noseSize = 1.0, noseShape = 'normal', gender = 'male') {
  if (window.isOutlinePass) return;

  const w = 22 * build;
  const h = 20;

  ctx.beginPath();
  const cornerR = type === 'anime' ? [4, 4, 14, 14] : (type === 'diamond' ? [8, 8, 16, 16] : 14);
  ctx.roundRect(-w, -h, w * 2, h * 2, cornerR);

  const headGrad = ctx.createLinearGradient(0, -h, 0, h);
  headGrad.addColorStop(0, lighten(skinColor, 0.1));
  headGrad.addColorStop(0.5, skinColor);
  headGrad.addColorStop(1, darken(skinColor, 0.08));
  ctx.fillStyle = headGrad;
  ctx.fill();

  // Subtle cheek blush
  if (dir !== 4 && dir !== 3) {
    ctx.beginPath();
    ctx.ellipse(-10, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 130, 130, 0.12)`;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 130, 130, 0.12)`;
    ctx.fill();
  }

  // NO head outline — blends with neck

  // Ears (no outline, just gradient filled)
  if (dir === 0 || dir === 1 || dir === 7 || dir === 4) {
    ctx.beginPath();
    ctx.arc(-w, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-w, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(skinColor, 0.08);
    ctx.fill();
  }
  if (dir === 0 || dir === 3 || dir === 1 || dir === 2 || dir === 4) {
    ctx.beginPath();
    ctx.arc(w, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(skinColor, 0.08);
    ctx.fill();
  }

  // Nose
  if (noseShape !== 'none' && dir !== 4 && dir !== 3) {
    let faceShiftX = dir === 0 ? 2 : (dir === 2 ? w - 6 : 2);
    const nSize = 1.5 + noseSize * 0.5;

    if (noseShape === 'pointy') {
      ctx.beginPath();
      ctx.moveTo(faceShiftX, 0);
      ctx.lineTo(faceShiftX - nSize, 4);
      ctx.lineTo(faceShiftX + nSize, 4);
      ctx.closePath();
      ctx.fillStyle = darken(skinColor, 0.12);
      ctx.fill();
    } else if (noseShape === 'wide') {
      ctx.beginPath();
      ctx.ellipse(faceShiftX, 3, nSize * 1.5, nSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = darken(skinColor, 0.1);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(faceShiftX, 3, nSize, 0, Math.PI * 2);
      ctx.fillStyle = darken(skinColor, 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(faceShiftX - 0.5, 2, nSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.15)`;
      ctx.fill();
    }
  }
}

/* ─── Eyes ─── */

export function drawEyes(ctx, style, color, isBlinking = false, dir = 0, eyeDistance = 1.0, gender = 'male') {
  if (window.isOutlinePass) return;

  let faceShiftX = dir === 0 ? 3 : (dir === 2 ? 8 : 4);
  let distOffset = (eyeDistance - 1.0) * 8;

  if (isBlinking) {
    ctx.beginPath();
    if (dir !== 2) {
      ctx.arc(-8 + faceShiftX - distOffset, 2, 4, Math.PI, 0, false);
    }
    ctx.arc(8 + faceShiftX + distOffset, 2, 4, Math.PI, 0, false);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    return;
  }

  const drawEyeSingle = (xCoord, sideSign) => {
    ctx.save();
    let shiftX = sideSign < 0 ? -distOffset : distOffset;
    if (dir === 2) shiftX = 0;
    ctx.translate(xCoord + faceShiftX + shiftX, 1);

    if (style === 'angry') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0.3, 0.5, 2.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.5, 0, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.5, -1.2, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, sideSign < 0 ? -7 : -3);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (style === 'cute' || style === 'glowing') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      const irisGrad = ctx.createRadialGradient(0.5, 0.5, 0.5, 0, 0, 4.5);
      irisGrad.addColorStop(0, lighten(color, 0.3));
      irisGrad.addColorStop(0.7, color);
      irisGrad.addColorStop(1, darken(color, 0.3));
      ctx.beginPath();
      ctx.ellipse(0.5, 0.5, 3.8, 4.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = irisGrad;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0.5, 0.8, 1.8, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-1.2, -1.8, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1.5, 1.5, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      if (style === 'glowing') {
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 7.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else if (style === 'dead') {
      ctx.beginPath();
      ctx.moveTo(-3.5, -3.5); ctx.lineTo(3.5, 3.5);
      ctx.moveTo(3.5, -3.5); ctx.lineTo(-3.5, 3.5);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else if (style === 'tired') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.3, 0.5, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.5, 0.3, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.3, -0.8, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 5, 4, 1.5, 0, 0, Math.PI);
      ctx.strokeStyle = darken('#ffdbac', 0.12);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (style === 'cat-eyes') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0.2, 0.3, 2, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0.2, 0.3, 0.6, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.8, -1.5, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      // Normal
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.3, 0.5, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.5, 0.3, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-0.3, -0.8, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Thin eye outline (facial feature, not body outline)
    if (style !== 'dead') {
      ctx.beginPath();
      ctx.ellipse(0, 0, style === 'cute' || style === 'glowing' ? 5 : 3.5, style === 'cute' || style === 'glowing' ? 6.5 : 4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (gender === 'female' && style !== 'dead') {
      ctx.beginPath();
      ctx.moveTo(sideSign * 3.5, -3);
      ctx.quadraticCurveTo(sideSign * 5.5, -6, sideSign * 7, -5);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.restore();
  };

  if (dir === 0 || dir === 1) drawEyeSingle(-8, -1);
  drawEyeSingle(8, 1);
}

/* ─── Mouth ─── */

export function drawMouth(ctx, style, dir = 0, mouthSize = 1.0, mouthPos = 0, gender = 'male') {
  if (window.isOutlinePass) return;

  let mx = dir === 2 ? 10 : (dir === 0 ? 3 : 5);
  ctx.save();
  ctx.translate(mx, mouthPos + 8);
  ctx.scale(mouthSize, mouthSize);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (style === 'smile') {
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0.3, Math.PI - 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (style === 'neutral') {
    ctx.beginPath();
    ctx.moveTo(-3.5, 1.5);
    ctx.quadraticCurveTo(0, 3, 3.5, 1.5);
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (style === 'frown') {
    ctx.beginPath();
    ctx.arc(0, 6, 4, Math.PI + 0.3, Math.PI * 2 - 0.3);
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  } else if (style === 'open') {
    ctx.beginPath();
    ctx.ellipse(0, 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0f0a';
    ctx.fill();
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 5, 2.5, 1.5, 0, 0, Math.PI);
    ctx.fillStyle = '#d4626a';
    ctx.fill();
  } else if (style === 'blush') {
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-11, -4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 100, 100, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11, -4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 100, 100, 0.35)';
    ctx.fill();
  } else if (style === 'smirk') {
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(1, 2, 4, -1.5);
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  } else if (style === 'surprised') {
    ctx.beginPath();
    ctx.ellipse(0, 3, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0f0a';
    ctx.fill();
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (style === 'teeth') {
    ctx.beginPath();
    ctx.roundRect(-4.5, -0.5, 9, 5, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, -0.5);
    ctx.lineTo(-2, 4.5);
    ctx.moveTo(0, -0.5);
    ctx.lineTo(0, 4.5);
    ctx.moveTo(2, -0.5);
    ctx.lineTo(2, 4.5);
    ctx.strokeStyle = '#d4c8b8';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

/* ─── Hair ─── */

export function drawHair(ctx, style, color, dir = 0) {
  if (style === 'bald' || window.isOutlinePass) return;

  const darkC = darken(color, 0.15);
  const lightC = lighten(color, 0.12);

  if (dir === 3 || dir === 4) {
    ctx.beginPath();
    ctx.arc(0, -8, 22, 0, Math.PI * 2);
    if (style === 'long' || style === 'bob') {
      ctx.roundRect(-24, -10, 48, 30, 8);
    }
    const g = ctx.createLinearGradient(0, -30, 0, 20);
    g.addColorStop(0, lightC);
    g.addColorStop(0.5, color);
    g.addColorStop(1, darkC);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, -14, 22, Math.PI, 0);
    if (style === 'long' || style === 'bob') {
      ctx.roundRect(-24, -10, 10, 25, 4);
      ctx.roundRect(14, -10, 10, 25, 4);
    }
    const g = ctx.createLinearGradient(0, -36, 0, 0);
    g.addColorStop(0, lightC);
    g.addColorStop(0.5, color);
    g.addColorStop(1, darkC);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  if (style === 'spiky') {
    ctx.beginPath();
    ctx.moveTo(-20, -8); ctx.lineTo(-12, -36); ctx.lineTo(-2, -18);
    ctx.moveTo(-6, -18); ctx.lineTo(6, -42); ctx.lineTo(12, -16);
    ctx.moveTo(8, -16); ctx.lineTo(22, -30); ctx.lineTo(20, -4);
    if (dir !== 3 && dir !== 4) {
      ctx.moveTo(-16, -12); ctx.lineTo(-6, -3); ctx.lineTo(4, -13);
      ctx.moveTo(-2, -14); ctx.lineTo(8, -4); ctx.lineTo(16, -13);
    }
    const g = ctx.createLinearGradient(0, -42, 0, 0);
    g.addColorStop(0, lightC);
    g.addColorStop(0.4, color);
    g.addColorStop(1, darkC);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else if (style === 'curly') {
    const curls = [
      [-15, -20, 12], [0, -25, 14], [15, -20, 12],
      [-22, -5, 10], [22, -5, 10], [-8, -28, 9], [8, -28, 9]
    ];
    for (const [cx, cy, r] of curls) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const cg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      cg.addColorStop(0, lightC);
      cg.addColorStop(0.6, color);
      cg.addColorStop(1, darkC);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = darkC;
      ctx.lineWidth = currentOutlineThickness * 0.7;
      ctx.stroke();
    }
  } else if (style === 'ponytail') {
    ctx.beginPath();
    ctx.arc(0, -22, 12, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(-2, -24, 2, 0, -22, 12);
    bg.addColorStop(0, lightC);
    bg.addColorStop(1, darkC);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    if (dir !== 4 && dir !== 3) {
      ctx.beginPath();
      ctx.roundRect(-5, -20, 10, 4, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (dir === 2 || dir === 3 || dir === 4) {
      const px = dir === 2 ? -24 : 0;
      ctx.beginPath();
      ctx.roundRect(px - 10, -20, 20, 35, 10);
      const tg = ctx.createLinearGradient(px - 10, -20, px + 10, 15);
      tg.addColorStop(0, lightC);
      tg.addColorStop(0.5, color);
      tg.addColorStop(1, darkC);
      ctx.fillStyle = tg;
      ctx.fill();
      ctx.strokeStyle = darkC;
      ctx.lineWidth = currentOutlineThickness;
      ctx.stroke();
    }
  } else if (style === 'mohawk') {
    ctx.beginPath();
    if (dir === 2) {
      ctx.roundRect(0, -36, 14, 22, [6, 6, 2, 2]);
    } else {
      ctx.roundRect(-7, -36, 14, 22, [6, 6, 2, 2]);
    }
    const mg = ctx.createLinearGradient(0, -36, 0, -14);
    mg.addColorStop(0, lighten(color, 0.2));
    mg.addColorStop(1, color);
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

/* ─── Clothing: Shirts & Torso — NO outline ─── */

export function drawShirt(ctx, style, color, height = 1.0, build = 1.0, dir = 0, gender = 'male', bust = 0.0) {
  if (window.isOutlinePass) return;

  const h = 28 * height;
  let w = 14 * build;
  let bottomW = 14 * build;
  if (dir === 2) { w = 9 * build; bottomW = 9 * build; }

  if (style !== 'none') {
    ctx.beginPath();
    ctx.roundRect(-w, 0, w * 2, h, 8);

    const tGrad = ctx.createLinearGradient(-w, 0, w, 0);
    tGrad.addColorStop(0, lighten(color, 0.15));
    tGrad.addColorStop(0.35, color);
    tGrad.addColorStop(0.75, darken(color, 0.08));
    tGrad.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = tGrad;
    ctx.fill();

    // NO outline on torso — blends with limbs

    // Clothing-specific details
    if (style === 'armor' || style === 'plate-mail') {
      ctx.beginPath();
      ctx.roundRect(-w * 0.75, h * 0.15, w * 1.5, h * 0.55, 4);
      const armGrad = ctx.createLinearGradient(-w, 0, w, 0);
      armGrad.addColorStop(0, lighten(color, 0.25));
      armGrad.addColorStop(0.5, lighten(color, 0.05));
      armGrad.addColorStop(1, darken(color, 0.15));
      ctx.fillStyle = armGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, h * 0.15);
      ctx.lineTo(0, h * 0.7);
      ctx.strokeStyle = darken(color, 0.2);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (style === 'plate-mail') {
        ctx.beginPath();
        ctx.roundRect(-w * 0.6, h * 0.72, w * 1.2, h * 0.2, 3);
        ctx.fillStyle = darken(color, 0.1);
        ctx.fill();
      }
    } else if (style === 'leather-armor') {
      ctx.beginPath();
      ctx.roundRect(-bottomW - 1, h - 8, (bottomW * 2) + 2, 6, 2);
      ctx.fillStyle = '#5c3a1e';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-3, h - 9, 6, 8, 1);
      ctx.fillStyle = '#d4a853';
      ctx.fill();
    } else if (style === 'ninja') {
      ctx.beginPath();
      ctx.roundRect(-bottomW - 1, h - 10, (bottomW * 2) + 2, 8, 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
    } else if (style === 'tunic') {
      ctx.beginPath();
      ctx.roundRect(-bottomW - 1, h - 12, (bottomW * 2) + 2, 8, 2);
      ctx.fillStyle = darken(color, 0.3);
      ctx.fill();
      if (dir === 0 || dir === 1) {
        ctx.beginPath();
        ctx.roundRect(-4, h - 14, 8, 12, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (style === 'cleric-robes') {
      ctx.beginPath();
      ctx.roundRect(-2, h * 0.2, 4, h * 0.4, 1);
      ctx.fillStyle = lighten(color, 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-6, h * 0.3, 12, 4, 1);
      ctx.fillStyle = lighten(color, 0.1);
      ctx.fill();
    } else if (style === 'robe') {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.1);
      ctx.lineTo(0, h);
      ctx.strokeStyle = darken(color, 0.15);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (style === 'casual-shirt') {
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, 0);
      ctx.lineTo(-w * 0.1, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(w * 0.1, 6);
      ctx.lineTo(w * 0.4, 0);
      ctx.strokeStyle = darken(color, 0.2);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Fabric fold highlights
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, h * 0.1);
    ctx.quadraticCurveTo(-w * 0.3, h * 0.35, -w * 0.5, h * 0.6);
    ctx.strokeStyle = `rgba(255,255,255,0.06)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Bare chest — NO outline
    ctx.beginPath();
    ctx.roundRect(-w, 0, w * 2, h, 8);
    const skinGrad = ctx.createLinearGradient(-w, 0, w, 0);
    skinGrad.addColorStop(0, lighten(color, 0.06));
    skinGrad.addColorStop(0.5, color);
    skinGrad.addColorStop(1, darken(color, 0.08));
    ctx.fillStyle = skinGrad;
    ctx.fill();

    if (gender === 'female') {
      ctx.beginPath();
      ctx.roundRect(-w, h * 0.2, w * 2, h * 0.25, 2);
      ctx.fillStyle = '#1f2937';
      ctx.fill();
    }
  }

  // Bust (female) — no outline
  if (gender === 'female' && bust > 0 && dir !== 4 && dir !== 3 && style !== 'armor') {
    const bSize = 6 + (bust * 4);
    const yOff = 16;
    const c = style === 'none' ? '#1f2937' : color;
    if (dir === 2) {
      ctx.beginPath();
      ctx.arc(w, yOff, bSize, 0, Math.PI * 2);
      const bg = ctx.createRadialGradient(w - 2, yOff - 2, 1, w, yOff, bSize);
      bg.addColorStop(0, lighten(c, 0.15));
      bg.addColorStop(1, darken(c, 0.1));
      ctx.fillStyle = bg;
      ctx.fill();
    } else {
      const shift = dir === 1 ? 4 : 0;
      for (const sx of [-w * 0.4 + shift, w * 0.4 + shift]) {
        ctx.beginPath();
        ctx.arc(sx, yOff, bSize, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(sx - 2, yOff - 2, 1, sx, yOff, bSize);
        bg.addColorStop(0, lighten(c, 0.15));
        bg.addColorStop(1, darken(c, 0.1));
        ctx.fillStyle = bg;
        ctx.fill();
      }
    }
  }
}

export function drawSleeve(ctx, style, color, length = 24, dir = 0, build = 1.0) {
  if (style === 'none' || window.isOutlinePass) return;
  const w = 5.5 * build;
  drawCapsuleLimb(ctx, length, w, color);
}

export function drawPants(ctx, style, color, legLength = 26, dir = 0, build = 1.0) {
  if (window.isOutlinePass) return;
  const w = 6 * build;
  if (style === 'shorts') legLength *= 0.6;
  drawCapsuleLimb(ctx, legLength, w, color);
}

/* ─── Shoes — direction-aware, smooth ankle blend ─── */

export function drawShoe(ctx, style, color, dir = 0, isLeft = false) {
  if (window.isOutlinePass) return;
  ctx.save();

  if (style === 'barefoot') {
    // Simple foot shape, adjusts slightly for direction
    const toeX = dir === 2 ? 0 : (dir === 0 || dir === 1 || dir === 7 ? 2 : 0);
    const toeW = dir === 2 ? 4 : 6;
    ctx.beginPath();
    ctx.ellipse(toeX, 1, toeW, 4, 0, 0, Math.PI * 2);
    const fg = ctx.createRadialGradient(toeX - 1, -1, 0.5, toeX, 1, toeW);
    fg.addColorStop(0, lighten(color, 0.06));
    fg.addColorStop(0.6, color);
    fg.addColorStop(1, darken(color, 0.08));
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
    return;
  }

  const darkC = darken(color, 0.18);

  if (dir === 2) {
    // Profile view — shoe pointing right, single side silhouette
    ctx.beginPath();
    ctx.roundRect(-4, -4, 16, 10, [3, 6, 4, 3]);
    const sg = ctx.createLinearGradient(-4, -4, 12, 6);
    sg.addColorStop(0, lighten(color, 0.10));
    sg.addColorStop(0.5, color);
    sg.addColorStop(1, darken(color, 0.14));
    ctx.fillStyle = sg;
    ctx.fill();
    // Sole line
    if (style === 'boots' || style === 'armored') {
      ctx.beginPath();
      ctx.moveTo(-3, 5);
      ctx.lineTo(10, 5);
      ctx.strokeStyle = darkC;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // Side highlight
    ctx.beginPath();
    ctx.ellipse(4, -1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,0.07)`;
    ctx.fill();
  } else if (dir === 0 || dir === 1 || dir === 7) {
    // Front / SE / SW — shoe points forward, show toe cap
    const skewX = dir === 1 ? 2 : (dir === 7 ? -2 : 0);
    ctx.beginPath();
    ctx.roundRect(-5 + skewX, -3, 14, 9, [2, 2, 5, 5]);
    const sg = ctx.createLinearGradient(-5 + skewX, -3, 9 + skewX, 6);
    sg.addColorStop(0, lighten(color, 0.12));
    sg.addColorStop(0.6, color);
    sg.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = sg;
    ctx.fill();
    // Sole line
    if (style === 'boots' || style === 'armored') {
      ctx.beginPath();
      ctx.moveTo(-4 + skewX, 5);
      ctx.lineTo(8 + skewX, 5);
      ctx.strokeStyle = darkC;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // Toe cap highlight
    ctx.beginPath();
    ctx.ellipse(6 + skewX, 0, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,0.08)`;
    ctx.fill();
    // Boot top line
    if (style === 'boots') {
      ctx.beginPath();
      ctx.roundRect(-4 + skewX, -3, 12, 2, 1);
      ctx.fillStyle = darken(color, 0.08);
      ctx.fill();
    }
  } else {
    // Back / NE / NW (dir 3, 4, 5, 6) — shoe seen from behind, show heel
    const skewX = dir === 3 ? 1.5 : (dir === 5 ? -1.5 : 0);
    ctx.beginPath();
    ctx.roundRect(-5 + skewX, -3, 14, 9, [3, 3, 4, 4]);
    const sg = ctx.createLinearGradient(-5 + skewX, -3, 9 + skewX, 6);
    sg.addColorStop(0, darken(color, 0.06));
    sg.addColorStop(0.5, darken(color, 0.02));
    sg.addColorStop(1, lighten(color, 0.08));
    ctx.fillStyle = sg;
    ctx.fill();
    // Sole line
    if (style === 'boots' || style === 'armored') {
      ctx.beginPath();
      ctx.moveTo(-4 + skewX, 5);
      ctx.lineTo(8 + skewX, 5);
      ctx.strokeStyle = darkC;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // Heel counter (back of shoe)
    ctx.beginPath();
    ctx.roundRect(-3 + skewX, -2, 8, 3, 1);
    ctx.fillStyle = darken(color, 0.1);
    ctx.fill();
    // Boot top line
    if (style === 'boots') {
      ctx.beginPath();
      ctx.roundRect(-4 + skewX, -3, 12, 2, 1);
      ctx.fillStyle = darken(color, 0.08);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ─── Hats — keep outlines for accessories ─── */

export function drawHat(ctx, style, color, dir = 0) {
  if (style === 'none' || window.isOutlinePass) return;
  ctx.save();
  ctx.translate(0, -22);

  const darkC = darken(color, 0.2);
  const lightC = lighten(color, 0.15);

  if (style === 'knight-helm') {
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 8);
    const hg = ctx.createLinearGradient(-16, -16, 16, 16);
    hg.addColorStop(0, lightC);
    hg.addColorStop(0.5, color);
    hg.addColorStop(1, darkC);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (dir !== 4 && dir !== 3) {
      let mx = dir === 2 ? 8 : 0;
      ctx.beginPath();
      ctx.roundRect(-12 + mx, -2, 24, 10, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(0, -20);
    ctx.lineTo(12, -16);
    ctx.strokeStyle = lighten(color, 0.2);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else if (style === 'wizard-hat') {
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 6, 0, 0, Math.PI * 2);
    const brimG = ctx.createLinearGradient(-24, 0, 24, 0);
    brimG.addColorStop(0, darkC);
    brimG.addColorStop(0.5, color);
    brimG.addColorStop(1, darkC);
    ctx.fillStyle = brimG;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.quadraticCurveTo(-8, -30, 4, -40);
    ctx.quadraticCurveTo(10, -30, 14, 2);
    ctx.closePath();
    const coneG = ctx.createLinearGradient(-14, 2, 14, -30);
    coneG.addColorStop(0, color);
    coneG.addColorStop(0.5, lighten(color, 0.1));
    coneG.addColorStop(1, darken(color, 0.1));
    ctx.fillStyle = coneG;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    ctx.beginPath();
    const starX = 0, starY = -12;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = 4;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](starX + Math.cos(angle) * r, starY + Math.sin(angle) * r);
      const innerAngle = angle + (2 * Math.PI) / 10;
      ctx.lineTo(starX + Math.cos(innerAngle) * 2, starY + Math.sin(innerAngle) * 2);
    }
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(-22, 2, 44, 6, 3);
    const bg2 = ctx.createLinearGradient(-22, 2, 22, 8);
    bg2.addColorStop(0, darkC);
    bg2.addColorStop(0.5, color);
    bg2.addColorStop(1, darkC);
    ctx.fillStyle = bg2;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 20, 8);
    const cg2 = ctx.createLinearGradient(-14, -14, 14, 6);
    cg2.addColorStop(0, lightC);
    cg2.addColorStop(0.5, color);
    cg2.addColorStop(1, darkC);
    ctx.fillStyle = cg2;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    if (style === 'crown') {
      for (const cx of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.moveTo(cx - 4, -14);
        ctx.lineTo(cx, -22);
        ctx.lineTo(cx + 4, -14);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, -16, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ─── Cape ─── */

export function drawCape(ctx, style, color, waveAngle = 0, dir = 0) {
  if (style === 'none' || window.isOutlinePass) return;
  ctx.save();
  ctx.translate(0, 4);
  if (dir === 2) ctx.translate(-16, 0);

  const darkC = darken(color, 0.2);
  const lightC = lighten(color, 0.1);

  if (style === 'cape') {
    const swingX = Math.sin(waveAngle) * 16;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.quadraticCurveTo(18 + swingX * 0.5, 35, 24 + swingX, 70);
    ctx.lineTo(-24 + swingX, 70);
    ctx.quadraticCurveTo(-18 + swingX * 0.5, 35, -10, 0);
    ctx.closePath();

    const cg = ctx.createLinearGradient(-24, 0, 24 + swingX, 70);
    cg.addColorStop(0, lightC);
    cg.addColorStop(0.4, color);
    cg.addColorStop(1, darkC);
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = darkC;
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.quadraticCurveTo(-8 + swingX * 0.3, 40, -12 + swingX * 0.7, 65);
    ctx.strokeStyle = `rgba(0,0,0,0.08)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 10);
    ctx.quadraticCurveTo(8 + swingX * 0.3, 40, 12 + swingX * 0.7, 65);
    ctx.stroke();
  } else if (style === 'wings') {
    ctx.translate(0, 10);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 20, -10, 15, 25, side * 0.5, 0, Math.PI * 2);
      const wg = ctx.createRadialGradient(side * 20, -15, 3, side * 20, -10, 25);
      wg.addColorStop(0, `rgba(255,255,255,0.6)`);
      wg.addColorStop(0.5, lighten(color, 0.3));
      wg.addColorStop(1, color);
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.2);
      ctx.lineWidth = currentOutlineThickness;
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(side * 20, -10);
        ctx.lineTo(side * (28 + i * 3), -5 + i * 8);
        ctx.strokeStyle = `rgba(255,255,255,0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  } else if (style === 'quiver') {
    ctx.beginPath();
    ctx.roundRect(-6, -15, 12, 30, 3);
    const qg = ctx.createLinearGradient(-6, -15, 6, 15);
    qg.addColorStop(0, lighten(color, 0.1));
    qg.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = qg;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();

    for (let i = -3; i <= 3; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, -15);
      ctx.lineTo(i, -25);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i - 2, -25);
      ctx.lineTo(i, -30);
      ctx.lineTo(i + 2, -25);
      ctx.fillStyle = '#d1d5db';
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ─── Weapons — keep outlines for accessories ─── */

export function drawWeapon(ctx, style, color, swingAngle = 0, dir = 0) {
  if (style === 'none' || window.isOutlinePass) return;
  ctx.save();
  ctx.rotate(swingAngle);

  if (style === 'sword') {
    ctx.beginPath();
    ctx.roundRect(-3, -5, 6, 14, 2);
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    ctx.strokeStyle = '#3f2717';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-2.5, -2 + i * 4);
      ctx.lineTo(2.5, -1 + i * 4);
      ctx.strokeStyle = '#8b6c3c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.roundRect(-10, 9, 20, 6, 2);
    const gg = ctx.createLinearGradient(-10, 9, 10, 15);
    gg.addColorStop(0, '#fde68a');
    gg.addColorStop(0.5, '#fbbf24');
    gg.addColorStop(1, '#b45309');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3.5, 15);
    ctx.lineTo(-2, 48);
    ctx.lineTo(0, 52);
    ctx.lineTo(2, 48);
    ctx.lineTo(3.5, 15);
    ctx.closePath();
    const blG = ctx.createLinearGradient(-3.5, 15, 3.5, 15);
    blG.addColorStop(0, darken(color, 0.1));
    blG.addColorStop(0.3, lighten(color, 0.3));
    blG.addColorStop(0.6, color);
    blG.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = blG;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 48);
    ctx.strokeStyle = `rgba(255,255,255,0.2)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else if (style === 'axe') {
    ctx.beginPath();
    ctx.roundRect(-3, -15, 6, 40, 2);
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    ctx.strokeStyle = '#3f2717';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(22, 10, 24, 15);
    ctx.lineTo(24, 25);
    ctx.quadraticCurveTo(22, 30, 0, 22);
    ctx.closePath();
    const ag = ctx.createRadialGradient(16, 18, 2, 16, 18, 14);
    ag.addColorStop(0, lighten(color, 0.2));
    ag.addColorStop(0.5, color);
    ag.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = ag;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (style === 'spear') {
    ctx.beginPath();
    ctx.roundRect(-2, -30, 4, 80, 2);
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    ctx.strokeStyle = '#3f2717';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -30);
    ctx.lineTo(0, -50);
    ctx.lineTo(6, -30);
    ctx.closePath();
    const sg2 = ctx.createLinearGradient(-6, -30, 6, -30);
    sg2.addColorStop(0, darken(color, 0.1));
    sg2.addColorStop(0.5, lighten(color, 0.2));
    sg2.addColorStop(1, darken(color, 0.1));
    ctx.fillStyle = sg2;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (style === 'bow') {
    ctx.beginPath();
    ctx.arc(-15, 0, 25, -Math.PI / 3, Math.PI / 3, false);
    ctx.strokeStyle = '#5c3a1e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#8b6c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, -22);
    ctx.lineTo(-2, 22);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(-3, -10, 6, 40, 2);
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    ctx.strokeStyle = '#3f2717';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -15, 8, 0, Math.PI * 2);
    const og = ctx.createRadialGradient(-2, -17, 1, 0, -15, 8);
    og.addColorStop(0, lighten(color, 0.4));
    og.addColorStop(0.5, color);
    og.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = og;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,0.06)`;
    ctx.fill();
  }
  ctx.restore();
}

/* ─── Left-hand items — keep outlines ─── */

export function drawLeftHandItem(ctx, style, color, dir = 0) {
  if (style === 'none' || window.isOutlinePass) return;

  if (style === 'shield') {
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(14, -10);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 28);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    const sg = ctx.createLinearGradient(-14, -10, 14, 28);
    sg.addColorStop(0, lighten(color, 0.15));
    sg.addColorStop(0.5, color);
    sg.addColorStop(1, darken(color, 0.15));
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = currentOutlineThickness;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 20);
    ctx.moveTo(-8, 4);
    ctx.lineTo(8, 4);
    ctx.strokeStyle = lighten(color, 0.3);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
  } else if (style === 'torch') {
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 20, 2);
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    for (const [ox, oy, r, a] of [[0, -6, 8, 0.9], [-3, -4, 5, 0.7], [3, -5, 5, 0.7], [0, -10, 4, 0.5]]) {
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${a})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 24, 3);
    const bg = ctx.createLinearGradient(-10, -12, 10, 12);
    bg.addColorStop(0, lighten(color, 0.1));
    bg.addColorStop(1, darken(color, 0.1));
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = currentOutlineThickness;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-8, -10, 16, 20, 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-1, -12, 2, 4, 1);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
  }
}

/* ─── Hand shape — NO outline, blends with arm ─── */

export function drawHandShape(ctx, skinColor, isLeft = false, dir = 0) {
  if (window.isOutlinePass) return;

  ctx.beginPath();
  ctx.arc(0, 2, 6, 0, Math.PI * 2);
  const hg = ctx.createRadialGradient(-1, 0, 1, 0, 2, 6);
  hg.addColorStop(0, lighten(skinColor, 0.1));
  hg.addColorStop(0.7, skinColor);
  hg.addColorStop(1, darken(skinColor, 0.1));
  ctx.fillStyle = hg;
  ctx.fill();
  // No outline — blends with sleeve
}
