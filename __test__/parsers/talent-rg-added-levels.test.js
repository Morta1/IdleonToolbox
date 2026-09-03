import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { applyTalentAddedLevels, capRoyalGuardianAddedLevels, isRoyalGuardianTalent } from '@parsers/talents';

// game: AllTalentLV/AllTalentLVz seed their cap with 9999 and swap it for ArmoryUpgBonus(55) -
// Talent Reattainment - on talent ids 225-239, the Royal Guardian page:
//   Math.floor(Math.min(AllTalMaxCapFR, <summed added levels>) + AllTalMaxSUPERdn)
// Read out of the live client on 2026-09-03: AllTalentLVz('230|0') leaves DNSM.AllTalMaxCapFR at
// 300 (that account's Talent Reattainment level), AllTalentLVz('144|0') leaves it at 9999.
const NO_SUPER_TALENTS = { talents: [], bonus: 0 };

const makeTalent = (skillIndex, level) => ({ skillIndex, talentId: skillIndex, name: `T${skillIndex}`, level });

const applyFlat = (talents, addedLevels, cap, superTalentsInfo = NO_SUPER_TALENTS) =>
  applyTalentAddedLevels(null, talents, addedLevels, superTalentsInfo, 0, cap);

describe('Royal Guardian added levels cap', () => {
  it('marks only ids 225-239 as Royal Guardian talents', () => {
    expect(isRoyalGuardianTalent(225)).toBe(true);
    expect(isRoyalGuardianTalent(239)).toBe(true);
    expect(isRoyalGuardianTalent(224)).toBe(false);
    expect(isRoyalGuardianTalent(240)).toBe(false);
    // BUILT_DIFFERENT sits on the Royal Guardian page but keeps the id of an older talent
    expect(isRoyalGuardianTalent(203)).toBe(false);
  });

  it('caps a Royal Guardian talent and leaves every other talent alone', () => {
    expect(capRoyalGuardianAddedLevels(230, 237, 0)).toBe(0);
    expect(capRoyalGuardianAddedLevels(230, 237, 50)).toBe(50);
    expect(capRoyalGuardianAddedLevels(230, 237, 300)).toBe(237);
    expect(capRoyalGuardianAddedLevels(144, 237, 0)).toBe(237);
    // no armory data parsed yet - the cap is unknown, not zero
    expect(capRoyalGuardianAddedLevels(230, 237, undefined)).toBe(237);
  });

  it('gives Royal Guardian talents no added levels without Talent Reattainment', () => {
    const talents = [makeTalent(225, 1), makeTalent(239, 396), makeTalent(203, 1), makeTalent(144, 1)];
    const [first, maxed, builtDifferent, other] = applyFlat(talents, 237, 0);

    expect(first.level).toBe(1);
    expect(maxed.level).toBe(396);
    expect(builtDifferent.level).toBe(238);
    expect(other.level).toBe(238);
  });

  it('hands out added levels up to the upgrade level', () => {
    const talents = [makeTalent(230, 10), makeTalent(144, 10)];

    expect(applyFlat(talents, 237, 50)[0].level).toBe(60);
    expect(applyFlat(talents, 237, 300)[0].level).toBe(247);
    expect(applyFlat(talents, 237, 50)[1].level).toBe(247);
  });

  it('adds the super talent bonus after the cap, like the game does', () => {
    const superTalentsInfo = { talents: [{ talentIndex: 230, presetIndex: 0 }], bonus: 121 };
    const [talent] = applyFlat([makeTalent(230, 1)], 237, 0, superTalentsInfo);

    expect(talent.level).toBe(122);
  });

  it('leaves a talent the player never touched at level 0', () => {
    expect(applyFlat([makeTalent(230, 0)], 237, 300)[0].level).toBe(0);
  });
});
