// The Upgrade Vault: 90 account-wide upgrades bought with coins. Each gets a page so the items
// Glimbo takes (which raise an upgrade's max level) have something to link to.
//
// A page is read at level 1, since what a player actually gets depends on how far they have levelled
// it and on the three Vault Mastery upgrades, none of which a save-less page can see.
import { gameTable } from '../registry/data.mjs';

// Names carry the game's in-font glyphs (製 and kin), a "(Tap for Info)" hint, a stray `$` on the two
// upgrades whose description has a live total, and one name with a space where the rest use `_`.
export const cleanVaultName = (name) => String(name || '')
  .replace(/[船般航舞製$]/g, '')
  .replace(/\(Tap_for(_more)?_Info\)/i, '')
  .replace(/\s+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

export const vaultId = (index) => `vault:VaultUpg${index}`;

// The game pads the vault with rows it never shipped, named Filler or Some_...
export const isPlaceholder = (upgrade) => !upgrade?.name || /^(filler|some[ _])/i.test(upgrade.name);

// Most upgrades end with a live readout in the game ("Current Kills: N", "Total Bonus: +$%") that
// is all placeholders without a save. Cut from the first such marker back to the end of the sentence
// before it, so the clause that says what the upgrade does survives.
const LIVE_MARKER = /[$^&~]/;
const dropLiveReadout = (template) => {
  const withoutParens = template.replace(/_\([^)]*[$^&~][^)]*\)/g, '.');
  const at = withoutParens.search(LIVE_MARKER);
  if (at < 0) return withoutParens;
  const head = withoutParens.slice(0, at);
  const sentence = head.match(/^(.*[.!?])_[^.!?]*$/);
  return sentence ? sentence[1] : head;
};

// The rows vaultRowFills names (the vault panel's fills): `discount` is Major Discount, the one `$` that is a real figure
// rather than a live total, the percentage off every upgrade from the 1 / (1 + bonus / 100) curve the vault parser uses.
// `starTalent` is Quest KAPOW, whose `{` is the star talent's whole max level, a base the vault data does not carry, so
// its sentence is cut before it.
// Every template ends a sentence, as the panel's text reads.
const endSentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);
export const vaultTemplate = (upgrade, index, fills) => {
  const template = String(upgrade.description || '');
  if (fills?.discount != null && index === fills.discount) return endSentence(template.replace(/_+$/, ''));
  const starTalent = fills?.starTalent != null && index === fills.starTalent;
  return endSentence(dropLiveReadout(starTalent ? template.replace('_to_{', '.') : template).replace(/_+$/, ''));
};

// Summoning VaultUpgBonus (the vaultUpgradeBonus table): L * x5, except two upgrades that add weighted steps past set
// levels. The Vault Mastery multipliers are other upgrades' levels, which a page without a save leaves at zero.
// Without the table there is no knowing which upgrades step, so no upgrade prints a bonus: a linear guess would be wrong
// for the stepped ones (Bigger Damage reads +500 instead of +1,825 at 500). A term with no formula reads as unfilled,
// so levelledText drops the sentence holding the `{`.
const bonusTerm = (upgrade, index, steps) => {
  if (!steps) return { token: '{', formula: null };
  const special = [steps?.first, steps?.higher].find((entry) => entry?.index === index);
  const perLevel = Number(upgrade.x5) || 0;
  return special
    ? { token: '{', formula: 'steppedLinear', args: { perLevel, steps: special.steps, every: special.every ?? 0, per: special.per ?? 1 } }
    : { token: '{', formula: 'linear', args: { perLevel } };
};

// Summoning VaultUpgCost (the vaultUpgradeCost table): L + (x1 + L) * x2^L coins, from upgrade lateFrom on also times
// lateRate^(index - lateFrom). The discounts are the player's. Without the table the price is left out.
const vaultCost = (upgrade, index, table) => (table ? {
  formula: 'affinePowPlusLevel',
  args: { scale: Math.pow(table.lateRate, Math.max(0, index - table.lateFrom)), base: upgrade.x1, rate: upgrade.x2 },
  currency: 'Coins'
} : null);

export const vaultNodes = (upgradeVault, data) => {
  const fills = gameTable(data, 'vaultRowFills');
  const steps = gameTable(data, 'vaultUpgradeBonus');
  const costs = gameTable(data, 'vaultUpgradeCost');
  return Object.fromEntries((upgradeVault || [])
    .map((upgrade, index) => [upgrade, index])
    .filter(([upgrade]) => !isPlaceholder(upgrade))
    .map(([upgrade, index]) => {
      const perLevel = Number(upgrade.x5) || 0;
      const cost = vaultCost(upgrade, index, costs);
      return [vaultId(index), {
        kind: 'vault',
        rawName: `VaultUpg${index}`,
        name: cleanVaultName(upgrade.name),
        icon: `/data/VaultUpg${index}.png`,
        category: 'Account',
        // The listing reads in the vault's own order, which is also the order the upgrades unlock in.
        order: index,
        registry: true,
        description: vaultTemplate(upgrade, index, fills),
        effect: {
          levelLabel: 'Upgrade level',
          // Uncapped: a bundle and Glimbo's trades raise the max (VaultUpgMaxLV, N.js:106396), so the base is a row instead.
          cap: null,
          terms: [
            bonusTerm(upgrade, index, steps),
            { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: perLevel / 100 } },
            { token: '$', formula: 'diminishingPercentRounded', args: { perLevel } }
          ]
        },
        ...(cost ? { cost } : {}),
        fields: [
          ...(upgrade.maxLevel > 0 ? [{ label: 'Base max level', value: upgrade.maxLevel }] : []),
          ...(upgrade.unlockLevel > 0 ? [{ label: 'Unlocks at', value: `${upgrade.unlockLevel} total upgrade levels` }] : [])
        ]
      }];
    }));
};
