import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getBitsMulti } from '@parsers/world-5/gaming';
import { getExtraDust } from '@parsers/class-specific/compass';
import { getExtraBonesBonus } from '@parsers/class-specific/grimoire';
import { getExtraTachyon, getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getAllMasterclassDropz } from '@parsers/misc';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is the same account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), LoreEpiBon(-1)).
const GAME = {
  // Holes("VillagerExpPerHour", t)
  villagerExp: [100606167441241.08, 107748829431517.72, 347887683585451.1, 255655541551169.4, 198870132829311],
  // GamingStatType("SproutValueNonPlantMulti") and ("PaletteLuck")
  bitsMulti: 5.71351823669754e53,
  paletteLuck: 252.07105202319835,
  // ResearchStuff("ResearchEXPmulti")
  researchExpMulti: 1334.951583995417,
  // Minehead("CurrencyGain")
  mineheadCurrency: 45114.4105707113,
  // Summoning("AllMasterclassDropz"), Windwalker("ExtraDust"), Summoning("GrimoireBonesDropDEC"),
  // ArcaneType("ExtraTachyon"), ArcaneType("PrismaBonusMult"), all for the Wind Walker
  allMasterclassDrops: 12.049983498676697,
  extraDust: 1839507.3165092394,
  extraBones: 117938.15756472471,
  extraTachyon: 221890.85311597976,
  prismaMulti: 2.5236898201301186,
  // Holes("JarRupieValue"), Holes("JarProductionPerHR")
  jarRupieValue: 2310873159367098,
  jarProgressPerHour: 2915395.6824436793,
  // Holes("MonumentHRbonusPCT") and ("MonumentHRbonusMULTI")
  monumentAfkPercent: 1735.4172145155994,
  monumentAfkMulti: 1.25,
  // Thingies("ReefDayGains")
  reefDayGains: 113.3403009583432,
  // Spelunk("POW"), ("AmberGain"), ("StaminaRegenRate"), outside a delve
  spelunkingPower: 1.794857185005044e27,
  amberGain: 4.185185988675015e21,
  staminaRegen: 31.380682583821784,
  // 1 + (ArcaneUpgBonus(48) + ArcadeBonus(51) + JellyOperation(28)) / 100, the EmperorBon multiplier
  emperorMulti: 1.924,
  // FarmingStuffs("GrowthRate"), and NextOGchance(plot) / 0.4^(OG + 1)
  farmingGrowth: 153756.64629688626,
  farmingOgMulti: 544.601486631657
};

const TOLERANCE = 1e-6;
const within = (actual, expected, tolerance = TOLERANCE) => expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);

describe('world 5 to 7 formulas verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const windWalker = characters.find(c => c?.name === 'IAmTheHunterrr');

  it('villager EXP / hr, the Tome epilogue read from the current tome score (hole parses before spelunking)', () => {
    account.hole.villagers.forEach((villager, index) => within(villager.expRate.value, GAME.villagerExp[index]));
  });

  it('gaming bits multi and palette luck', () => {
    within(getBitsMulti(account, characters).value, GAME.bitsMulti);
    within(account.gaming.paletteLuck.value, GAME.paletteLuck);
  });

  it('research EXP multi', () => {
    within(account.research.researchEXPmulti, GAME.researchExpMulti);
  });

  it('minehead currency per hour', () => {
    within(account.minehead.currencyGain, GAME.mineheadCurrency);
  });

  it('all masterclass drops, Killroy read by bonus index 4 (Masterclass drops), not permanent upgrade slot 4 (Jade)', () => {
    within(getAllMasterclassDropz(windWalker, account).value, GAME.allMasterclassDrops);
  });

  it('extra dust, bones and tachyon, MainframeBonus(121-123) read as the matching lab jewels', () => {
    within(getExtraDust(windWalker, account).value, GAME.extraDust);
    within(getExtraBonesBonus(windWalker, account).value, GAME.extraBones);
    within(getExtraTachyon(windWalker, account).value, GAME.extraTachyon);
    within(getPrismaMulti(account).value, GAME.prismaMulti);
  });

  it('extra bones reads the character\'s own Grimoire talents and gear', () => {
    const deathBringer = characters.find(c => c?.flatTalents?.some(t => t?.name === 'GRIMOIRE' && t?.level > 0));
    if (!deathBringer) return;
    const breakdown = getExtraBonesBonus(deathBringer, account).breakdown;
    const talent = breakdown.tree[0].children.find(node => node.name === 'Talent (Grimoire)');
    expect(talent.value).toBeGreaterThan(1);
  });

  it('jar rupie value and progress per hour', () => {
    within(account.hole.caverns.theJars.rupieValue.value, GAME.jarRupieValue);
    within(account.hole.caverns.theJars.perHour.value, GAME.jarProgressPerHour);
  });

  it('monument AFK bonus, with the Minehead opponent multiplier on top', () => {
    const { afkPercent } = account.hole.caverns.bravery;
    within(afkPercent.value, GAME.monumentAfkPercent, 2e-5);
    within(afkPercent.multi, GAME.monumentAfkMulti);
  });

  it('coral reef day gains', () => {
    within(account.coralReef.reefDayGains.value, GAME.reefDayGains);
  });

  it('spelunking power, amber gain and stamina regen', () => {
    within(account.spelunking.power.value, GAME.spelunkingPower);
    within(account.spelunking.amberGain.value, GAME.amberGain);
    within(account.spelunking.staminaRegenRate.value, GAME.staminaRegen);
  });

  it('emperor bonus multi', () => {
    within(account.emperor.bonusMulti.totalValue, GAME.emperorMulti);
  });

  it('farming growth speed and OG chance multiplier', () => {
    within(account.farming.stats.growthSpeed.totalValue, GAME.farmingGrowth);
    within(account.farming.stats.ogChance.totalValue, GAME.farmingOgMulti);
  });
});
