import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { armoryUpgrades, orbletMarket as orbletMarketCatalog } from '@website-data';
import { getRoyalGuardian } from '@parsers/class-specific/royalGuardian';

// Task D9: the Royal Armory/Orblet Market descriptions render a "$" template token that, until
// this fix, was never substituted (32 of 83 armory tooltips, 1 of 10 orblet tooltips - one of them
// ("GLORIFICATION") was literally the single character "$"). Two ids are a deliberate, documented
// exception - see resolveArmoryDollarToken's comment in royalGuardian.ts and the task D9 report:
// - Orblet id 4 "GLORIFICATION" describes whichever outpost the game's live UI currently has open;
//   there is no single account-wide value, so it is left showing the raw "$" rather than a guess.
// Armory id 41 "Royal_Marble" WAS on this list: it needed ArcadeBonus(71) and EtcBonuses("107"),
// neither of which existed until 2.3.525 added them. Both are parsed now, so it resolves.
const KNOWN_UNRESOLVED_ARMORY_IDS = [];
const KNOWN_UNRESOLVED_ORBLET_IDS = [4];

describe('Royal Armory and Orblet Market tooltips render fully (task D9)', () => {
  // { and } are the shared bonus/multiplier tokens (already substituted before this task); every
  // catalog row that has one must come out of applyBonusTokens with it fully replaced.
  it('the { and } bonus tokens never survive rendering, in either catalog', () => {
    const { armory, orbletMarket } = getRoyalGuardian(undefined, {}, []);
    const survivors = [...armory.upgrades, ...orbletMarket]
      .filter((upgrade) => /[{}]/.test(upgrade.description))
      .map((upgrade) => upgrade.index);
    expect(survivors).toEqual([]);
  });

  // The empty account still renders the full catalog (site-wide contract), and every substitution
  // in resolveArmoryDollarToken is a plain formula over that catalog + a zeroed account, so this
  // exercises the same code path a populated save would.
  it('leaves no armory description with an unsubstituted "$", except the documented exception', () => {
    const { armory } = getRoyalGuardian(undefined, {}, []);
    const offenders = armory.upgrades
      .filter((upgrade) => upgrade.description.includes('$'))
      .map((upgrade) => upgrade.index);
    expect(offenders).toEqual(KNOWN_UNRESOLVED_ARMORY_IDS);
  });

  it('leaves no orblet description with an unsubstituted "$", except the documented exception', () => {
    const { orbletMarket } = getRoyalGuardian(undefined, {}, []);
    const offenders = orbletMarket
      .filter((upgrade) => upgrade.description.includes('$'))
      .map((upgrade) => upgrade.index);
    expect(offenders).toEqual(KNOWN_UNRESOLVED_ORBLET_IDS);
  });

  it('resolves the "Royal_Marble" description into a real 1-in-N drop chance', () => {
    const { armory } = getRoyalGuardian(undefined, {}, []);
    const marble = armory.upgrades.find((upgrade) => upgrade.index === 41);
    expect(marble.description).not.toContain('$');
    // An empty account has no bonuses at all, so the chance is the game's bare 1 / 1000.
    expect(marble.description).toContain('1_in_1,000');
  });

  it('the one still-unresolved orblet description is GLORIFICATION, not a fresh regression', () => {
    const { orbletMarket } = getRoyalGuardian(undefined, {}, []);
    const glorification = orbletMarket.find((upgrade) => upgrade.index === 4);
    expect(glorification.description).toBe('$');
  });

  // task D9 also checked whether ^, &, or | (the other placeholders world-7/research.ts substitutes
  // for its own {}/$/^ grid squares) appear anywhere in these two RAW catalogs - they do not, in
  // either the game's live data or this static export of it. If a future patch adds one, this
  // catches it before it ships as another silent unsubstituted token.
  it('neither raw catalog uses ^, &, or | as a template placeholder', () => {
    const rows = [...armoryUpgrades, ...orbletMarketCatalog];
    const offenders = rows.filter((row) => /[\^&|]/.test(row.description ?? ''));
    expect(offenders).toEqual([]);
  });
});
