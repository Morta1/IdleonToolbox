import { describe, it, expect } from 'vitest';
import { fieldLabel, formatValue } from '../../utility/wiki/history';

describe('fieldLabel', () => {
  it.each([
    // The game fields a reader could not decode. "UQ1txt" is an item's special bonus and is on 92 of
    // the changes in the archive: the raw name would make the most common line the least readable.
    ['UQ1txt', 'Bonus'],
    ['UQ1val', 'Bonus value'],
    ['MonsterHPTotal', 'Health'],
    ['ExpGiven', 'EXP'],
    ['RespawnTime', 'Respawn time'],
    ['materials', 'Recipe'],
    // An unmapped field survives as words rather than falling through as raw SCREAMING_SNAKE.
    ['BACKUP_ENERGY', 'Backup Energy'],
    ['desc_line1', 'Description'],
    // A talent change is reported as the part of the talent that moved. lvlUpText is the per-level
    // line the game shows under the talent; "Lvl Up Text" is the raw key wearing a hat.
    ['description', 'Effect'],
    ['lvlUpText', 'Per level bonus'],
    ['name', 'Name'],
    // x and y are the talent's two bonuses (`{` takes x, `}` takes y), named the way UQ1/UQ2 are.
    ['x1', 'Value'],
    ['x2', 'Value scaling'],
    ['y1', 'Second value'],
    ['y2', 'Second value scaling'],
    // camelCase has no underscore to split on: fieldLabel('sellPrice') used to be 'sellprice'.
    ['sellPrice', 'Sell Price'],
    ['itemQuantity', 'Item Quantity'],
    // A lone lowercase word is capitalized, or it renders as "effect: ..." under Title Case headings.
    ['effect', 'Effect'],
    ['bonus', 'Bonus'],
    // Deliberate, and pinned so it is not "fixed" by accident: the stat abbreviations read fine as words.
    ['STR', 'Str'],
    ['AGI', 'Agi'],
    ['WIS', 'Wis'],
    ['LUK', 'Luk']
  ])('labels %s as %s', (field, label) => {
    expect(fieldLabel(field)).toBe(label);
  });
});

describe('formatValue', () => {
  it.each([
    // A recipe renders as its materials rather than as JSON.
    [[{ itemName: 'Frog_Leg', itemQuantity: 6 }, { itemName: 'Thread', itemQuantity: 10 }], 'Frog Leg x6, Thread x10'],
    ['%_DAMAGE_MULTI', '% DAMAGE MULTI'],
    [3649200, '3,649,200'],
    // monster:w7b8's health goes 3e+31 to 5e+33, which toLocaleString renders as a 40 character
    // comma string. notateNumber is what the rest of the site uses.
    [3e31, '3e31'],
    [5e33, '5e33'],
    [300000000000, '300B'],
    // notateNumber floors anything under 100 (0.2 would print as "0") and rounds 4,200 to "4.2K",
    // so exact digits stay below the threshold.
    [25, '25'],
    [4200, '4,200'],
    [0.2, '0.2'],
    // The archive's most common shape: the game's zero placeholder becoming a real value.
    [0, 'none'],
    // The game's "{" and "}" template slots hold a bonus from another field, with no reliable value
    // to fill them in a diff row, so they are dropped rather than leaked as broken markup.
    ['{15%_Hat_Rack_Bonus_Multi', '15% Hat Rack Bonus Multi'],
    ['+{%_Pet_Team_Damage', '+% Pet Team Damage'],
    ['+{%_Mob_Team_Damage', '+% Mob Team Damage'],
    ['+{%_chance_&_+}%_range', '+% chance & +% range'],
    ['{}%_Class_EXP_Multi', '% Class EXP Multi'],
    // A mid-sentence slot leaves two spaces where the number was, collapsed so it is not a typo.
    ['Get_unlimited_entries_to_the_Mob_Arena_for_{_mins._PASSIVE:_+}%_Mob_DMG',
      'Get unlimited entries to the Mob Arena for mins. PASSIVE: +% Mob DMG'],
    ['Backup_needed?_How_about_{x_Tachyon_Gain_and_}_less_kills_needed_to_charge_Arcane_Crystals',
      'Backup needed? How about x Tachyon Gain and less kills needed to charge Arcane Crystals']
  ])('formats %j as %s', (value, formatted) => {
    expect(formatValue(value)).toBe(formatted);
  });
});
