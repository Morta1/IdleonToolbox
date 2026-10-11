import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getExtraDust } from '@parsers/class-specific/compass';
import { getExtraBonesBonus } from '@parsers/class-specific/grimoire';
import { getExtraTachyon, getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getAllMasterclassDropz } from '@parsers/misc';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), LoreEpiBon(-1)).
const GAME = {
  // Summoning("AllMasterclassDropz"), Windwalker("ExtraDust"), Summoning("GrimoireBonesDropDEC"),
  // ArcaneType("ExtraTachyon"), ArcaneType("PrismaBonusMult"), all for the Wind Walker
  allMasterclassDrops: 12.049983498676697,
  extraDust: 1839507.3165092394,
  extraBones: 117938.15756472471,
  extraTachyon: 221890.85311597976,
  prismaMulti: 2.5236898201301186
};
const TOLERANCE = 1e-6;

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');
const grimoireTalentNode = (character) => getExtraBonesBonus(character, account).breakdown.tree[0].children
  .find(({ name }) => name === 'Talent (Grimoire)');

describe('masterclass drops verified against the live game', () => {
  it('all masterclass drops, Killroy read by bonus index 4 (Masterclass drops), not permanent upgrade slot 4 (Jade)', () => {
    within(getAllMasterclassDropz(windWalker, account).value, GAME.allMasterclassDrops, TOLERANCE);
  });

  it('extra dust, bones and tachyon, MainframeBonus(121-123) read as the matching lab jewels', () => {
    within(getExtraDust(windWalker, account).value, GAME.extraDust, TOLERANCE);
    within(getExtraBonesBonus(windWalker, account).value, GAME.extraBones, TOLERANCE);
    within(getExtraTachyon(windWalker, account).value, GAME.extraTachyon, TOLERANCE);
    within(getPrismaMulti(account).value, GAME.prismaMulti, TOLERANCE);
  });

  it('extra bones reads the character\'s own Grimoire talent', () => {
    const deathBringer = characters.find(({ class: className }) => className === 'Death_Bringer');
    expect(grimoireTalentNode(windWalker).value).toBe(1);
    expect(grimoireTalentNode(deathBringer).value).toBeGreaterThan(1);
  });
});
