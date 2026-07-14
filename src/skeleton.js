/**
 * ChromaForge 2D - Skeleton / IK Math
 * Pure geometry helpers for the two-segment limb rig (thigh+shin, upperArm+forearm).
 * No ctx, no DOM - safe to unit-verify standalone.
 *
 * Coordinate convention matches character.js: within a limb's local frame, angle 0
 * points "down" (away from the root, toward the ground/hand), and angles are measured
 * via atan2(x, y) (not the usual atan2(y, x)) - this mirrors projectLimbSwing()'s
 * existing convention so hip/shoulder angles compose the same way as before.
 */

// Ratios applied to today's derived armLength/legLength (character.js ~line 189-191).
// Thigh is kept slightly longer than shin, matching typical human proportions.
export const LIMB_PROPORTIONS = {
  thighRatio: 0.55,
  shinRatio: 0.45,
  upperArmRatio: 0.5,
  forearmRatio: 0.5
};

export function getLimbSegments(totalLength, upperRatio, lowerRatio) {
  return {
    upper: totalLength * upperRatio,
    lower: totalLength * lowerRatio
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Analytic 2-bone IK (law of cosines).
 * @param {number} targetX - target X in the root's local, unrotated frame
 * @param {number} targetY - target Y in the root's local, unrotated frame (0 angle = straight toward this axis)
 * @param {number} len1 - first segment length (thigh / upper arm)
 * @param {number} len2 - second segment length (shin / forearm)
 * @param {number} bendDir - +1 or -1, which way the joint bends; flip if the knee/elbow looks reversed
 * @returns {{angle1: number, angle2: number, reach: number}} angle1 = root joint angle,
 *   angle2 = second joint angle *relative* to the first segment's own rotation (matches
 *   character.js's nested ctx.rotate() composition).
 */
export function solveTwoBoneIK(targetX, targetY, len1, len2, bendDir = 1) {
  const EPS = 0.01;
  const maxReach = len1 + len2 - EPS;
  const minReach = Math.abs(len1 - len2) + EPS;

  const rawDist = Math.hypot(targetX, targetY);
  const d = clamp(rawDist, minReach, maxReach);

  const angleToTarget = Math.atan2(targetX, targetY);

  const kneeInterior = Math.acos(
    clamp((len1 * len1 + len2 * len2 - d * d) / (2 * len1 * len2), -1, 1)
  );
  const angle2 = bendDir * (Math.PI - kneeInterior);

  const hipOffset = Math.acos(
    clamp((len1 * len1 + d * d - len2 * len2) / (2 * len1 * d), -1, 1)
  );
  const angle1 = angleToTarget - bendDir * hipOffset;

  return { angle1, angle2, reach: d };
}
