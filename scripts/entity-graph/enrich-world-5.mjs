// World 5 details that belong on pages which already exist, so they ride along as `fields` or as the
// level calculator rather than getting a kind of their own: the gods' blessings, the artifacts'
// upgraded forms and the superbits that double a Palette colour.
import { linked } from '../../utility/wiki/field-links.mjs';
import { gameTable } from './registry/data.mjs';
import { nodeId } from './registry/links.mjs';
import { sentence, spaced, tidy } from './registry/text.mjs';
import palette, { paletteDoublers } from './registry/world-5/palette.mjs';

const grouped = (value) => value.toLocaleString('en-US');
const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// Gods ------------------------------------------------------------------------------------------

// The blessingCurrency table (the blessing button's BlessingMaxLV-guarded chain): the attribute each slot debits.
// UPKEEP: the wiki's word for each debited attribute.
const CURRENCY_NAMES = { 'Gaming[0]': 'Bits', 'Sailing[1][0]': 'Sailing loot (treasure 1)', Money: 'Coins', 'Divinity[39]': 'Particles' };
const blessingCurrency = (slot, data) => {
  const currency = gameTable(data, 'blessingCurrency');
  return currency ? CURRENCY_NAMES[currency.bySlot[slot] ?? currency.otherwise] : undefined;
};
// UPKEEP: Coral Kid is the one raiser of the blessing max level that has a page (npc:Coral_Kid); Mr. Minehead, the Upgrade Vault and the Jelly Operator have none.
const CORAL_KID = 'npc:Coral_Kid';
// The blessBonus table (Divinity BlesssBonus): the nobisect slot scales by the active character's efficiency, clamped to
// scaleMin-scaleMax, with no cap.
// UPKEEP: godNodes (nodes/catalogs-b.mjs) ends the description with this sentence; re-check the anchor if its wording changes.
const BLESSING_ANCHOR = 'Blessing, Level 1: ';

// godNodes fills the blessing at level 1; the page rebuilds it with its `{` left in, so the
// calculator fills it. The minor bonus already had its `{` filled with the ceiling, so the
// blessing's is the only one left.
const enrichGods = (nodes, gods, data) => (gods || []).forEach((god, slot) => {
  const node = nodes[`god:DivGod${slot}`];
  const at = node?.description?.indexOf(BLESSING_ANCHOR) ?? -1;
  if (!god?.blessing || at < 0) return;
  Object.assign(node, {
    registry: true,
    description: `${node.description.slice(0, at)}${sentence(`Blessing: ${tidy(god.blessing)}`)}`,
    effect: { levelLabel: 'Blessing level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: god.blessingMultiplier } }] },
    cost: { formula: 'pow', args: { base: god.x4, rate: god.x5 }, currency: blessingCurrency(slot, data), note: 'No discounts apply.' }
  });
  // The blessingMaxLevel table (Divinity BlessingMaxLV): the base before its raisers.
  const maxLevel = gameTable(data, 'blessingMaxLevel');
  const bless = gameTable(data, 'blessBonus');
  addFields(node, [
    ...(maxLevel
      ? [linked(
        { label: 'Base max blessing level', value: `${maxLevel.base} (raised by Coral Kid, Mr. Minehead, the Upgrade Vault and the Jelly Operator)` },
        'maxRaisedBy',
        CORAL_KID
      )]
      : []),
    // UPKEEP: BlesssBonus multiplies every slot but Nobisect by 1 + 0.05 * Emporium 33 * God Rank, and the panel prints the product.
    ...(bless
      ? [slot === bless.nobisect
        ? { label: 'Blessing scaling', value: `x${bless.scaleMin} to x${bless.scaleMax}, higher for characters with less skill efficiency` }
        : { label: 'Bonus shown', value: 'Before the True Godly Blessings bonus' }]
      : [])
  ]);
});

// Artifacts -------------------------------------------------------------------------------------

const FORMS = [['ancient', 'Ancient form'], ['eldritch', 'Eldritch form'], ['sovereign', 'Sovereign form'], ['omnipotent', 'Omnipotent form'], ['transcendent', 'Transcendent form']];

// A chest finds an unowned artifact with chance chestChance / baseFindChance, so the base odds
// read "1 in N" before the Artifact Find Chance bonuses.
const enrichArtifacts = (nodes, artifacts) => (artifacts || []).forEach((artifact, index) => {
  const node = nodes[`artifact:Arti${index}`];
  if (!node) return;
  addFields(node, [
    ...FORMS.filter(([form]) => artifact[`${form}FormDescription`])
      .map(([form, label]) => ({ label, value: spaced(tidy(artifact[`${form}FormDescription`])) })),
    ...(artifact.baseFindChance ? [{ label: 'Base find odds per chest', value: `1 in ${grouped(artifact.baseFindChance)}` }] : [])
  ]);
});

// Superbits -------------------------------------------------------------------------------------

const enrichSuperbits = (nodes, gamingPalette, data) => {
  for (const [slot, superbit] of Object.entries(paletteDoublers(data))) {
    const node = nodes[`superbit:Superbit${superbit}`];
    const colour = gamingPalette?.[slot]?.name;
    if (node && colour) {
      addFields(node, [linked({ label: 'Doubles the Palette colour', value: spaced(colour) }, 'boosts', nodeId(palette, null, slot))]);
    }
  }
};

export const enrichWorld5 = (nodes, data) => {
  enrichGods(nodes, data.gods, data);
  enrichArtifacts(nodes, data.artifacts);
  enrichSuperbits(nodes, data.gamingPalette, data);
};
