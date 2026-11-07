/**
 * Shared helpers for Research grid and card views. The shape colors are the theme's (palette.identity.researchShapes):
 * a shape's line, also the fill of its levelled cells, and its tint.
 */

export const getShapeColor = (theme, shapeIndex) => {
  const shapes = (theme.vars || theme).palette.identity.researchShapes;
  return shapes[Math.min(shapeIndex ?? 0, shapes.length - 1)] ?? shapes[0];
};

export const hasShape = (sq) => sq != null && sq.placementShapeIndex != null;
