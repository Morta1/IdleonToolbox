// More catalogs of things the game lists but that are not items: Divinity gods, Sailing
// artifacts, Gaming superbits, Equinox upgrades and Jade Emporium upgrades. None of them costs an
// item (gods and superbits are paid in currencies, the Emporium in jade coins, artifacts are found
// in chests), so they are pages without edges; the description is the page.
//
// Descriptions are filled at their base value, the way systems.mjs does it, because what a player
// gets once levels and account bonuses apply is not something a save-less page can know.

import { dropReadout, dropUnfilled, sentence, tidy } from '../registry/text.mjs';
import { gameTable } from '../registry/data.mjs';

// Gods ------------------------------------------------------------------------------------------

// Kattlekruk's text gives its daily bubble levels as `$` and lists the bubbles with `#`. The
// daily amount starts at krukBubblesDaily's base (Thingies:KrukBubblesDaily) and the list depends
// on the Zenith Market, so the list is dropped and the lead-in reworded to match. Without the base the sentence goes.
const DOLLAR_SENTENCE = /[^.!?]*\$[^.!?]*[.!?][_@]*/;
const godMajor = (text, kruk) => {
  const major = String(text || '').replace(/these_Alchemy_Bubbles:(?:_*@)*_*#/, 'some_Alchemy_Bubbles.');
  return kruk?.base == null ? major.replace(DOLLAR_SENTENCE, '') : major.replace('+$_LV', `+${kruk.base}_LV`);
};

// A god's page is keyed by its slot in the list, which is also the number its icon carries
// (DivGod<slot>). The slot's minor-bonus multiplier is NOT on its own row: the column is in
// godIndex order, so it is read through godIndex (divinity.ts getGodMinorBonusMultiplier). The
// bonus grows with Divinity level toward that number, so it is shown as the ceiling.
export const godNodes = (gods, data) => {
  const kruk = gameTable(data, 'krukBubblesDaily');
  return Object.fromEntries((gods || [])
    .map((god, slot) => [god, slot])
    .filter(([god]) => god?.name)
    .map(([god, slot]) => {
      const multiplier = gods[Number(god.godIndex)]?.minorBonusMultiplier;
      const minor = String(god.minorBonus || '');
      const parts = [
        tidy(godMajor(god.majorBonus, kruk)),
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
};

// Artifacts -------------------------------------------------------------------------------------

// The game hands artifacts out island by island, in list order, so an artifact's island is the one
// whose running count of artifacts reaches its index. The Edge starts with one and gains three
// when the Brighter Lighthouse Bulb is bought (sailing.ts ISLAND_ARTIFACT_OVERRIDES); the offsets
// only line up with the lantern artifacts if the full four are counted.
// UPKEEP: The_Edge's full artifact count (4) mirrors sailing.ts ISLAND_ARTIFACT_OVERRIDES; re-check it and any other island that gains artifacts by bulb or upgrade. Not extracted: the three extra come from the Brighter_Lighthouse_Bulb's effect, not from a count the game keeps.
const ISLAND_ARTIFACT_COUNT = { The_Edge: 4 };

// Deathskull's text is a single `$` the game fills with a line per form: artifactFormText names the
// artifact by index and lists the forms, the first being what an unforged one gives. With no table the `$` sentence goes.
const formText = (index, forms) => (forms?.artifact === index ? forms.forms?.[0] ?? null : null);

export const artifactIslands = (artifacts, islands) => {
  const owners = [];
  for (const island of islands || []) {
    const count = ISLAND_ARTIFACT_COUNT[island?.name] ?? island?.numberOfArtifacts ?? 0;
    for (let i = 0; i < count; i++) owners.push(island.name);
  }
  return (artifacts || []).map((_, index) => owners[index] ?? null);
};

export const artifactNodes = (artifacts, islands, data) => {
  const owners = artifactIslands(artifacts, islands);
  const forms = gameTable(data, 'artifactFormText');
  return Object.fromEntries((artifacts || [])
    .map((artifact, index) => [artifact, index])
    .filter(([artifact]) => artifact?.name)
    .map(([artifact, index]) => {
      const text = formText(index, forms) || dropReadout(String(artifact.description || ''))
        .replace(/_?\(\}\)/g, '')
        .replace(/{/g, artifact.baseBonus);
      const island = owners[index];
      return [`artifact:Arti${index}`, {
        kind: 'artifact',
        rawName: `Arti${index}`,
        name: artifact.name,
        icon: `/data/Arti${index}.png`,
        category: 'World 5',
        description: [dropUnfilled(tidy(text), ['$']), island ? `Found on ${island}.` : ''].filter(Boolean).join(' ')
      }];
    }));
};

// Superbits -------------------------------------------------------------------------------------

// The game splits its 72 superbits into three tiers of 24, by position.
// UPKEEP: the tier names Super, Duper and Zuper. Not extracted: the game writes them only inside handler keys (DuperBits, ZuperBitsUnlocked), never as a list.
const SUPERBIT_TIERS = ['Super', 'Duper', 'Zuper'];

// The last entries cost 1e150 bits and say "no way I'm lettin' ya buy this". They are the game's
// jokes, not bonuses, and every real superbit costs under 1e109 (2.3.540's Lumi_Gainz replaced one joke at 5e108).
// UPKEEP: 150 sits above every real superbit cost (under 1e109) and at the joke entries (1e150); re-check both ends when a patch adds superbits.
const UNBUYABLE_EXPONENT = 150;

// The bits currency has a sprite per tier of magnitude (utility/helpers getBitIndex), and the
// Gaming page draws that one next to the price.
export const bitTier = (cost) => {
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
      // A superbit has no art of its own in the game; the Bits sprite is the price's, not the bonus's.
      icon: null,
      category: 'World 5',
      // Most game texts end without a full stop.
      description: /[.!?]$/.test(text) ? text : `${text}.`,
      fields: [
        { label: 'Tier', value: `${SUPERBIT_TIERS[Math.min(2, Math.floor(index / 24))]} Bit` },
        { label: 'Cost', value: cost, format: 'cost', currency: 'Bits', currencyIcon: `/etc/Bits_${bitTier(cost)}.png` }
      ]
    }];
  }));

// Equinox upgrades ------------------------------------------------------------------------------

// The number after a `{` in these texts is the bonus per level ("{10%_Damage"), which the Effect box fills at the typed
// level as `}`; at the very start it is a gain and reads "+10%". A `}` already in the text is the running total, the
// same per-level bonus times the level. Three upgrades have no number at all: their page is the text and the max level.
// "Hmm..." is a hidden placeholder the Equinox page itself never draws.
const equinoxTemplate = (upgrade) => tidy(dropReadout(String(upgrade.description || ''))
  .replace(/\{(\d+(?:\.\d+)?)/g, (match, value) => (Number(value) === upgrade.bonus ? '}' : value))
  .replace(/{/g, '')
  .replace(/^}/, '+}'));

export const equinoxNodes = (upgrades) => Object.fromEntries((upgrades || [])
  .map((upgrade, index) => [upgrade, index])
  .filter(([upgrade]) => upgrade?.name && upgrade.name !== 'Hmm...')
  .map(([upgrade, index]) => {
    const text = equinoxTemplate(upgrade);
    const levelled = text.includes('}') && upgrade.bonus != null;
    // Clouds, the Equinox Unending superbit and Summoning raise most max levels (equinox.ts), so the field has no cap.
    const fields = [{ label: 'Base max level', value: upgrade.maxLevel }];
    return [`equinox:Dream_Upgrade_${index + 1}`, {
      kind: 'equinox',
      rawName: `Dream_Upgrade_${index + 1}`,
      name: upgrade.name,
      icon: `/etc/Dream_Upgrade_${index + 1}.png`,
      category: 'World 3',
      ...(levelled ? {
        registry: true,
        description: text,
        effect: {
          levelLabel: 'Upgrade level',
          cap: null,
          terms: [{ token: '}', formula: 'linear', args: { perLevel: upgrade.bonus } }]
        },
        fields
      } : { description: text, fields })
    }];
  }));

// Jade Emporium ---------------------------------------------------------------------------------

// Three entries are "UNDER_CONSTRUCTION" stubs the game says cannot be bought yet. Jade coins are
// not an item, so the price is not a cost here: it comes from the shop row in the Emporium order
// and is added as fields by enrich-world-6.mjs.
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
