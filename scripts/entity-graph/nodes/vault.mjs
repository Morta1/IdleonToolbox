// The Upgrade Vault: 90 account-wide upgrades bought with coins. Each gets a page so the items
// Glimbo takes (which raise an upgrade's max level) have something to link to.
//
// A page is read at level 1, since what a player actually gets depends on how far they have levelled
// it and on the three Vault Mastery upgrades, none of which a save-less page can see.

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

// Major Discount is the one `$` that is a real figure rather than a live total: the percentage off
// every upgrade, from the same 1 / (1 + bonus / 100) curve the vault parser uses.
const DISCOUNT_INDEX = 13;
// Quest KAPOW's `{` is the star talent's whole max level, a base the vault data does not carry, so
// level one's bonus alone would read as a max level of 1.
const STAR_TALENT_INDEX = 49;

const fillAtLevelOne = (template, index, bonus) => {
  if (index === DISCOUNT_INDEX) {
    const discount = Math.round(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
    return template.replace('$', discount);
  }
  const text = dropLiveReadout(index === STAR_TALENT_INDEX ? template.replace('_to_{', '.') : template);
  const multiplier = Math.round((1 + bonus / 100) * 100) / 100;
  return text.replace(/\{/g, bonus).replace(/\}/g, multiplier);
};

export const vaultDescription = (upgrade, index) => {
  const effect = fillAtLevelOne(String(upgrade.description || ''), index, Number(upgrade.x5) || 0)
    .replace(/_+$/, '');
  const parts = [`Level 1: ${effect}.`.replace(/([.!?])\.$/, '$1')];
  if (upgrade.maxLevel > 0) parts.push(`Base max level ${upgrade.maxLevel}.`);
  if (upgrade.unlockLevel > 0) parts.push(`Unlocks at ${upgrade.unlockLevel} total upgrade levels.`);
  return parts.join(' ');
};

export const vaultNodes = (upgradeVault) => Object.fromEntries((upgradeVault || [])
  .map((upgrade, index) => [upgrade, index])
  .filter(([upgrade]) => !isPlaceholder(upgrade))
  .map(([upgrade, index]) => [vaultId(index), {
    kind: 'vault',
    rawName: `VaultUpg${index}`,
    name: cleanVaultName(upgrade.name),
    icon: `/data/VaultUpg${index}.png`,
    category: 'Account',
    // The listing reads in the vault's own order, which is also the order the upgrades unlock in.
    order: index,
    description: vaultDescription(upgrade, index)
  }]));
