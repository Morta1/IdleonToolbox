import { describe, expect, it } from 'vitest';
import { sentence, tidy, titleCase } from '../../scripts/entity-graph/registry/text.mjs';

describe('registry text helpers', () => {
  // `@` is the game's line break; it becomes a sentence break unless the sentence already ended.
  it.each([
    ['Line_one@Line_two', 'Line_one._Line_two'],
    ['Done.@Next', 'Done._Next'],
    ['船Sail__away_', 'Sail_away'],
    [undefined, '']
  ])('tidies %s', (input, expected) => {
    expect(tidy(input)).toBe(expected);
  });

  it.each([
    ['Hi', 'Hi.'],
    ['Hi!', 'Hi!']
  ])('ends %s as a sentence', (input, expected) => {
    expect(sentence(input)).toBe(expected);
  });

  // The game writes names in capitals (BASE_DAMAGE); the app's pages print them title-cased.
  it.each([
    ['BASE_DAMAGE', 'Base_Damage'],
    ['+{%_MOVE_SPEED', '+{%_Move_Speed']
  ])('title-cases %s', (input, expected) => {
    expect(titleCase(input)).toBe(expected);
  });
});
