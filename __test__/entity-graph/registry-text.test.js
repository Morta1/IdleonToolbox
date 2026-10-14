import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { GLYPHS, dropReadout, sentence, tidy, titleCase } from '../../scripts/entity-graph/registry/text.mjs';

describe('registry text helpers', () => {
  // `@` is the game's line break; it becomes a sentence break unless the sentence already ended.
  it.each([
    ['Line_one@Line_two', 'Line_one._Line_two'],
    ['Done.@Next', 'Done._Next'],
    ['船Sail__away_', 'Sail_away'],
    ['Twitch.tv/_Lava贫Flame2', 'Twitch.tv/_LavaFlame2'],
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
    ['+{%_MOVE_SPEED', '+{%_Move_Speed'],
    // The sigil VIP_PARCHMENT: an acronym stays in capitals.
    ['VIP_PARCHMENT', 'VIP_Parchment']
  ])('title-cases %s', (input, expected) => {
    expect(titleCase(input)).toBe(expected);
  });

  // The Lab ends three bonuses on "@ - @ Total Bonus: {%"; the separator has to go with the readout.
  it.each([
    ['Pixels_are_worth_more_@_-_@_Total_Bonus:_{%', 'Pixels_are_worth_more'],
    ['Make_more_@_Total_Bonus:_{x', 'Make_more'],
    ['No_readout_at_all', 'No_readout_at_all']
  ])('drops the readout tail of %s', (input, expected) => {
    expect(dropReadout(input)).toBe(expected);
    expect(tidy(dropReadout(input))).not.toMatch(/-$/);
  });

  // The Lab separator fix must not move any text that already read fine: compare every atom against the old regex.
  it('leaves every atom description exactly as the previous readout regex did', () => {
    const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
    const previous = (text) => text.replace(/(?:_*@)*_*Total_Bonus:.*$/i, '');
    expect(data.atomsInfo.length).toBeGreaterThan(0);
    expect(data.atomsInfo.map((atom) => dropReadout(atom.desc))).toEqual(data.atomsInfo.map((atom) => previous(atom.desc)));
  });

  it('leaves no readout or stray separator on any Lab bonus', () => {
    const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
    const texts = data.labBonuses.map((bonus) => tidy(dropReadout(bonus.description)));
    expect(texts.filter((text) => /@|Total_Bonus|_-$/.test(text))).toEqual([]);
  });

  it('strips every glyph the game font draws', () => {
    expect('贫Twitch船'.replace(GLYPHS, '')).toBe('Twitch');
  });
});
