/**
 * Shared constants and helpers for Research grid and card views.
 */

export const SHAPE_COLORS = [
  { border: '#b39ddb', fill: '#b39ddb', tint: 'rgba(179, 157, 219, 0.25)' },
  { border: '#81d4fa', fill: '#81d4fa', tint: 'rgba(129, 212, 250, 0.25)' },
  { border: '#ffb74d', fill: '#ffb74d', tint: 'rgba(255, 183, 77, 0.25)' },
  { border: '#a5d6a7', fill: '#a5d6a7', tint: 'rgba(165, 214, 167, 0.25)' },
  { border: '#ef9a9a', fill: '#ef9a9a', tint: 'rgba(239, 154, 154, 0.25)' },
  { border: '#ce93d8', fill: '#ce93d8', tint: 'rgba(206, 147, 216, 0.25)' },
];

export const getShapeColor = (shapeIndex) =>
  SHAPE_COLORS[Math.min(shapeIndex ?? 0, SHAPE_COLORS.length - 1)] ?? SHAPE_COLORS[0];

export const hasShape = (sq) => sq != null && sq.placementShapeIndex != null;
