// World 3 details that belong on pages which already exist, so they ride along as `fields` for
// the generic Details box rather than getting a kind of their own: the eleven trap items, the
// critters caught in them, and the monsters the Death Note tracks.
import { shinyCritterOf } from './edges/harvests.mjs';
import { gameTable } from './registry/data.mjs';
import { spaced } from './registry/text.mjs';

const grouped = (value) => value.toLocaleString('en-US');
const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// The trap screen prints a duration in the first unit whose threshold it exceeds, rounded: one hour reads
// "60 MINS" and forty hours reads "40 HOURS": DAYS start above three days. The units are wikiTables.trapTimeUnits
// (z-processing, the time text beside the CustomLists.TrapBoxInfo read); the last one has no threshold.
const trapTime = (seconds, units) => {
  const unit = units.find(({ above }) => above === null || seconds > above);
  return `${Math.round(seconds / unit.divisor)} ${unit.unit}`;
};

// The fourth column of an option says what the last multiplier is: 0 an EXP bonus, 1 a shiny one.
// UPKEEP: trapType 1 meaning Shiny is the trap screen's reading of that column; re-check it on a game patch.
// With no units the option reads without its time.
const trapOption = (option, units) => [
  ...(units ? [trapTime(option.trapTime, units)] : []),
  `x${grouped(option.quantity)} Qty`,
  `x${grouped(option.exp)} ${option.trapType === 1 ? 'Shiny' : 'Exp'}`
].join(' ');

// UPKEEP: trap type N is sold as the item TrapBoxSet(N + 1); re-check the naming on a game patch.
const trapItem = (type) => `TrapBoxSet${type + 1}`;

// A trap item with ID k unlocks trap types 0..k-1 and lets that many traps be placed at once. The
// last four trap items all carry ID 7, so they unlock the same seven types as Royal Traps.
const enrichTraps = (nodes, items, traps, units) => {
  for (const [rawName, item] of Object.entries(items || {})) {
    const node = nodes[`item:${rawName}`];
    if (item?.Type !== 'TRAP_BOX_SET' || !node) continue;
    const unlocked = Math.min(item.ID, traps?.length ?? 0);
    const fields = [{ label: 'Traps placed at once', value: item.ID }];
    for (let type = 0; type < unlocked; type++) {
      fields.push({
        label: spaced(items[trapItem(type)]?.displayName),
        value: (traps[type] || []).map((option) => trapOption(option, units))
      });
    }
    addFields(node, fields);
  }
};

const enrichCritters = (nodes, items, trappingInfo) => {
  for (const entry of trappingInfo || []) {
    const plain = nodes[`item:${entry?.critterName}`];
    const shiny = nodes[`item:${shinyCritterOf(entry?.critterName)}`];
    if (plain) {
      addFields(plain, [
        { label: 'Base trapping EXP', value: entry.exp },
        { label: 'Base shiny chance', value: `${grouped(entry.shinyChance)}%` },
        { label: 'Efficiency for bonus critters', value: entry.efficiencyReq }
      ]);
    }
    if (shiny && plain) addFields(shiny, [{ label: 'Shiny of', value: spaced(items?.[entry.critterName]?.displayName) }]);
  }
};

// The mini bosses are not in the Death Note's own list; the game keeps them in a separate row of
// ninjaExtraInfo that the Death Note screen reads with its own, shorter kill ladder.
const enrichDeathNote = (nodes, deathNote, miniBosses) => {
  const note = (rawName, value) => {
    const node = nodes[`monster:${rawName}`];
    if (!node) return;
    addFields(node, [{ label: 'Death Note', value }]);
  };
  // The world already shows in the monster's stats box, so the field only says the mob is tracked.
  for (const entry of deathNote || []) note(entry.rawName, 'Yes');
  for (const rawName of miniBosses || []) note(rawName, 'Mini boss');
};

export const enrichWorld3 = (nodes, data) => {
  const { items, traps, trappingInfo, deathNote, ninjaExtraInfo } = data;
  enrichTraps(nodes, items, traps, gameTable(data, 'trapTimeUnits'));
  enrichCritters(nodes, items, trappingInfo);
  // UPKEEP: ninjaExtraInfo[30] is the Death Note's mini boss row.
  enrichDeathNote(nodes, deathNote, ninjaExtraInfo?.[30]);
};
