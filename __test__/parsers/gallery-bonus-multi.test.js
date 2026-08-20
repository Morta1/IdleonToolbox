import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getGalleryBonusMulti } from '@parsers/world-7/gallery';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { getCardLevel } from '@parsers/cards';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';

// Game: _customBlock_Gallery("GalleryBonusMulti") =
//   1 + (3 * Spelunk[13][4] + 10 * chipBonuses("troph") + 3 * ClamWorkBonus(7) + KillroyBonuses(3)
//        + min(20, AlchBubbles.Y13) + min(CardLv("w7a11"), 10) + Companions(49) + SushiStuff(54)) / 100
// Cross-checked against a live client on 2026-08-20.

describe('gallery bonus multi', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters[8];
  const raw = account.gallery.rawSpelunk;

  it('counts the Codfrey bubble at account level, not only per character', () => {
    const bubble = getBubbleBonus(account, 'CODFREY_RULZ_OK', false);
    expect(bubble).toBeGreaterThan(0);
    const noBubble = { ...account, alchemy: { ...account.alchemy, bubblesFlat: [] } };
    expect(getBubbleBonus(noBubble, 'CODFREY_RULZ_OK', false)).toBe(0);
    const delta = getGalleryBonusMulti(raw, account) - getGalleryBonusMulti(raw, noBubble);
    expect(delta * 100).toBeCloseTo(Math.min(20, bubble), 10);
    expect(account.gallery.bonusMulti).toBeCloseTo(getGalleryBonusMulti(raw, account), 12);
  });

  it('adds the 10 point lab chip only for a character that has it', () => {
    const charMulti = getGalleryBonusMulti(raw, account, character);
    const chipPoints = getPlayerLabChipBonus(character, account, 16) ? 10 : 0;
    expect((charMulti - getGalleryBonusMulti(raw, account)) * 100).toBeCloseTo(chipPoints, 10);
  });

  it('caps the Coralcave Crab card on its level, at coefficient 1', () => {
    const level = getCardLevel(account.cards, 'w7a11');
    expect(level).toBeGreaterThan(0);
    const withoutCard = { ...account, cards: {} };
    const delta = getGalleryBonusMulti(raw, account) - getGalleryBonusMulti(raw, withoutCard);
    expect(delta * 100).toBeCloseTo(Math.min(level, 10), 10);
  });
});
