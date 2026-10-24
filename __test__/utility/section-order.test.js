import { ALL_SECTIONS, moveSection, normalizeSectionOrder } from '@utility/dashboard/sectionOrder';

describe('normalizeSectionOrder', () => {
  it.each([
    ['never saved', undefined, ALL_SECTIONS],
    ['not an array', 'timers', ALL_SECTIONS],
    ['full custom order', ['timers', 'goals', 'characters', 'account'], ['timers', 'goals', 'characters', 'account']],
    ['unknown ids and duplicates dropped', ['timers', 'nope', 'timers', 'goals'], ['timers', 'goals', 'account', 'characters']],
    ['missing ids appended in default order', ['characters'], ['characters', 'goals', 'account', 'timers']]
  ])('%s', (_name, saved, expected) => {
    expect(normalizeSectionOrder(saved)).toEqual(expected);
  });
});

describe('moveSection', () => {
  it.each([
    ['Alt+ArrowRight moves one slot right', 'account', 1, ['goals', 'characters', 'account', 'timers']],
    ['Alt+ArrowLeft at the start stays put', 'goals', -1, ALL_SECTIONS]
  ])('%s', (_name, id, step, expected) => {
    expect(moveSection(ALL_SECTIONS, id, step)).toEqual(expected);
  });
});
