import '../../polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { getRefineryCycles } from '@parsers/world-3/refinery';
import { getSkillExpMulti } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr
// (Wind Walker). latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // PostOfficeINFO("BonusAmount", box, 0 | 1 | 2) for the logged-in character
  boxBonuses: {
    Civil_War_Memory_Box: [400, 8.478260869565217, 6],
    Locally_Sourced_Organs: [201, 37.5, 18],
    Magician_Starterpack: [134, 37.5, 10.2],
    Box_of_Unwanted_Stats: [100, 112.5, 18.51063829787234],
    Dwarven_Supplies: [0, 0, 0],
    Blacksmith_Box: [33.333333333333336, 48.91304347826087, 20],
    Taped_Up_Timber: [0, 0, 0],
    Carepack_From_Mum: [15.333333333333334, 19.565217391304348, 18],
    Sealed_Fishheads: [0, 0, 0],
    Potion_Package: [46.666666666666664, 42.857142857142854, 30],
    Bug_Hunting_Supplies: [0, 0, 0],
    Non_Predatory_Loot_Box: [33.333333333333336, 93.75, 39],
    Deaths_Storage_Unit: [14.666666666666666, 10.714285714285714, 9],
    Utilitarian_Capsule: [3.3333333333333335, 9.782608695652174, 23.4],
    Lazzzy_Lootcrate: [6.923076923076923, 5.212765957446808, 0],
    Science_Spare_Parts: [1600, 28.571428571428573, 18],
    Trapping_Lockbox: [33.333333333333336, 32.608695652173914, 27],
    Construction_Container: [100, 48.91304347826087, 150],
    Crate_of_the_Creator: [33.333333333333336, 130.43478260869566, 54],
    Chefs_Essentials: [1600, 39.130434782608695, 52.8],
    Myriad_Crate: [11.669336439978641, 24.437832300863374, 1.482685581991035],
    "Scurvy_C'arr'ate": [5.333333333333333, 150, 15],
    Box_of_Gosh: [0, 0, 0],
    Gaming_Lootcrate: [0, 0, 0]
  },
  // Divinity("DivPerHr_EXP", 5) with DNSM.BoxRewards 22a / 22c set to the Box of Gosh values at 800 points
  // (50 / 18, restored after): the game reads 22c, so 22a alone left the rate unchanged
  divinityExpWithGoshAt800: 3409792.411317904,
  // DNSM.AlchVials.BoxPoints, the Box points vial term of PostOfficeINFO("AvailablePoints")
  boxPointsVial: 87.36
};

const { account, characters } = parseFixture(latest);
const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
const withGoshAt = (character, level) => ({
  ...character,
  postOffice: {
    ...character.postOffice,
    boxes: character.postOffice.boxes.map((box) => box.name === 'Box_of_Gosh' ? { ...box, level } : box)
  }
});

describe('post office verified against the live game', () => {
  it.each(Object.entries(GAME.boxBonuses))('%s bonuses', (boxName, values) => {
    values.forEach((value, bonusIndex) => within(getPostOfficeBonus(hunter.postOffice, boxName, bonusIndex), value));
  });

  it('divinity EXP takes the Box of Gosh third bonus', () => {
    const character = withGoshAt(hunter, 800);
    const { value } = getSkillExpMulti('divinity', character, characters, account, getMaxDamage(character, characters, account));
    within(value, GAME.divinityExpWithGoshAt800);
  });

  // The saved DeliveryBoxMisc only refreshes when the post office opens; the game rebuilds it on opening
  it('unspent points follow PostOfficeINFO("AvailablePoints")', () => {
    const { DeliveryBoxComplete, DeliveryBoxStreak } = account.currencies;
    const options = account.accountOptions;
    const spent = Object.keys(GAME.boxBonuses).reduce((sum, boxName) =>
      sum + hunter.postOffice.boxes.find(({ name }) => name === boxName).level, 0);
    const game = Math.round(DeliveryBoxComplete + DeliveryBoxStreak + (options[347] + GAME.boxPointsVial + options[131]) - spent);
    expect(hunter.postOffice.unspentPoints).toBe(game);
  });
});

describe('Magician Starterpack cooldown bonus', () => {
  afterEach(() => vi.useRealTimers());

  // The game stores ceil(cooldown / AtkCooldownDEC) when the skill is cast and counts that down, so the
  // saved AtkCD already carries the box's reduction
  it('is not applied again to the saved refinery throttle cooldown', () => {
    const squire = characters.find(({ name }) => name === 'MortaStir');
    expect(getPostOfficeBonus(squire.postOffice, 'Magician_Starterpack', 2)).toBeGreaterThan(0);
    const savedCooldown = 1000;
    vi.useFakeTimers({ now: squire.afkTime });
    const { squiresCooldowns } = getRefineryCycles(account, [{ ...squire, cooldowns: { 130: savedCooldown } }], squire.afkTime);
    expect(squiresCooldowns).toEqual([{ name: squire.name, cooldown: squire.afkTime + savedCooldown * 1000 }]);
  });
});
