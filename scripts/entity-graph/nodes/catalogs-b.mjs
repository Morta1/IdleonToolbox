// More catalogs of things the game lists but that are not items: Divinity gods, Sailing
// artifacts, Gaming superbits, Equinox upgrades and Jade Emporium upgrades. None of them costs an
// item (gods and superbits are paid in currencies, the Emporium in jade coins, artifacts are found
// in chests), so they are pages without edges; the description is the page.
//
// Descriptions are filled at their base value, the way systems.mjs does it, because what a player
// gets once levels and account bonuses apply is not something a save-less page can know.

// Characters the game's font draws as glyphs, which are not text anywhere else.
const GLYPHS = /[船般航舞製]/g;

// `@` is the game's line break. It becomes a sentence break, or just a space when the sentence has
// already ended, so a two-line description reads as two sentences.
const breakLines = (text) => text.replace(/_*(?:@_*)+/g, (match, offset, whole) => (
  /[.!?)]$/.test(whole.slice(0, offset)) ? '_' : '._'
));

// The "Total Bonus: ..." tail is a live readout of the player's own total, which is all
// placeholders without a save.
const dropReadout = (text) => text.replace(/(?:_*@)*_*Total_Bonus:.*$/i, '');

const tidy = (text) => breakLines(String(text || '').replace(GLYPHS, ''))
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

// Ends a clause with a full stop unless the game's own text already did.
const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

// Gods ------------------------------------------------------------------------------------------

// Kattlekruk's text gives its daily bubble levels as `$` and lists the bubbles with `#`. The
// daily amount starts at 20 (alchemy.ts getKrukBubblesDaily) and the list depends on the Zenith
// Market, so the list is dropped and the lead-in reworded to match.
const godMajor = (text) => String(text || '')
  .replace('+$_LV', '+20_LV')
  .replace(/these_Alchemy_Bubbles:(?:_*@)*_*#/, 'some_Alchemy_Bubbles.');

// A god's page is keyed by its slot in the list, which is also the number its icon carries
// (DivGod<slot>). The slot's minor-bonus multiplier is NOT on its own row: the column is in
// godIndex order, so it is read through godIndex (divinity.ts getGodMinorBonusMultiplier). The
// bonus grows with Divinity level toward that number, so it is shown as the ceiling.
export const godNodes = (gods) => Object.fromEntries((gods || [])
  .map((god, slot) => [god, slot])
  .filter(([god]) => god?.name)
  .map(([god, slot]) => {
    const multiplier = gods[Number(god.godIndex)]?.minorBonusMultiplier;
    const minor = String(god.minorBonus || '');
    const parts = [
      tidy(godMajor(god.majorBonus)),
      minor.includes('{') && multiplier != null
        ? sentence(`Minor bonus for a linked character, at most: ${tidy(minor.replace(/{/g, multiplier))}`)
        : sentence(`Minor bonus: ${tidy(minor)}`),
      god.blessing && god.blessingMultiplier != null
        ? sentence(`Blessing, Level 1: ${tidy(god.blessing.replace(/{/g, god.blessingMultiplier))}`)
        : ''
    ].filter(Boolean);
    return [`god:DivGod${slot}`, {
      kind: 'god',
      rawName: `DivGod${slot}`,
      name: god.name,
      icon: `/data/DivGod${slot}.png`,
      category: 'World 5',
      description: parts.join(' ')
    }];
  }));

// Artifacts -------------------------------------------------------------------------------------

// The game hands artifacts out island by island, in list order, so an artifact's island is the one
// whose running count of artifacts reaches its index. The Edge starts with one and gains three
// when the Brighter Lighthouse Bulb is bought (sailing.ts ISLAND_ARTIFACT_OVERRIDES); the offsets
// only line up with the lantern artifacts if the full four are counted.
const ISLAND_ARTIFACT_COUNT = { The_Edge: 4 };

// Deathskull's text is a single `$` the game fills with a line per form (sailing.ts); the first
// form is what an unforged one gives.
const ARTIFACT_TEXT = {
  Deathskull: 'Gives_+1_Gallery_Slots_for_Trophies_in_World_7!'
};

export const artifactIslands = (artifacts, islands) => {
  const owners = [];
  for (const island of islands || []) {
    const count = ISLAND_ARTIFACT_COUNT[island?.name] ?? island?.numberOfArtifacts ?? 0;
    for (let i = 0; i < count; i++) owners.push(island.name);
  }
  return (artifacts || []).map((_, index) => owners[index] ?? null);
};

export const artifactNodes = (artifacts, islands) => {
  const owners = artifactIslands(artifacts, islands);
  return Object.fromEntries((artifacts || [])
    .map((artifact, index) => [artifact, index])
    .filter(([artifact]) => artifact?.name)
    .map(([artifact, index]) => {
      const text = ARTIFACT_TEXT[artifact.name] || dropReadout(String(artifact.description || ''))
        .replace(/_?\(\}\)/g, '')
        .replace(/{/g, artifact.baseBonus);
      const island = owners[index];
      return [`artifact:Arti${index}`, {
        kind: 'artifact',
        rawName: `Arti${index}`,
        name: artifact.name,
        icon: `/data/Arti${index}.png`,
        category: 'World 5',
        description: [tidy(text), island ? `Found on ${island}.` : ''].filter(Boolean).join(' ')
      }];
    }));
};

// Superbits -------------------------------------------------------------------------------------

// The game splits its 72 superbits into three tiers of 24, by position.
const SUPERBIT_TIERS = ['Super', 'Duper', 'Zuper'];

// Three entries cost 1e150 bits and say "no way I'm lettin' ya buy this". They are the game's
// jokes, not bonuses, and every real superbit costs under 1e101.
const UNBUYABLE_EXPONENT = 150;

// The bits currency has a sprite per tier of magnitude (utility/helpers getBitIndex), and the
// Gaming page draws that one next to the price.
const bitTier = (cost) => {
  let bits = cost;
  let tier = 0;
  for (let i = 0; i < 5; i++) {
    if (bits > 1e18) {
      bits /= 1e18;
      tier++;
    }
  }
  return tier;
};

export const superbitNodes = (superbits) => Object.fromEntries((superbits || [])
  .map((bit, index) => [bit, index])
  .filter(([bit]) => bit?.name && bit.x2 < UNBUYABLE_EXPONENT)
  .map(([bit, index]) => {
    const cost = bit.x1 * Math.pow(10, bit.x2);
    const text = tidy(dropReadout(String(bit.description || '')).replace(/_?\(\}\)/g, ''));
    return [`superbit:Superbit${index}`, {
      kind: 'superbit',
      rawName: `Superbit${index}`,
      name: bit.name,
      icon: `/etc/Bits_${bitTier(cost)}.png`,
      category: 'World 5',
      // Most game texts end without a full stop, which ran them into the tier sentence.
      description: `${/[.!?]$/.test(text) ? text : `${text}.`} ${SUPERBIT_TIERS[Math.min(2, Math.floor(index / 24))]} Bit, costs ${bit.x1}e${bit.x2} bits.`
    }];
  }));

// Equinox upgrades ------------------------------------------------------------------------------

// The `{` in these texts is not a number slot: the base number follows it ("{10%_Damage"), so it
// is dropped, the way equinox.ts shows it, except at the very start where the number is a gain
// and reads as "+10%". A `}` is the running total, which at level one is the per-level bonus.
// "Hmm..." is a hidden placeholder the Equinox page itself never draws.
export const equinoxNodes = (upgrades) => Object.fromEntries((upgrades || [])
  .map((upgrade, index) => [upgrade, index])
  .filter(([upgrade]) => upgrade?.name && upgrade.name !== 'Hmm...')
  .map(([upgrade, index]) => {
    const text = tidy(dropReadout(String(upgrade.description || ''))
      .replace(/^{/, '+')
      .replace(/{/g, '')
      .replace(/}/g, upgrade.bonus ?? 1));
    return [`equinox:Dream_Upgrade_${index + 1}`, {
      kind: 'equinox',
      rawName: `Dream_Upgrade_${index + 1}`,
      name: upgrade.name,
      icon: `/etc/Dream_Upgrade_${index + 1}.png`,
      category: 'World 3',
      description: `Level 1: ${text} Max level ${upgrade.maxLevel}.`
    }];
  }));

// Jade Emporium ---------------------------------------------------------------------------------

// Three entries are "UNDER_CONSTRUCTION" stubs the game says cannot be bought yet. Their cost is
// jade coins, which are not an item, and it depends on the shop's display order rather than the
// data order, so no price is shown.
export const jadeNodes = (upgrades) => Object.fromEntries((upgrades || [])
  .filter((upgrade) => upgrade?.name && upgrade.name !== 'UNDER_CONSTRUCTION')
  .map((upgrade) => [`jade:NjJupg${upgrade.x3}`, {
    kind: 'jade',
    rawName: `NjJupg${upgrade.x3}`,
    name: upgrade.name,
    icon: `/data/NjJupg${upgrade.x3}.png`,
    category: 'World 6',
    description: tidy(upgrade.description)
  }]));
