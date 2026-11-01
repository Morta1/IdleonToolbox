import { cleanUnderscore, notateNumber, number2letter, worldColor } from '@utility/helpers';
import { CAULDRON_INFO, cauldronsIndexMapping } from '@parsers/world-2/alchemy';
import { cauldrons, deathNote, monsters, prayers, stamps } from '@website-data';
import { altStampsMapping, stampsMapping } from '@parsers/world-1/stamps';
import { CLASSES, getBaseClass } from '@parsers/talents';

const STAMP_TYPES = { combat: 'Combat', skills: 'Skills', misc: 'Misc' };
const bubbleName = (cauldronIndex, bubbleIndex) =>
  cleanUnderscore(cauldrons?.[cauldronsIndexMapping[cauldronIndex]]?.[bubbleIndex]?.bubbleName).toLowerCase().capitalizeAll();

// One entry per chart the API sends: its Panel's title and subtitle, and its form. form 'rank' entries turn the
// raw answer into rows ({ key, name, tag, value }); the ones with a nivo `type` are not moved yet.
export const getVisualizationMap = (classes) => ({
  topActivities: {
    title: 'Top activities', subtitle: 'Characters',
    type: 'pie',
    props: {
      valueFormat: value => notateNumber(value),
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      margin: {
        left: 110
      },
      axisBottom: {
        format: (value) => notateNumber(value),
        legend: 'Characters'
      }
    },
    getData: (raw) => {
      const arr = raw
        .map(({ count, activity }) => ({
          _id: cleanUnderscore(monsters?.[activity]?.AFKtype.toLowerCase().capitalizeAll() || 'other'),
          count,
          activity: monsters?.[activity]?.AFKtype
        }))
        .filter(
          (item, i, self) =>
            item.activity && i === self.findIndex(t => t.activity === item.activity)
        );
      return arr.toSorted((a, b) => b.count - a.count);
    }
  },
  totalLevels: {
    title: 'Total levels', subtitle: 'Players',
    type: 'bar',
    props: {},
    getData: (raw) => raw.filter(({ count }, index) => index > 4 && count > 50)
  },
  worldDistribution: {
    title: 'World distribution', subtitle: 'Players',
    type: 'bar',
    props: {
      margin: {
        right: 45
      }
    },
    getData: (raw) => raw.filter(({ _id }) => _id !== '0').toSorted((a, b) => a._id - b._id).map((item) => ({
      ...item,
      color: worldColor?.[item._id - 1]
    }))
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
    title: 'Class distribution', subtitle: 'Characters',
    type: 'pie',
    getData: (raw) => {
      return raw.filter(({ count }) => count > 70).map((item) => {
        return { ...item, _id: cleanUnderscore(classes?.[item?._id]) }
      }).toSorted((a, b) => b.count - a.count)
    }
  },
  classDistributionPerSlot: {
    title: 'Class distribution per slot', subtitle: 'Characters',
    type: 'bar',
    props: {
      layout: 'vertical',
      groupMode: 'stacked',
      enableTotals: false,
      enableLabel: true,
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      axisBottom: {
        legend: 'Slots'
      },
      margin: {
        right: 150
      },
      colors: [worldColor?.[2], worldColor?.[4], worldColor?.[0], worldColor?.[3]],
      legends: [{
        data: [
          { label: CLASSES.Beginner, color: worldColor?.[2] },
          { label: CLASSES.Warrior, color: worldColor?.[4] },
          { label: CLASSES.Archer, color: worldColor?.[0] },
          { label: CLASSES.Mage, color: worldColor?.[3] }
        ],
        anchor: 'bottom-right',
        direction: 'column',
        translateX: 120,
        itemWidth: 50,
        itemHeight: 20,
        itemsSpacing: 2,
        symbolSize: 20
      }]

    },
    keys: [CLASSES.Beginner, CLASSES.Warrior, CLASSES.Archer, CLASSES.Mage],
    getData: (raw) => {
      const slotMap = new Map();

      for (let i = 0; i <= 10; i++) {
        slotMap.set(i, { _id: `Slot ${i + 1}` });
      }

      raw.forEach(item => {
        const slotData = slotMap.get(item.slot);
        if (slotData && item.count > 50) {
          const baseClass = getBaseClass(classes?.[item?.class]);
          if (!slotData[baseClass]) {
            slotData[baseClass] = 0;
          }
          slotData[baseClass] += item.count;
        }
      });

      return Array.from(slotMap.values());
    }
  },
  accountAge: {
    title: 'Account age', subtitle: 'Players',
    type: 'bar',
    props: {
      axisLeft: {
        legend: 'Account Age (years)'
      }
    },
    getData: (raw) => raw.filter(({ _id }) => _id !== '-1').toSorted((a, b) => a._id - b._id)
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
