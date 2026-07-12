/**
 * ChromaForge 2D - Animation Engine
 * Contains equations and joint curves for parametric 2D skeletal character animation.
 */

/**
 * Calculates joint transforms for a given animation, progress frame, and options.
 * @param {string} animation - Animation key ('idle', 'walk', 'run', 'jump', 'attack')
 * @param {number} progress - Progress of animation (0 to 1)
 * @returns {Object} Joint angles and translations
 */
export function getAnimationPose(animation, progress, direction = 0, attackStyle = 'melee') {
  const pose = {
    torsoX: 0,
    torsoY: 0,
    torsoAngle: 0,
    headAngle: 0,
    headY: 0,
    leftArmAngle: 0.1,  // Default rest angles
    rightArmAngle: -0.1,
    leftLegAngle: 0,
    rightLegAngle: 0,
    leftFootAngle: 0,
    rightFootAngle: 0,
    capeWave: progress * Math.PI * 2,
    weaponSwing: 0,
    isFlipped: false
  };

  const pi2 = Math.PI * 2;

  switch (animation) {
    case 'idle': {
      // Gentle breathing bobbing
      const breath = Math.sin(progress * pi2);
      pose.torsoY = breath * 1.1; // Bob up/down 1.1px
      pose.headY = breath * 0.4;
      pose.headAngle = Math.sin(progress * pi2 - 0.4) * 0.03; // Tiny head sway out of phase
      
      // Arms sway slightly at sides
      pose.leftArmAngle = Math.PI / 16 + Math.sin(progress * pi2) * 0.05;
      pose.rightArmAngle = -Math.PI / 16 - Math.sin(progress * pi2) * 0.05;
      
      // Legs are straight
      pose.leftLegAngle = 0;
      pose.rightLegAngle = 0;
      pose.leftFootAngle = 0;
      pose.rightFootAngle = 0;

      // Cape waves softly
      pose.capeWave = progress * pi2;
      break;
    }

    case 'walk': {
      // Alternating legs swings (Max 30 degrees = 0.52 rad)
      const swing = Math.sin(progress * pi2) * 0.45;
      pose.leftLegAngle = swing;
      pose.rightLegAngle = -swing; // 180 degrees phase difference
      
      // Animate feet tilting
      pose.leftFootAngle = swing * 0.6;
      pose.rightFootAngle = -swing * 0.6;

      // Arms swing opposite of legs
      pose.leftArmAngle = -swing * 0.75 + 0.1;
      pose.rightArmAngle = swing * 0.75 - 0.1;

      // Hip bobs up and down twice per step cycle
      // Max height at crossover (legs straight, progress 0.25 and 0.75)
      // Low point at full extension (progress 0, 0.5, 1)
      pose.torsoY = -Math.abs(Math.sin(progress * pi2)) * 2 + 1;
      pose.torsoAngle = Math.sin(progress * pi2) * 0.03; // Slight trunk rotation

      // Head counters body bob
      pose.headAngle = -Math.sin(progress * pi2) * 0.02;
      
      // Cape waves faster
      pose.capeWave = progress * pi2 * 2;
      break;
    }

    case 'run': {
      // Deeper and faster leg swing (Max 48 degrees = 0.85 rad)
      const swing = Math.sin(progress * pi2) * 0.75;
      pose.leftLegAngle = swing;
      pose.rightLegAngle = -swing;
      
      // Intense feet tilting for run
      pose.leftFootAngle = swing * 0.8;
      pose.rightFootAngle = -swing * 0.8;

      // Arms swing intensely, elbows bent (held slightly outward)
      pose.leftArmAngle = -swing * 1.1 + 0.25;
      pose.rightArmAngle = swing * 1.1 - 0.25;

      // Deep bounce (running contains a brief flight phase)
      pose.torsoY = -Math.abs(Math.sin(progress * pi2)) * 4 + 1.5;
      pose.torsoX = 1;
      pose.torsoAngle = 0.18; // Leaning forward

      // Head tilts forward slightly
      pose.headAngle = -0.04;
      
      // Cape waves intensely behind
      pose.capeWave = progress * pi2 * 2.5;
      break;
    }

    case 'jump': {
      // 0.0 - 0.15: Crouch/Squat prep
      // 0.15 - 0.5: Rising/Launch
      // 0.5 - 0.8: Peak / Falling
      // 0.8 - 1.0: Landing crouch
      
      if (progress < 0.15) {
        const t = progress / 0.15; // 0 to 1
        pose.torsoY = t * 4; // Crouch down
        pose.leftLegAngle = -t * 0.35;
        pose.rightLegAngle = -t * 0.35;
        pose.leftArmAngle = -t * 0.4;
        pose.rightArmAngle = -t * 0.4;
      } else if (progress < 0.5) {
        const t = (progress - 0.15) / 0.35; // 0 to 1
        // Rise high
        pose.torsoY = -4 + (t * -18); // height Y offset up to -22
        pose.leftLegAngle = 0.2 - (t * 0.4); // legs extend straight, then trail
        pose.rightLegAngle = 0.1 - (t * 0.3);
        // Arms raise high
        pose.leftArmAngle = -0.4 + (t * (Math.PI - 0.3));
        pose.rightArmAngle = -0.4 + (t * (Math.PI - 0.3));
        pose.torsoAngle = -0.05; // tilt back slightly
      } else if (progress < 0.8) {
        const t = (progress - 0.5) / 0.3; // 0 to 1
        // Fall back down
        pose.torsoY = -22 + (t * 22); // returning to 0
        pose.leftLegAngle = -0.2 + (t * -0.2); // tuck legs in preparation of land
        pose.rightLegAngle = -0.2 + (t * -0.3);
        pose.leftArmAngle = Math.PI - 0.7 - (t * (Math.PI - 1));
        pose.rightArmAngle = Math.PI - 0.7 - (t * (Math.PI - 1));
        pose.torsoAngle = 0.15; // lean forward during descent
      } else {
        const t = (progress - 0.8) / 0.2; // 0 to 1
        // Landing compression bounce
        pose.torsoY = (1 - t) * 5.5; // crouch bounce fades out
        pose.leftLegAngle = -(1 - t) * 0.4;
        pose.rightLegAngle = -(1 - t) * 0.4;
        pose.leftArmAngle = (1 - t) * -0.3;
        pose.rightArmAngle = (1 - t) * -0.3;
      }
      pose.capeWave = progress * pi2 * 1.5;
      break;
    }

    case 'attack': {
      const isFlipped = direction >= 5;
      const dir = isFlipped ? 8 - direction : direction;
      const isSE = dir === 1;
      const isNE = dir === 3;

      if (attackStyle === 'ranged') {
        // Gandalf staff slam & Harry Potter wand flick animation
        if (progress < 0.4) {
          const t = progress / 0.4;
          // Wind-up: Right arm raises high overhead, body twists and leans back dramatically
          if (dir === 0) { // South
            pose.rightArmAngle = t * -2.4; // high up
            pose.weaponSwing = -t * 0.4;
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.torsoY = t * 2;
          } else if (dir === 2) { // East
            pose.rightArmAngle = t * -2.2;
            pose.weaponSwing = -t * 0.6;
            pose.torsoAngle = -t * 0.25; // lean back
            pose.torsoX = -t * 5;
            pose.torsoY = t * 1;
          } else if (dir === 4) { // North (Back) - starts low preparing to cast up
            pose.rightArmAngle = t * -0.5;
            pose.weaponSwing = -t * 0.4;
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.torsoY = t * 2;
          } else if (isSE) { // SE diagonal — forward-leaning cast prep
            pose.rightArmAngle = t * -0.6;
            pose.weaponSwing = -t * 0.5;
            pose.torsoAngle = -t * 0.15;
            pose.torsoX = -t * 3;
            pose.torsoY = t * 1.5;
          } else { // NE diagonal — upward-leaning cast prep
            pose.rightArmAngle = t * -0.4;
            pose.weaponSwing = -t * 0.35;
            pose.torsoAngle = -t * 0.06;
            pose.torsoX = -t * 1.5;
            pose.torsoY = t * 1.0;
          }
          pose.leftArmAngle = t * 0.6; // balancing arm
        } else if (progress < 0.65) {
          const t = (progress - 0.4) / 0.25;
          const easeRelease = Math.sin(t * Math.PI / 2);
          
          pose.leftArmAngle = 0.6 - (easeRelease * 1.2); // pull back

          // Release: Snap right arm forward, lunge body forward sharply
          if (dir === 0) { // South (Cast down/front)
            pose.rightArmAngle = -2.4 + (easeRelease * 3.4); // point down-forward
            pose.weaponSwing = -0.4 + (easeRelease * 0.8);
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.torsoY = 2 + (easeRelease * 3); // drop down into stance
          } else if (dir === 2) { // East (Cast forward)
            pose.rightArmAngle = -2.2 + (easeRelease * 3.55); // point straight forward (1.35 rad)
            pose.weaponSwing = -0.6 + (easeRelease * 0.9);
            pose.torsoAngle = -0.25 + (easeRelease * 0.5); // twist forward
            pose.torsoX = -5 + (easeRelease * 12); // lunge forward
            pose.torsoY = 1 - (Math.sin(t * Math.PI) * 1.5);
          } else if (dir === 4) { // North (Cast up)
            pose.rightArmAngle = -0.5 - (easeRelease * 2.3); // snaps up to -2.8 rad (overhead/up)
            pose.weaponSwing = -0.4 + (easeRelease * 0.8);
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.torsoY = 2 + (easeRelease * 3);
          } else if (isSE) { // SE Diagonal — forward-upward cast
            pose.rightArmAngle = -0.6 - (easeRelease * 2.2);
            pose.weaponSwing = -0.5 + (easeRelease * 0.85);
            pose.torsoAngle = -0.15 + (easeRelease * 0.35);
            pose.torsoX = -3 + (easeRelease * 7.5);
            pose.torsoY = 1.5 - (Math.sin(t * Math.PI) * 1.0);
          } else { // NE Diagonal — upward-backward cast
            pose.rightArmAngle = -0.4 - (easeRelease * 1.8);
            pose.weaponSwing = -0.35 + (easeRelease * 0.7);
            pose.torsoAngle = -0.06 + (easeRelease * 0.12);
            pose.torsoX = -1.5 + (easeRelease * 3.0);
            pose.torsoY = 1.0 - (Math.sin(t * Math.PI) * 0.8);
          }
        } else if (progress < 0.8) {
          // Hold casting stance for impact (progress 0.65 to 0.8)
          pose.leftArmAngle = -0.6;
          
          if (dir === 0) {
            pose.rightArmAngle = 1.0;
            pose.weaponSwing = 0.4;
            pose.torsoY = 5;
          } else if (dir === 2) {
            pose.rightArmAngle = 1.35;
            pose.weaponSwing = 0.3;
            pose.torsoAngle = 0.25;
            pose.torsoX = 7;
          } else if (dir === 4) {
            pose.rightArmAngle = -2.8; // hold overhead
            pose.weaponSwing = 0.4;
            pose.torsoY = 5;
          } else if (isSE) {
            pose.rightArmAngle = -2.8;
            pose.weaponSwing = 0.35;
            pose.torsoAngle = 0.2;
            pose.torsoX = 4.5;
          } else { // NE
            pose.rightArmAngle = -2.5;
            pose.weaponSwing = 0.3;
            pose.torsoAngle = 0.08;
            pose.torsoX = 2.0;
          }
        } else {
          // Recovery (progress 0.8 to 1.0)
          const t = (progress - 0.8) / 0.2;
          const easeReturn = Math.sin(t * Math.PI / 2);
          pose.leftArmAngle = -0.6 + (easeReturn * 0.7);

          if (dir === 0) {
            pose.rightArmAngle = 1.0 - (easeReturn * 1.1);
            pose.weaponSwing = 0.4 - (easeReturn * 0.4);
            pose.torsoY = 5 - (easeReturn * 5);
          } else if (dir === 2) {
            pose.rightArmAngle = 1.35 - (easeReturn * 1.45);
            pose.weaponSwing = 0.3 - (easeReturn * 0.3);
            pose.torsoAngle = 0.25 - (easeReturn * 0.25);
            pose.torsoX = 7 - (easeReturn * 7);
          } else if (dir === 4) {
            pose.rightArmAngle = -2.8 + (easeReturn * 2.7);
            pose.weaponSwing = 0.4 - (easeReturn * 0.4);
            pose.torsoY = 5 - (easeReturn * 5);
          } else if (isSE) {
            pose.rightArmAngle = -2.8 + (easeReturn * 2.7);
            pose.weaponSwing = 0.35 - (easeReturn * 0.35);
            pose.torsoAngle = 0.2 - (easeReturn * 0.2);
            pose.torsoX = 4.5 - (easeReturn * 4.5);
          } else { // NE
            pose.rightArmAngle = -2.5 + (easeReturn * 2.4);
            pose.weaponSwing = 0.3 - (easeReturn * 0.3);
            pose.torsoAngle = 0.08 - (easeReturn * 0.08);
            pose.torsoX = 2.0 - (easeReturn * 2.0);
          }
        }
      } else {
        // Melee slash animation (direction-aware, SE and NE differentiated)
        const isSE = dir === 1; // SE = south-leaning diagonal
        const isNE = dir === 3; // NE = north-leaning diagonal

        if (progress < 0.35) {
          const t = progress / 0.35;
          pose.torsoY = t * 1;
          pose.leftArmAngle = t * 0.5;

          if (dir === 0) { // South (Front) - Overhead slam prep
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.rightArmAngle = t * -2.6;
            pose.weaponSwing = -t * 0.8;
          } else if (dir === 2) { // East (Profile) - Heavy axe slash prep
            pose.torsoAngle = -t * 0.22;
            pose.torsoX = -t * 4;
            pose.rightArmAngle = t * -2.6;
            pose.weaponSwing = -t * 1.1;
          } else if (dir === 4) { // North (Back) - starts low preparing to slash up
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.rightArmAngle = t * -0.6;
            pose.weaponSwing = -t * 0.4;
          } else if (isSE) { // SE diagonal — closer to south, heavier prep
            pose.torsoAngle = -t * 0.12;
            pose.torsoX = -t * 1.5;
            pose.rightArmAngle = t * -2.4;
            pose.weaponSwing = -t * 0.85;
          } else { // NE diagonal — closer to north, upward prep
            pose.torsoAngle = -t * 0.08;
            pose.torsoX = -t * 1.0;
            pose.rightArmAngle = t * -1.4;
            pose.weaponSwing = -t * 0.55;
          }
        } else if (progress < 0.6) {
          const t = (progress - 0.35) / 0.25;
          const easeSwing = Math.sin(t * Math.PI / 2);
          pose.leftArmAngle = 0.5 - (easeSwing * 0.8);

          if (dir === 0) { // South (Front) - Slam down
            pose.torsoY = 1 + (easeSwing * 2);
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.rightArmAngle = -2.6 + (easeSwing * 3.8);
            pose.weaponSwing = -0.8 + (easeSwing * 2.6);
          } else if (dir === 2) { // East (Profile) - Boom lunge slash!
            pose.torsoAngle = -0.22 + (easeSwing * 0.50);
            pose.torsoX = -4 + (easeSwing * 12);
            pose.torsoY = 1 + (easeSwing * 3);
            pose.rightArmAngle = -2.6 + (easeSwing * 4.0);
            pose.weaponSwing = -1.1 + (easeSwing * 3.1);
          } else if (dir === 4) { // North (Back) - Overhead slash up
            pose.torsoY = 1 + (easeSwing * 2);
            pose.torsoAngle = 0;
            pose.torsoX = 0;
            pose.rightArmAngle = -0.6 - (easeSwing * 2.2);
            pose.weaponSwing = -0.4 + (easeSwing * 2.2);
          } else if (isSE) { // SE diagonal — forward-down slash
            pose.torsoAngle = -0.12 + (easeSwing * 0.30);
            pose.torsoX = -1.5 + (easeSwing * 6.0);
            pose.torsoY = 1 + (easeSwing * 2.5);
            pose.rightArmAngle = -2.4 + (easeSwing * 3.7);
            pose.weaponSwing = -0.85 + (easeSwing * 2.75);
          } else { // NE diagonal — upward-back slash
            pose.torsoAngle = -0.08 + (easeSwing * 0.16);
            pose.torsoX = -1.0 + (easeSwing * 2.5);
            pose.torsoY = 1 + (easeSwing * 1.5);
            pose.rightArmAngle = -1.4 - (easeSwing * 1.6);
            pose.weaponSwing = -0.55 + (easeSwing * 1.95);
          }
        } else {
          const t = (progress - 0.6) / 0.4;
          const easeReturn = Math.sin(t * Math.PI / 2);
          pose.leftArmAngle = -0.3 + (easeReturn * 0.4);

          if (dir === 0) {
            pose.rightArmAngle = 1.2 - (easeReturn * 1.3);
            pose.weaponSwing = 1.8 - (easeReturn * 1.8);
            pose.torsoY = 3 - (easeReturn * 3);
          } else if (dir === 2) {
            pose.rightArmAngle = 1.4 - (easeReturn * 1.5);
            pose.weaponSwing = 2.0 - (easeReturn * 2.0);
            pose.torsoAngle = 0.28 - (easeReturn * 0.28);
            pose.torsoX = 8 - (easeReturn * 8);
            pose.torsoY = 4 - (easeReturn * 4);
          } else if (dir === 4) {
            pose.rightArmAngle = -2.8 + (easeReturn * 2.7);
            pose.weaponSwing = 1.8 - (easeReturn * 1.8);
            pose.torsoY = 3 - (easeReturn * 3);
          } else if (isSE) {
            pose.rightArmAngle = 1.3 - (easeReturn * 1.4);
            pose.weaponSwing = 1.9 - (easeReturn * 1.9);
            pose.torsoAngle = 0.18 - (easeReturn * 0.18);
            pose.torsoX = 4.5 - (easeReturn * 4.5);
            pose.torsoY = 3.5 - (easeReturn * 3.5);
          } else { // NE
            pose.rightArmAngle = -3.0 + (easeReturn * 2.9);
            pose.weaponSwing = 1.4 - (easeReturn * 1.4);
            pose.torsoAngle = 0.08 - (easeReturn * 0.08);
            pose.torsoX = 1.5 - (easeReturn * 1.5);
            pose.torsoY = 2.5 - (easeReturn * 2.5);
          }
        }
      }
      pose.capeWave = progress * pi2 * 1.8;
      break;
    }
    case 'hurt': {
      const t = progress;
      const recoil = Math.sin(t * Math.PI);
      pose.torsoX = -recoil * 8;
      pose.torsoY = recoil * 3;
      pose.torsoAngle = -recoil * 0.25;
      pose.headAngle = recoil * 0.15;
      pose.leftArmAngle = -0.6 - recoil * 0.8;
      pose.rightArmAngle = 0.6 + recoil * 0.8;
      pose.leftLegAngle = -recoil * 0.2;
      pose.rightLegAngle = recoil * 0.1;
      pose.capeWave = progress * pi2 * 1.5;
      break;
    }
    case 'die': {
      const t = Math.min(1.0, progress / 0.75);
      const easeCollapse = t * t;
      pose.torsoY = easeCollapse * 40;
      pose.torsoX = -easeCollapse * 12;
      pose.torsoAngle = -easeCollapse * (Math.PI / 2);
      pose.headAngle = -easeCollapse * 0.15;
      pose.headY = easeCollapse * 2;
      pose.leftArmAngle = easeCollapse * (Math.PI * 0.4);
      pose.rightArmAngle = -easeCollapse * (Math.PI * 0.4);
      pose.leftLegAngle = -easeCollapse * 0.25;
      pose.rightLegAngle = easeCollapse * 0.15;
      pose.capeWave = 0;
      break;
    }
  }

  pose.animation = animation;
  return pose;
}
