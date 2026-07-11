/**
 * ChromaForge 2D - Vector Parts Library
 * Contains procedural vector drawing functions for character anatomy, clothing, and gear.
 */

let currentOutlineThickness = 3.5;

export function setOutlineThickness(thickness) {
  currentOutlineThickness = thickness;
}

function applyVectorStyle(ctx, fillColor, strokeColor = '#0b0f19', lineWidth = currentOutlineThickness) {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function drawPath(ctx, drawFn, fillColor, strokeColor, lineWidth) {
  ctx.beginPath();
  drawFn();
  applyVectorStyle(ctx, fillColor, strokeColor, lineWidth);
  ctx.fill();
  ctx.stroke();
}

/**
 * Head Shapes
 */
export function drawHeadShape(ctx, type, skinColor, dir = 0, build = 1.0, noseSize = 1.0, noseShape = 'normal') {
  const w = 24 * build;
  ctx.beginPath();
  if (type === 'round') {
    ctx.ellipse(0, 0, w, 24, 0, 0, Math.PI * 2);
  } else if (type === 'oval') {
    ctx.ellipse(0, 0, w + 2, 22, 0, 0, Math.PI * 2);
  } else if (type === 'square') {
    ctx.roundRect(-w + 1, -23, w * 2 - 2, 46, 8);
  } else if (type === 'pointy') {
    ctx.moveTo(-w + 2, -18);
    ctx.bezierCurveTo(-w + 2, 6, -10, 26, 0, 26);
    ctx.bezierCurveTo(10, 26, w - 2, 6, w - 2, -18);
    ctx.closePath();
  } else if (type === 'anime') {
    ctx.moveTo(-w - 2, -10);
    ctx.bezierCurveTo(-w - 2, 10, -5, 28, 0, 30);
    ctx.bezierCurveTo(5, 28, w + 2, 10, w + 2, -10);
    ctx.bezierCurveTo(w + 2, -30, -w - 2, -30, -w - 2, -10);
    ctx.closePath();
  } else if (type === 'diamond') {
    ctx.moveTo(0, -26);
    ctx.lineTo(w + 6, 0);
    ctx.lineTo(0, 26);
    ctx.lineTo(-w - 6, 0);
    ctx.closePath();
  }
  applyVectorStyle(ctx, skinColor);
  ctx.fill();
  ctx.stroke();

  // Draw ears
  if (dir !== 4) {
    if (dir === 0 || dir === 1 || dir === 7) { 
      ctx.beginPath(); ctx.arc(-w, 0, 4.5, 0, Math.PI * 2); applyVectorStyle(ctx, skinColor); ctx.fill(); ctx.stroke();
    }
    if (dir === 0 || dir === 3 || dir === 1 || dir === 2) {
      ctx.beginPath(); ctx.arc(w, 0, 4.5, 0, Math.PI * 2); applyVectorStyle(ctx, skinColor); ctx.fill(); ctx.stroke();
    }
  }

  // Draw nose
  if (noseShape === 'none') return;
  let faceShiftX = dir === 0 ? 2 : 0;
  ctx.save();
  ctx.translate(faceShiftX, 2);
  ctx.scale(noseSize, noseSize);
  
  if (dir === 0 || dir === 1) {
    ctx.beginPath();
    if (noseShape === 'pointy') {
      ctx.moveTo(-1, 0); ctx.lineTo(1, 4); ctx.lineTo(3, 4);
    } else if (noseShape === 'wide') {
      ctx.moveTo(-3, 2); ctx.quadraticCurveTo(0, 4, 3, 2);
    } else {
      ctx.moveTo(-1, 0); ctx.quadraticCurveTo(2.5, 1.5, 1, 4.5);
    }
    ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
  } else if (dir === 2) {
    ctx.beginPath();
    if (noseShape === 'pointy') {
      ctx.moveTo(w - faceShiftX, -4); ctx.lineTo(w + 6 - faceShiftX, 1); ctx.lineTo(w - faceShiftX, 5);
    } else if (noseShape === 'wide') {
      ctx.moveTo(w - faceShiftX, -2); ctx.bezierCurveTo(w + 4 - faceShiftX, -2, w + 4 - faceShiftX, 4, w - faceShiftX, 5);
    } else {
      ctx.moveTo(w - faceShiftX, -4); ctx.lineTo(w + 5 - faceShiftX, 1); ctx.lineTo(w - faceShiftX, 5);
    }
    ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
  }
  ctx.restore();
}

/**
 * Eyes
 */
export function drawEyes(ctx, style, color, isBlinking = false, dir = 0, eyeDistance = 1.0) {
  let faceShiftX = dir === 0 ? 3 : 0;
  let distOffset = (eyeDistance - 1.0) * 10; 

  if (isBlinking) {
    if (dir !== 2) {
      ctx.beginPath(); ctx.arc(-10 + faceShiftX - distOffset, -2, 5, Math.PI, 0, false); ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(10 + faceShiftX + distOffset, -2, 5, Math.PI, 0, false); ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
    return;
  }

  const drawEyeSingle = (xCoord, sideSign) => {
    ctx.save();
    let shiftX = sideSign < 0 ? -distOffset : distOffset;
    if (dir === 2) shiftX = 0; // Don't shift profile eye based on distance
    
    ctx.translate(xCoord + faceShiftX + shiftX, -2);
    
    if (style === 'normal') {
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2); applyVectorStyle(ctx, '#ffffff'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(1.5, 1, 4, 0, Math.PI * 2); applyVectorStyle(ctx, color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(1.5, -2.5, 1.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (style === 'cute') {
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); applyVectorStyle(ctx, '#0b0f19'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0.2, Math.PI - 0.2); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(2, -3, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (style === 'angry') {
      ctx.rotate(sideSign * 0.25);
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); applyVectorStyle(ctx, '#ffffff'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(1.5, 0, 3, 0, Math.PI * 2); applyVectorStyle(ctx, color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -2); ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
    } else if (style === 'tired') {
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI * 2); applyVectorStyle(ctx, '#ffffff'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); applyVectorStyle(ctx, color); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 7, 5, 0, Math.PI, false); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke(); // bags
    } else if (style === 'cat-eyes') {
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2); applyVectorStyle(ctx, color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 1.5, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#0b0f19'; ctx.fill(); // slit
    } else if (style === 'glowing') {
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2); 
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fill(); 
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  };

  if (dir === 0 || dir === 1) drawEyeSingle(-10, -1);
  drawEyeSingle(10, 1);
}

/**
 * Mouth
 */
export function drawMouth(ctx, style, dir = 0, mouthSize = 1.0, mouthPos = 0) {
  let mx = dir === 2 ? 8 : 0;
  if (dir === 0) mx += 2; // Shift right for South dir

  ctx.save();
  ctx.translate(mx, mouthPos);
  ctx.scale(mouthSize, mouthSize);
  ctx.translate(-mx, 0); // scale relative to mx center

  ctx.beginPath();
  ctx.strokeStyle = '#0b0f19';
  ctx.lineWidth = currentOutlineThickness / mouthSize; // prevent lines from scaling thicker
  ctx.lineCap = 'round';

  if (style === 'smile') {
    ctx.arc(mx, 13, 5, 0.1, Math.PI - 0.1); ctx.stroke();
  } else if (style === 'neutral') {
    ctx.moveTo(mx - 4, 16); ctx.lineTo(mx + 4, 16); ctx.stroke();
  } else if (style === 'frown') {
    ctx.arc(mx, 20, 4, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
  } else if (style === 'open') {
    drawPath(ctx, () => { ctx.arc(mx, 15, 4.5, 0, Math.PI, false); ctx.closePath(); }, '#ef4444');
  } else if (style === 'blush') {
    ctx.arc(mx, 14, 4, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath(); ctx.ellipse(mx - 14, 11, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx + 14, 11, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'smirk') {
    ctx.moveTo(mx - 4, 14); ctx.quadraticCurveTo(mx + 2, 14, mx + 6, 11); ctx.stroke();
  } else if (style === 'surprised') {
    drawPath(ctx, () => { ctx.ellipse(mx, 16, 3, 4, 0, 0, Math.PI * 2); }, '#0b0f19');
  } else if (style === 'teeth') {
    drawPath(ctx, () => { ctx.rect(mx - 6, 13, 12, 5); }, '#ffffff');
    ctx.beginPath(); ctx.moveTo(mx - 6, 15.5); ctx.lineTo(mx + 6, 15.5); ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

/**
 * Hair
 */
export function drawHair(ctx, style, color, dir = 0) {
  if (style === 'bald') return;
  
  if (style === 'spiky') {
    drawPath(ctx, () => {
      ctx.moveTo(-26, -5);
      ctx.bezierCurveTo(-26, -20, -18, -32, 0, -32);
      ctx.bezierCurveTo(18, -32, 26, -20, 26, -5);
      ctx.lineTo(28, -12); ctx.lineTo(20, -22); ctx.lineTo(22, -32);
      ctx.lineTo(8, -34); ctx.lineTo(0, -42); ctx.lineTo(-8, -34);
      ctx.lineTo(-22, -32); ctx.lineTo(-20, -22); ctx.lineTo(-28, -12);
      ctx.closePath();
    }, color);
    if (dir !== 4) { 
      drawPath(ctx, () => {
        ctx.moveTo(-16, -18); ctx.lineTo(-10, -12); ctx.lineTo(-4, -20);
        ctx.lineTo(2, -10); ctx.lineTo(10, -22); ctx.lineTo(18, -15);
        ctx.lineTo(10, -28); ctx.lineTo(-10, -28); ctx.closePath();
      }, color);
    }
  } else if (style === 'curly') {
    drawPath(ctx, () => {
      ctx.arc(0, -12, 28, Math.PI, 0, false);
      for(let i = 28; i >= -28; i -= 8) {
        ctx.arc(i, -12, 6, 0, Math.PI, false);
      }
      ctx.closePath();
    }, color);
  } else if (style === 'long') {
    drawPath(ctx, () => {
      ctx.arc(0, -12, 26, Math.PI, 0, false);
      ctx.lineTo(30, 25); ctx.lineTo(15, 25);
      if (dir === 4) { ctx.lineTo(-15, 25); ctx.lineTo(-30, 25); } // Cover back
      else { ctx.lineTo(20, -10); ctx.lineTo(-20, -10); ctx.lineTo(-15, 25); ctx.lineTo(-30, 25); }
      ctx.closePath();
    }, color);
  } else if (style === 'ponytail') {
    drawPath(ctx, () => { ctx.arc(0, -12, 25, Math.PI, 0, false); }, color);
    if (dir === 2 || dir === 3 || dir === 4) {
      drawPath(ctx, () => {
        const px = dir === 2 ? -28 : 0;
        ctx.moveTo(px, -15);
        ctx.quadraticCurveTo(px - 15, -10, px - 10, 15);
        ctx.quadraticCurveTo(px, -5, px, -10);
      }, color);
    }
  } else if (style === 'mohawk') {
    drawPath(ctx, () => {
      if (dir === 2) {
        ctx.moveTo(-10, -22); ctx.lineTo(5, -45); ctx.lineTo(15, -20);
      } else {
        ctx.moveTo(-8, -25); ctx.lineTo(0, -45); ctx.lineTo(8, -25);
      }
    }, color);
  } else if (style === 'bob') {
    drawPath(ctx, () => {
      ctx.arc(0, -10, 28, Math.PI, 0, false);
      ctx.lineTo(28, 10);
      if (dir !== 4) { ctx.lineTo(15, 10); ctx.lineTo(15, -15); ctx.lineTo(-15, -15); ctx.lineTo(-15, 10); }
      ctx.lineTo(-28, 10);
      ctx.closePath();
    }, color);
  }
}

/**
 * Clothing: Shirts & Torso
 */
export function drawShirt(ctx, style, color, height = 1.0, build = 1.0, dir = 0, gender = 'male', bust = 0.0) {
  const h = 48 * height;
  let w = 15 * build;
  let bottomW = 13 * build;
  if (dir === 2) { w = 9 * build; bottomW = 7 * build; }

  // Fallback to bare chest
  if (style === 'none') {
    if (gender === 'female') { // Tube top for females
      drawPath(ctx, () => {
        ctx.moveTo(-w, h*0.25); ctx.lineTo(w, h*0.25); ctx.lineTo(w, h*0.45); ctx.lineTo(-w, h*0.45); ctx.closePath();
      }, '#1f2937');
      drawBust(ctx, gender, bust, dir, w, '#1f2937', false);
    } else {
      drawBust(ctx, gender, bust, dir, w, '#ffdbac', true);
    }
    return;
  }

  if (style === 'tunic') {
    drawPath(ctx, () => {
      ctx.moveTo(-w, 0); ctx.lineTo(w, 0); ctx.lineTo(bottomW, h); ctx.lineTo(-bottomW, h); ctx.closePath();
    }, color);
    drawBust(ctx, gender, bust, dir, w, color, false);
    if (dir !== 4) {
      ctx.beginPath(); ctx.moveTo(-w*0.5, 0); ctx.lineTo(0, 12); ctx.lineTo(w*0.5, 0);
      ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
    }
    drawPath(ctx, () => { ctx.rect(-bottomW - 1, h - 14, (bottomW * 2) + 2, 8); }, '#78350f');
    if (dir === 0 || dir === 1) drawPath(ctx, () => { ctx.rect(-3, h - 16, 6, 12); }, '#fbbf24');
  } else if (style === 'armor' || style === 'plate-mail') {
    drawPath(ctx, () => {
      ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w, 0, -w-2, h/2, -bottomW, h);
      ctx.lineTo(bottomW, h); ctx.bezierCurveTo(w+2, h/2, w, 0, w, 0); ctx.closePath();
    }, color);
    drawBust(ctx, gender, bust, dir, w, color, false);
    
    if (style === 'plate-mail' && dir !== 4) {
       drawPath(ctx, () => { ctx.rect(-w*0.5, h*0.3, w, h*0.4); }, '#9ca3af'); // core plate
    }
    
    if (dir !== 4) {
      ctx.beginPath();
      ctx.moveTo(-w*0.8, h*0.25); ctx.lineTo(w*0.8, h*0.25);
      ctx.moveTo(-w*0.7, h*0.5); ctx.lineTo(w*0.7, h*0.5);
      ctx.moveTo(-w*0.6, h*0.75); ctx.lineTo(w*0.6, h*0.75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
    }
  } else if (style === 'leather-armor') {
    drawPath(ctx, () => {
      ctx.moveTo(-w, 0); ctx.lineTo(w, 0); ctx.lineTo(bottomW, h); ctx.lineTo(-bottomW, h); ctx.closePath();
    }, color);
    drawBust(ctx, gender, bust, dir, w, color, false);
    if (dir !== 4) {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(w, h*0.6); ctx.stroke(); // leather strap
    }
    drawPath(ctx, () => { ctx.rect(-bottomW - 1, h - 10, (bottomW * 2) + 2, 5); }, '#3f2717');
  } else if (style === 'robe' || style === 'cleric-robes') {
    const flareW = 20 * build;
    const robeH = 56 * height;
    drawPath(ctx, () => {
      ctx.moveTo(-w, 0); ctx.lineTo(w, 0); ctx.lineTo(flareW, robeH); ctx.lineTo(-flareW, robeH); ctx.closePath();
    }, color);
    drawBust(ctx, gender, bust, dir, w, color, false);
    
    if (style === 'cleric-robes' && dir !== 4) { // Gold trim
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, robeH); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4; ctx.stroke();
    }
  } else if (style === 'casual-shirt' || style === 'ninja') {
    drawPath(ctx, () => {
      ctx.moveTo(-w, 0); ctx.lineTo(w, 0); ctx.lineTo(bottomW, h); ctx.lineTo(-bottomW, h); ctx.closePath();
    }, color);
    drawBust(ctx, gender, bust, dir, w, color, false);
    
    if (style === 'ninja' && dir !== 4) {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(bottomW*0.6, h); ctx.moveTo(w, 0); ctx.lineTo(-bottomW*0.6, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
      drawPath(ctx, () => { ctx.rect(-bottomW - 1, h - 12, (bottomW * 2) + 2, 7); }, '#1e2937');
    }
  }
}

/**
 * Draws the female bust over the shirt
 */
function drawBust(ctx, gender, bust, dir, bodyW, color, isBare) {
  if (gender !== 'female' || bust <= 0 || dir === 4 || dir === 3) return; 
  
  const bSize = 6 + (bust * 4); // Max size slightly constrained so it doesn't poke out
  const yOff = 16;
  
  ctx.beginPath();
  if (dir === 2) { 
    ctx.arc(bodyW - 2, yOff, bSize * 0.7, -Math.PI/2, Math.PI/2, false);
  } else if (dir === 0 || dir === 1) { 
    const shift = dir === 1 ? 4 : 0;
    // Keep radius small enough so it stays inside bodyW
    const r = Math.min(bSize, bodyW / 2 - 1);
    ctx.arc(-bodyW/2 + shift, yOff, r, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bodyW/2 + shift, yOff, r, 0.2, Math.PI - 0.2);
    
    // Cleavage line
    if (dir === 0) {
      ctx.moveTo(shift, yOff - r/2); ctx.lineTo(shift, yOff + r/2);
    }
  }
  ctx.strokeStyle = '#0b0f19';
  ctx.lineWidth = currentOutlineThickness;
  ctx.stroke();

  // Subtle shading inside the curve
  if (!isBare) {
    // optional fill or something if needed, but lines are usually enough for 3D look.
  }
}

export function drawSleeve(ctx, style, color, length = 24, dir = 0, build = 1.0) {
  if (style === 'none') return;
  const w = 5 * build;
  
  if (style === 'robe' || style === 'cleric-robes') {
    drawPath(ctx, () => {
      ctx.arc(0, 0, w + 1, Math.PI, 0, false);
      ctx.lineTo(w + 5, length);
      ctx.arc(0, length, w + 5, 0, Math.PI, false);
      ctx.closePath();
    }, color);
  } else {
    drawPath(ctx, () => {
      ctx.arc(0, 0, w, Math.PI, 0, false);
      ctx.lineTo(w, length);
      ctx.arc(0, length, w, 0, Math.PI, false);
      ctx.closePath();
    }, color);
  }
}

export function drawPants(ctx, style, color, legLength = 26, dir = 0, build = 1.0) {
  const w = 5.5 * build;
  if (style === 'trousers' || style === 'armored') {
    drawPath(ctx, () => {
      ctx.arc(0, 0, w, Math.PI, 0, false);
      ctx.lineTo(w - 1, legLength); 
      ctx.arc(0, legLength, w - 1, 0, Math.PI, false);
      ctx.closePath();
    }, color);
  } else if (style === 'shorts') {
    drawPath(ctx, () => {
      ctx.arc(0, 0, w + 0.5, Math.PI, 0, false);
      ctx.lineTo(w, legLength * 0.5); 
      ctx.arc(0, legLength * 0.5, w, 0, Math.PI, false);
      ctx.closePath();
    }, color);
  } else if (style === 'skirt') {
    drawPath(ctx, () => {
      ctx.arc(0, 0, w + 1, Math.PI, 0, false);
      ctx.lineTo(w + 6, legLength * 0.7); 
      ctx.arc(0, legLength * 0.7, w + 6, 0, Math.PI, false);
      ctx.closePath();
    }, color);
  }
}

export function drawShoe(ctx, style, color, dir = 0) {
  if (style === 'barefoot') {
    drawPath(ctx, () => {
      ctx.arc(0, 0, 4, Math.PI, 0, false);
      ctx.bezierCurveTo(4, 5, 8, 8, 4, 10); ctx.lineTo(-3, 10); ctx.closePath();
    }, '#ffdbac');
    return;
  }
  drawPath(ctx, () => {
    ctx.arc(0, 0, 5, Math.PI, 0, false);
    ctx.lineTo(5, 6);
    if (dir === 2) ctx.bezierCurveTo(5, 6, 12, 9, 11, 12);
    else ctx.bezierCurveTo(5, 6, 8, 9, 7, 12);
    ctx.lineTo(-5, 12); ctx.closePath();
  }, color);
}

export function drawHat(ctx, style, color, dir = 0) {
  if (style === 'none') return;
  ctx.save();
  ctx.translate(0, -18);
  if (style === 'knight-helm') {
    drawPath(ctx, () => {
      ctx.arc(0, -2, 25, Math.PI, 0, false); ctx.lineTo(25, 16); ctx.lineTo(-25, 16); ctx.closePath();
    }, color);
    if (dir !== 4) {
      let mx = dir === 2 ? 8 : 0; // Shift visor in profile
      drawPath(ctx, () => { ctx.roundRect(-20 + mx, 2, 40, 11, 4); }, '#1f2937');
      ctx.beginPath(); for (let i = -12 + mx; i <= 12 + mx; i += 6) { ctx.moveTo(i, 4); ctx.lineTo(i, 11); }
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2; ctx.stroke();
    }
  } else {
    drawPath(ctx, () => { ctx.ellipse(0, 4, 30, 6, 0, 0, Math.PI * 2); }, color);
    drawPath(ctx, () => { ctx.arc(0, 0, 20, Math.PI, 0, false); }, color);
  }
  ctx.restore();
}

export function drawCape(ctx, style, color, waveAngle = 0, dir = 0) {
  if (style === 'none') return;
  if (style === 'cape') {
    ctx.save(); 
    ctx.translate(0, 2);
    if (dir === 2) ctx.translate(-16, 0); // Shift cape back in profile

    drawPath(ctx, () => {
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
      const swingX = Math.sin(waveAngle) * 16;
      ctx.bezierCurveTo(24, 30, 28 + swingX, 75, 22 + swingX, 86); ctx.lineTo(-22 + swingX, 86);
      ctx.bezierCurveTo(-28 + swingX, 75, -24, 30, -12, 0); ctx.closePath();
    }, color);
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(0, 10);
    drawPath(ctx, () => { ctx.moveTo(0, 0); ctx.lineTo(20, -20); ctx.lineTo(40, 0); ctx.lineTo(10, 20); ctx.closePath(); }, color);
    drawPath(ctx, () => { ctx.moveTo(0, 0); ctx.lineTo(-20, -20); ctx.lineTo(-40, 0); ctx.lineTo(-10, 20); ctx.closePath(); }, color);
    ctx.restore();
  }
}

export function drawWeapon(ctx, style, color, swingAngle = 0, dir = 0) {
  if (style === 'none') return;
  ctx.save();
  ctx.rotate(swingAngle);
  
  if (style === 'sword') {
    drawPath(ctx, () => { ctx.rect(-2, -5, 4, 14); }, '#78350f'); // Hilt
    drawPath(ctx, () => { ctx.rect(-8, 9, 16, 4); }, '#fbbf24'); // Guard
    drawPath(ctx, () => { ctx.moveTo(-3, 13); ctx.lineTo(3, 13); ctx.lineTo(2, 45); ctx.lineTo(0, 50); ctx.lineTo(-2, 45); ctx.closePath(); }, color);
  } else if (style === 'dagger') {
    drawPath(ctx, () => { ctx.rect(-1.5, -2, 3, 6); }, '#111827'); 
    drawPath(ctx, () => { ctx.moveTo(-2, 4); ctx.lineTo(2, 4); ctx.lineTo(0, 20); ctx.closePath(); }, color);
  } else if (style === 'axe') {
    drawPath(ctx, () => { ctx.rect(-2, -15, 4, 40); }, '#78350f'); 
    drawPath(ctx, () => { ctx.moveTo(2, 10); ctx.lineTo(20, 5); ctx.lineTo(22, 25); ctx.lineTo(2, 20); ctx.closePath(); }, color);
  } else if (style === 'spear') {
    drawPath(ctx, () => { ctx.rect(-1.5, -30, 3, 80); }, '#78350f'); 
    drawPath(ctx, () => { ctx.moveTo(-4, -30); ctx.lineTo(4, -30); ctx.lineTo(0, -50); ctx.closePath(); }, color);
  } else if (style === 'mace') {
    drawPath(ctx, () => { ctx.rect(-2, -5, 4, 30); }, '#78350f'); 
    drawPath(ctx, () => { ctx.arc(0, 30, 8, 0, Math.PI*2); }, color);
  } else if (style === 'wand') {
    drawPath(ctx, () => { ctx.rect(-1, -5, 2, 20); }, '#78350f'); 
    drawPath(ctx, () => { ctx.arc(0, 18, 4, 0, Math.PI*2); }, color);
  } else if (style === 'bow') {
    drawPath(ctx, () => {
      ctx.moveTo(-5, -25); ctx.quadraticCurveTo(15, 0, -5, 25);
    }, '#78350f');
    ctx.beginPath(); ctx.moveTo(-5, -25); ctx.lineTo(-5, 25); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = currentOutlineThickness; ctx.stroke();
  } else if (style === 'staff') {
    drawPath(ctx, () => { ctx.rect(-2, -15, 4, 60); }, '#78350f');
    drawPath(ctx, () => { ctx.arc(0, -20, 6, 0, Math.PI*2); }, color);
  }
  
  ctx.restore();
}

export function drawLeftHandItem(ctx, style, color, dir = 0) {
  if (style === 'none') return;
  if (style === 'shield') {
    drawPath(ctx, () => {
      ctx.moveTo(-12, -8); ctx.lineTo(12, -8);
      ctx.lineTo(10, 15); ctx.lineTo(0, 25); ctx.lineTo(-10, 15); ctx.closePath();
    }, color);
  } else {
    drawPath(ctx, () => { ctx.rect(-10, -12, 20, 24); }, color); 
  }
}
