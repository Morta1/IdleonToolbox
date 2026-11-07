import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { armoryUpgrades, orbletMarket as orbletMarketCatalog } from '@website-data';
import { getRoyalGuardian } from '@parsers/class-specific/royalGuardian';

describe('Royal Armory and Orblet Market tooltips render fully', () => {
  // The empty account still renders the full catalog (site-wide contract), and every substitution is a plain formula over
  // that catalog + a zeroed account, so this exercises the same code path a populated save would.
  const { armory, orbletMarket } = getRoyalGuardian(undefined, {}, []);

  // { and } are the shared bonus tokens, $ the per-row ones (the game writes "$" alone for GLORIFICATION), and @ the line break
  it('never leaves a template token in a description, in either catalog', () => {
    const survivors = [...armory.upgrades, ...orbletMarket]
      .filter(({ description }) => /[{}$@]/.test(description))
      .map(({ index, description }) => `${index}: ${description}`);
    expect(survivors).toEqual([]);
  });

  it('breaks the line at the game\'s "@" instead of printing it', () => {
    expect(armory.upgrades.find((upgrade) => upgrade.index === 58).description)
      .toBe('Active_kills_now_count_towards_clearing_monsters_to_build_outposts!_\n_Also,_each_kill_has_a_0%_chance_to_count_as_extra!');
  });

  it('resolves the "Royal_Marble" description into a real 1-in-N drop chance', () => {
    // An empty account has no bonuses at all, so the chance is the game's bare 1 / 1000.
    expect(armory.upgrades.find((upgrade) => upgrade.index === 41).description).toContain('1_in_1,000');
  });

  it('GLORIFICATION, whose $ is the open outpost in the game, reads what the upgrade does', () => {
    expect(orbletMarket.find((upgrade) => upgrade.index === 4).description).toBe('10%_chance_to_Glorify_the_current_Outpost');
  });

  // ^, & and | are the other placeholders world-7/research.ts substitutes for its grid squares. Neither raw catalog uses them:
  // if a future patch adds one, this catches it before it ships as another silent unsubstituted token.
  it('neither raw catalog uses ^, &, or | as a template placeholder', () => {
    const offenders = [...armoryUpgrades, ...orbletMarketCatalog].filter((row) => /[\^&|]/.test(row.description ?? ''));
    expect(offenders).toEqual([]);
  });
});
