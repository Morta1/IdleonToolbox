import { cleanUnderscore, formatNum, number2letter, worldColor } from '@utility/helpers';
import { chartNum } from '@utility/chartScale';
import { CAULDRON_INFO, cauldronsIndexMapping } from '@parsers/world-2/alchemy';
import { cauldrons, deathNote, monsters, prayers, stamps } from '@website-data';
import { altStampsMapping, stampsMapping } from '@parsers/world-1/stamps';
import { CLASSES, getBaseClass } from '@parsers/talents';

const STAMP_TYPES = { combat: 'Combat', skills: 'Skills', misc: 'Misc' };
const bubbleName = (cauldronIndex, bubbleIndex) =>
  cleanUnderscore(cauldrons?.[cauldronsIndexMapping[cauldronIndex]]?.[bubbleIndex]?.bubbleName).toLowerCase().capitalizeAll();

// One entry per chart the API sends: its Panel's title and subtitle, and its form. 'rank' and 'share' entries turn
// the raw answer into rows ({ key, name, tag, value }); 'spread' and 'stacked' entries into buckets ({ key, label,
// range, values }), a stacked one with a value per name in its `series`.
export const getVisualizationMap = (classes) => ({
  topActivities: {
    form: 'share', title: 'Top activities', subtitle: 'Characters', unit: 'Characters', nameLabel: 'Activity', otherNoun: 'activities',
    // One activity spans many maps (Fighting is every monster map), so each type adds up all of its maps.
    rows: (raw) => {
      const byType = new Map();
      for (const { count, activity } of raw) {
        const type = monsters?.[activity]?.AFKtype;
        if (type) byType.set(type, (byType.get(type) ?? 0) + count);
      }
      return [...byType].map(([type, value]) => ({ key: type, name: cleanUnderscore(type.toLowerCase().capitalizeAll()), value }));
    }
  },
  totalLevels: {
    form: 'spread', title: 'Total levels', subtitle: 'Players', unit: 'Players', nameLabel: 'Total level',
    // A bucket runs to the next one the API sends, so its range survives the buckets the chart leaves out.
    rows: (raw) => raw.map(({ _id, count }, index) => {
      const from = Number.parseInt(_id, 10);
      const next = raw[index + 1] ? Number.parseInt(raw[index + 1]._id, 10) : null;
      const open = String(_id).endsWith('+') || next == null;
      return {
        key: String(_id),
        label: `${chartNum(from)}${open ? '+' : ''}`,
        range: open ? `${formatNum(from)}+` : `${formatNum(from)} to ${formatNum(next - 1)}`,
        values: { count },
        keep: index > 4 && count > 50
      };
    }).filter((row) => row.keep)
  },
  worldDistribution: {
    form: 'spread', title: 'World distribution', subtitle: 'Players', unit: 'Players', nameLabel: 'World',
    // The game's own world colors, allowed because every column is named (Decision 2).
    rows: (raw) => raw.filter(({ _id }) => Number(_id) >= 1).toSorted((a, b) => a._id - b._id)
      .map(({ _id, count }) => ({ key: String(_id), label: `W${_id}`, range: `World ${_id}`, color: worldColor[_id - 1], values: { count } }))
  },
  topBubbles: {
    form: 'rank', title: 'Top bubbles', subtitle: 'Levels', unit: 'Levels', nameLabel: 'Bubble', tagLabel: 'Cauldron',
    rows: (raw) => raw.map(({ bubbleIndex, cauldronIndex, value }) => ({
      key: `${cauldronIndex}-${bubbleIndex}`,
      name: bubbleName(cauldronIndex, bubbleIndex),
      tag: CAULDRON_INFO[cauldronIndex]?.displayName,
      value
    }))
  },
  topPrismaBubbles: {
    form: 'rank', title: 'Top prisma bubbles', subtitle: 'Levels', unit: 'Levels', nameLabel: 'Bubble', tagLabel: 'Cauldron',
    rows: (raw) => raw.map(({ bubble, count }) => {
      const [, letter, bubbleIndex] = bubble.match(/^([a-zA-Z_]+)(\d+)$/);
      const cauldronIndex = number2letter.indexOf(letter);
      return {
        key: bubble,
        name: bubbleName(cauldronIndex, bubbleIndex),
        tag: CAULDRON_INFO[cauldronIndex]?.displayName,
        value: count
      };
    })
  },
  classDistribution: {
    form: 'share', title: 'Class distribution', subtitle: 'Characters', unit: 'Characters', nameLabel: 'Class', otherNoun: 'classes',
    // Every class: the small ones fold into Other, so the shares add up to the whole.
    rows: (raw) => raw.map((item) => ({ key: String(item._id), name: cleanUnderscore(classes?.[item._id]), value: item.count }))
  },
  classDistributionPerSlot: {
    form: 'stacked', title: 'Class distribution per slot', subtitle: 'Characters', unit: 'Characters', nameLabel: 'Slot',
    // Each base class keeps its series slot whatever its count, in this order, Beginner at the bottom.
    series: [CLASSES.Beginner, CLASSES.Warrior, CLASSES.Archer, CLASSES.Mage],
    rows: (raw) => {
      const slots = Array.from({ length: 11 }, (_, i) => ({ key: `slot-${i}`, label: String(i + 1), range: `Slot ${i + 1}`, values: {} }));
      for (const item of raw) {
        const slot = slots[item.slot];
        if (!slot || item.count <= 50) continue;
        const baseClass = getBaseClass(classes?.[item.class]);
        slot.values[baseClass] = (slot.values[baseClass] ?? 0) + item.count;
      }
      return slots;
    }
  },
  accountAge: {
    form: 'spread', title: 'Account age', subtitle: 'Players, by years since the account was made', unit: 'Players', nameLabel: 'Years',
    rows: (raw) => raw.filter(({ _id }) => _id != null && _id >= 0).toSorted((a, b) => a._id - b._id)
      .map(({ _id, count }) => ({
        key: String(_id), label: String(_id), range: _id === 0 ? 'Under 1 year' : _id === 1 ? '1 year' : `${_id} years`, values: { count }
      }))
  },
  topKilledMonsters: {
    form: 'rank', title: 'Top killed monsters', subtitle: 'Kills', unit: 'Kills', nameLabel: 'Monster', tagLabel: 'World',
    rows: (raw) => raw.filter(({ enemy }) => enemy !== '_').map(({ enemy, kills }) => {
      const world = deathNote.find(({ name }) => name === enemy)?.world;
      return { key: enemy, name: cleanUnderscore(enemy), tag: world != null ? `W${world + 1}` : undefined, value: kills };
    })
  },
  topPrayers: {
    form: 'rank', title: 'Top prayers', subtitle: 'Players with each prayer equipped', unit: 'Players', nameLabel: 'Prayer',
    rows: (raw) => raw.map(({ prayer, count }) => ({
      key: String(prayer),
      name: cleanUnderscore(prayers?.[prayer]?.name),
      value: count
    }))
  },
  topStamps: {
    form: 'rank', title: 'Top stamps', subtitle: 'Levels', unit: 'Levels', nameLabel: 'Stamp', tagLabel: 'Type',
    rows: (raw) => raw.map(({ stampArrayIndex, stampIndex, level }) => ({
      key: `${stampArrayIndex}-${stampIndex}`,
      name: cleanUnderscore(stamps?.[stampsMapping?.[stampArrayIndex]]?.[stampIndex]?.displayName),
      tag: STAMP_TYPES[stampsMapping?.[stampArrayIndex]],
      value: level
    }))
  },
  topExaltedStamps: {
    form: 'rank', title: 'Top exalted stamps', subtitle: 'Levels', unit: 'Levels', nameLabel: 'Stamp', tagLabel: 'Type',
    rows: (raw) => raw.map(({ stamp, count }) => {
      const [, letter, stampIndex] = stamp.match(/^([a-zA-Z_]+)(\d+)$/);
      return {
        key: stamp,
        name: cleanUnderscore(stamps?.[altStampsMapping?.[letter]]?.[stampIndex]?.displayName),
        tag: STAMP_TYPES[altStampsMapping?.[letter]],
        value: count
      };
    })
  }
});
