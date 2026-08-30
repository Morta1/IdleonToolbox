import { describe, it, expect } from 'vitest';
import { ARCHIVE_START, CAVEAT, fieldLabel, formatValue } from '../../utility/wiki/history';

describe('fieldLabel', () => {
  // "UQ1txt" is the game's name for an item's special bonus, and it is on 92 of the changes in
  // the archive. Shipping the raw name would make the most common line the least readable.
  it('names the game fields a reader could not decode', () => {
    expect(fieldLabel('UQ1txt')).toBe('Bonus');
    expect(fieldLabel('UQ1val')).toBe('Bonus value');
    expect(fieldLabel('MonsterHPTotal')).toBe('Health');
    expect(fieldLabel('ExpGiven')).toBe('EXP');
    expect(fieldLabel('RespawnTime')).toBe('Respawn time');
    expect(fieldLabel('materials')).toBe('Recipe');
  });

  // A field with nothing to look up must survive readably rather than falling through as raw
  // SCREAMING_SNAKE.
  it('turns an unmapped field into words rather than dropping it', () => {
    expect(fieldLabel('BACKUP_ENERGY')).toBe('Backup Energy');
    expect(fieldLabel('desc_line1')).toBe('Description');
  });

  // A talent change is reported one level down, as the part of the talent that moved, so these
  // seven sub-keys are what a talent row is labelled by. lvlUpText is the per-level line the game
  // shows under the talent; "Lvl Up Text" is the raw key wearing a hat.
  it('names the parts of a talent a reader sees in game', () => {
    expect(fieldLabel('description')).toBe('Effect');
    expect(fieldLabel('lvlUpText')).toBe('Per level bonus');
    expect(fieldLabel('name')).toBe('Name');
  });

  // x and y are the talent's two bonuses: `{` in the description takes the x value and `}` the y.
  // Each is a pair, and the pair follows the same convention UQ1/UQ2 already set.
  it('names the four curve parameters as the two bonuses they describe', () => {
    expect(['x1', 'x2', 'y1', 'y2'].map(fieldLabel))
      .toEqual(['Value', 'Value scaling', 'Second value', 'Second value scaling']);
  });

  // A plain camelCase field has no underscore to split on, so it used to arrive as one lowercase
  // "word" with nothing capitalized: fieldLabel('sellPrice') was 'sellprice'. Both fields are on
  // Task 1's FIELD_ALLOW census, so they will render the moment either one changes.
  it('splits a camelCase field into words rather than lowercasing it whole', () => {
    expect(fieldLabel('sellPrice')).toBe('Sell Price');
    expect(fieldLabel('itemQuantity')).toBe('Item Quantity');
  });

  // effect and bonus are the third and fourth most common fields in the archive, 49 rows between
  // them, and they have no camelCase or underscore boundary to split on. Without a capital they
  // rendered as "effect: ..." under the page's Title Case headings.
  it('capitalizes a lone lowercase word', () => {
    expect(fieldLabel('effect')).toBe('Effect');
    expect(fieldLabel('bonus')).toBe('Bonus');
    expect(fieldLabel('name')).toBe('Name');
  });

  // Deliberate, and pinned so it is not "fixed" by accident: four rows in the whole archive, and
  // the stat abbreviations read fine as words.
  it('leaves the four stat abbreviations reading as words', () => {
    expect(['STR', 'AGI', 'WIS', 'LUK'].map(fieldLabel)).toEqual(['Str', 'Agi', 'Wis', 'Luk']);
  });
});

describe('CAVEAT', () => {
  // Both surfaces show the same caveat. It lives beside the formatters so a copy on the entity
  // page and a copy on the rollup page cannot drift apart.
  it('names the archive start and admits the archive is not every version', () => {
    expect(CAVEAT).toContain(ARCHIVE_START);
    // The archive skips 2.3.496, 2.3.512-521 and others, so a change that shipped in a missing
    // version is attributed to the next one we hold. "between versions" claimed otherwise.
    expect(CAVEAT).toContain('the versions we have data for');
  });
});

describe('formatValue', () => {
  it('renders a recipe as its materials rather than as JSON', () => {
    expect(formatValue([{ itemName: 'Frog_Leg', itemQuantity: 6 }, { itemName: 'Thread', itemQuantity: 10 }]))
      .toBe('Frog Leg x6, Thread x10');
  });

  it('cleans the underscores out of a game string', () => {
    expect(formatValue('%_DAMAGE_MULTI')).toBe('% DAMAGE MULTI');
  });

  it('groups a big number', () => {
    expect(formatValue(3649200)).toBe('3,649,200');
  });

  // monster:w7b8's health goes 3e+31 to 5e+33, which toLocaleString renders as a 40 character
  // comma string on every World 7 boss page. notateNumber is what the rest of the site uses.
  it('notates a number too large to read as digits', () => {
    expect(formatValue(3e31)).toBe('3E31');
    expect(formatValue(5e33)).toBe('5E33');
    expect(formatValue(300000000000)).toBe('300B');
  });

  // notateNumber's unsuffixed branch floors anything under 100 (0.2 would print as "0") and
  // rounds 4,200 to "4.2K", so exact digits stay below the threshold.
  it('keeps a small number exact', () => {
    expect(formatValue(25)).toBe('25');
    expect(formatValue(4200)).toBe('4,200');
    expect(formatValue(0.2)).toBe('0.2');
  });

  // The archive's most common shape by far: a field going from the game's zero placeholder to a
  // real value, which reads as the entity gaining a bonus it did not have.
  it('names the zero placeholder rather than printing a bare 0', () => {
    expect(formatValue(0)).toBe('none');
  });

  // Real values from data/entity-graph.json: pet:Pet2's `effect` at 2.3.523, and
  // vial:ELECTROLYTE's `desc` at 2.3.492. Both carry the game's own "{" template slot for a bonus
  // that lives in a different (possibly also-changing) field. Leaking the brace onto the page
  // reads as broken markup, and there is no reliable paired value to fill it with in a diff row,
  // so the slot is dropped rather than filled.
  it('drops the game\'s "{" template slot instead of leaking it onto the page', () => {
    expect(formatValue('{15%_Hat_Rack_Bonus_Multi')).toBe('15% Hat Rack Bonus Multi');
    expect(formatValue('+{%_Pet_Team_Damage')).toBe('+% Pet Team Damage');
    expect(formatValue('+{%_Mob_Team_Damage')).toBe('+% Mob Team Damage');
  });

  // "}" is the second slot, and a talent uses both: every real talent string in the archive that
  // carries a "{" carries a "}" as well. Dropping only the opening brace left the closing one on
  // the page, on four talent rows and on four item desc_line1 rows that already shipped.
  it('drops the closing "}" slot as well as the opening one', () => {
    expect(formatValue('+{%_chance_&_+}%_range')).toBe('+% chance & +% range');
    expect(formatValue('{}%_Class_EXP_Multi')).toBe('% Class EXP Multi');
  });

  // Real 2.3.525 and 2.3.492 rows. The slot sits mid-sentence, so removing it leaves two spaces
  // where the number was, which would read as a typo if they were not collapsed.
  it('closes the gap a mid-sentence slot leaves behind', () => {
    expect(formatValue('Get_unlimited_entries_to_the_Mob_Arena_for_{_mins._PASSIVE:_+}%_Mob_DMG'))
      .toBe('Get unlimited entries to the Mob Arena for mins. PASSIVE: +% Mob DMG');
    expect(formatValue('Backup_needed?_How_about_{x_Tachyon_Gain_and_}_less_kills_needed_to_charge_Arcane_Crystals'))
      .toBe('Backup needed? How about x Tachyon Gain and less kills needed to charge Arcane Crystals');
  });
});
