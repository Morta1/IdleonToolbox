// World 5 details that belong on pages which already exist, so they ride along as `fields` or as the
// level calculator rather than getting a kind of their own: the gods' blessings, the artifacts'
// upgraded forms and the superbits that double a Palette colour.
import { sentence, tidy } from './registry/text.mjs';
import { PALETTE_DOUBLERS } from './registry/world-5/palette.mjs';

const spaced = (text) => String(text ?? '').replace(/_/g, ' ');
const grouped = (value) => value.toLocaleString('en-US');
const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// Gods ------------------------------------------------------------------------------------------

// UPKEEP: the blessing button pays bits (Gaming[0]) for slots 0, 2, 4, 8, sailing treasure 0 (Sailing[1][0]) for 1, coins for 3 and 6, particles (Divinity[39]) for 5, 7, 9.
const BLESSING_CURRENCY = { 0: 'Bits', 1: 'Sailing loot (treasure 1)', 2: 'Bits', 3: 'Coins', 4: 'Bits', 5: 'Particles', 6: 'Coins', 7: 'Particles', 8: 'Bits', 9: 'Particles' };
// UPKEEP: BlessingMaxLV base 100 (Divinity.js:36-42), raised by Coral Kid, Minehead, Vault 76 and two Jelly bonuses.
const BLESSING_BASE_MAX = 100;
// UPKEEP: BlesssBonus slot 2 (Divinity.js:44-62) scales by the active character's efficiency, clamped to 0.1-1.8, with no cap.
const NOBISECT = 2;
// UPKEEP: godNodes (nodes/catalogs-b.mjs) ends the description with this sentence; re-check the anchor if its wording changes.
const BLESSING_ANCHOR = 'Blessing, Level 1: ';

// godNodes fills the blessing at level 1; the page rebuilds it with its `{` left in, so the
// calculator fills it. The minor bonus already had its `{` filled with the ceiling, so the
// blessing's is the only one left.
const enrichGods = (nodes, gods) => (gods || []).forEach((god, slot) => {
  const node = nodes[`god:DivGod${slot}`];
  const at = node?.description?.indexOf(BLESSING_ANCHOR) ?? -1;
  if (!god?.blessing || at < 0) return;
  Object.assign(node, {
    registry: true,
    description: `${node.description.slice(0, at)}${sentence(`Blessing: ${tidy(god.blessing)}`)}`,
    effect: { levelLabel: 'Blessing level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: god.blessingMultiplier } }] },
    cost: { formula: 'pow', args: { base: god.x4, rate: god.x5 }, currency: BLESSING_CURRENCY[slot], note: 'No discounts apply.' }
  });
  addFields(node, [
    { label: 'Base max blessing level', value: `${BLESSING_BASE_MAX} (raised by Coral Kid, Mr. Minehead, the Upgrade Vault and the Jelly Operator)` },
    ...(slot === NOBISECT ? [{ label: 'Blessing scaling', value: 'x0.1 to x1.8, higher for characters with less skill efficiency' }] : [])
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

const enrichSuperbits = (nodes, gamingPalette) => {
  for (const [slot, superbit] of Object.entries(PALETTE_DOUBLERS)) {
    const node = nodes[`superbit:Superbit${superbit}`];
    const colour = gamingPalette?.[slot]?.name;
    if (node && colour) addFields(node, [{ label: 'Doubles the Palette colour', value: spaced(colour) }]);
  }
};

export const enrichWorld5 = (nodes, { gods, artifacts, gamingPalette }) => {
  enrichGods(nodes, gods);
  enrichArtifacts(nodes, artifacts);
  enrichSuperbits(nodes, gamingPalette);
};
