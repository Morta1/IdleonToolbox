import { expect, it } from 'vitest';
import { fitSprite, unionBounds } from '@utility/spriteBounds';

it.each([
  ['copper ore', [72, 72, 19, 25, 53, 59], [76.235, -18.118, -24.471]],
  ['purple tachyon', [36, 36, 7, 12, 29, 34], [58.909, -9.455, -17.636]]
])('places %s as the Icons board does in a 40 px box', (_, bounds, [side, left, top]) => {
  expect(fitSprite(bounds, 40)).toEqual({
    width: expect.closeTo(side, 2),
    height: expect.closeTo(side, 2),
    left: expect.closeTo(left, 2),
    top: expect.closeTo(top, 2)
  });
});

it('a frame and its sprite share the union of what they draw, on one canvas only', () => {
  expect([
    unionBounds([57, 57, 6, 5, 48, 51], [57, 57, 8, 8, 49, 49]),
    unionBounds([57, 57, 6, 5, 48, 51], [43, 43, 8, 4, 35, 40])
  ]).toEqual([[57, 57, 6, 5, 49, 51], null]);
});
