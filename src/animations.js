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
export function getAnimationPose(animation, progress) {
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

      // Cape waves softly
      pose.capeWave = progress * pi2;
      break;
    }

    case 'walk': {
      // Alternating legs swings (Max 30 degrees = 0.52 rad)
      const swing = Math.sin(progress * pi2) * 0.45;
      pose.leftLegAngle = swing;
      pose.rightLegAngle = -swing; // 180 degrees phase difference

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
      // 0.0 - 0.35: Wind-up/Raise sword
      // 0.35 - 0.6: Slash/Swing down fast!
      // 0.6 - 1.0: Recover/Retract
      
      if (progress < 0.35) {
        const t = progress / 0.35; // 0 to 1
        // Body leans back, front arm winds up high back
        pose.torsoAngle = -t * 0.12;
        pose.torsoX = -t * 3;
        pose.torsoY = t * 1;
        pose.rightArmAngle = t * -1.8; // Rotate hand back
        pose.weaponSwing = -t * 0.5; // Rotate sword back relative to hand
        pose.leftArmAngle = t * 0.5; // Left balancing arm sway
      } else if (progress < 0.6) {
        const t = (progress - 0.35) / 0.25; // 0 to 1 (Fast swing phase)
        // High quality slash arc easing
        const easeSwing = Math.sin(t * Math.PI / 2); // fast snap
        
        pose.torsoAngle = -0.12 + (easeSwing * 0.32); // Torso twists forward (up to 0.2 rad)
        pose.torsoX = -3 + (easeSwing * 9); // Body lunges forward
        pose.torsoY = 1 - (Math.sin(t * Math.PI) * 1.5);
        
        // Front arm slashes all the way forward
        pose.rightArmAngle = -1.8 + (easeSwing * 3.0); // Swings from -1.8 rad to +1.2 rad
        pose.weaponSwing = -0.5 + (easeSwing * 2.2); // Sword snaps forward
        pose.leftArmAngle = 0.5 - (easeSwing * 0.8);
      } else {
        const t = (progress - 0.6) / 0.4; // 0 to 1
        // Smooth return to rest state
        const easeReturn = Math.sin(t * Math.PI / 2);
        pose.torsoAngle = 0.20 - (easeReturn * 0.20);
        pose.torsoX = 6 - (easeReturn * 6);
        pose.rightArmAngle = 1.2 - (easeReturn * 1.3); // returns to -0.1
        pose.weaponSwing = 1.7 - (easeReturn * 1.7);
        pose.leftArmAngle = -0.3 + (easeReturn * 0.4);
      }
      pose.capeWave = progress * pi2 * 1.8;
      break;
    }
  }

  return pose;
}
