import { ALL_SECTIONS, normalizeSectionOrder } from '@utility/dashboard/sectionOrder';

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
