// Nivo theme for statistics visualizations
import { cleanUnderscore, notateNumber, number2letter, worldColor } from '@utility/helpers';
import { cauldronColors, cauldronsIndexMapping } from '@parsers/alchemy';
import { cauldrons, deathNote, monsters, prayers, stamps } from '../../data/website-data';
import { altStampsMapping, stampsMapping } from '@parsers/stamps';
import { CLASSES, getBaseClass } from '@parsers/talents';

export const nivoTheme = {
  background: 'transparent',
  textColor: '#c9c9c9',
  fontSize: 14,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  axis: {
    domain: { line: { stroke: '#424242', strokeWidth: 1 } },
    legend: { text: { fill: '#ffffff', fontWeight: 600, fontSize: 14 } },
    ticks: {
      line: { stroke: '#424242', strokeWidth: 1 },
      text: { fill: '#c9c9c9', fontWeight: 500, fontSize: 12 }
    }
  },
  grid: { line: { stroke: '#2f3641', strokeWidth: 1 } },
  legends: { text: { fill: '#ffffff', fontWeight: 500 } },
  tooltip: {
    container: {
      background: '#1C252E',
      color: '#c9c9c9',
      fontWeight: 500,
      fontSize: 14,
      borderRadius: 8,
      boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px',
      border: '1px solid #424242',
      padding: 8
    }
  },
  labels: { text: { fill: '#ffffff', fontWeight: 600, fontSize: 11 } },
  annotations: {
    text: { fill: '#c9c9c9', fontWeight: 500 },
    link: { stroke: '#424242', strokeWidth: 1 },
    outline: { stroke: '#2f3641', strokeWidth: 2 }
  },
  dots: { text: { fill: '#ffffff', fontWeight: 500 } },
  crosshair: { line: { stroke: '#424242', strokeWidth: 1, strokeOpacity: 0.75 } }
};

export const customColors = [
  '#2087e8', '#94baee', '#48BB78', '#ED8936', '#9F7AEA',
  '#38B2AC', '#ECC94B', '#F56565', '#68D391', '#63B3ED'
];

export const getVisualizationMap = (classes) => ({
  topActivities: {
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
    type: 'bar',
    props: {},
    getData: (raw) => raw.filter(({ count }, index) => index > 4 && count > 50)
  },
  worldDistribution: {
    type: 'bar',
    getData: (raw) => raw.filter(({ _id }) => _id !== '0').toSorted((a, b) => a._id - b._id).map((item) => ({
      ...item,
      color: worldColor?.[item._id - 1]
    }))
  },
  topBubbles: {
    type: 'bar',
    props: {
      labelTextColor: '#482c2c',
      valueFormat: value => notateNumber(value),
      margin: {
        left: 130,
        right: 140
      },
      axisBottom: {
        legend: 'Levels',
        format: (value) => notateNumber(value)
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      legends: [{
        data: Object.values(cauldronColors).map((color, index) => ({
          label: `${cauldronsIndexMapping?.[index].capitalizeAll()}`,
          color
        })),
        anchor: 'bottom-right',
        direction: 'column',
        translateX: 120,
        itemWidth: 50,
        itemHeight: 20,
        itemsSpacing: 2,
        symbolSize: 20
      }]
    },
    getData: (raw) => {
      return raw.map(({ bubbleIndex, cauldronIndex, value }) => {
        const cauldron = cauldrons?.[cauldronsIndexMapping[cauldronIndex]];
        const bubble = cauldron?.[bubbleIndex];
        const bubbleName = cleanUnderscore(bubble?.bubbleName).toLowerCase().capitalizeAll();
        return {
          _id: bubbleName,
          count: value,
          color: cauldronColors?.[cauldronIndex]
        }
      }).toSorted((a, b) => a.count - b.count)
    }
  },
  topPrismaBubbles: {
    type: 'bar',
    props: {
      labelTextColor: '#482c2c',
      valueFormat: value => notateNumber(value),
      margin: {
        left: 130,
        right: 140
      },
      axisBottom: {
        legend: 'Levels',
        format: (value) => notateNumber(value)
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      legends: [{
        data: Object.values(cauldronColors).map((color, index) => ({
          label: `${cauldronsIndexMapping?.[index].capitalizeAll()}`,
          color
        })),
        anchor: 'bottom-right',
        direction: 'column',
        translateX: 120,
        itemWidth: 50,
        itemHeight: 20,
        itemsSpacing: 2,
        symbolSize: 20
      }]
    },
    getData: (raw) => {
      return raw.map(({ bubble, count }) => {
        const [, cauldronLetter, bubbleIndex] = bubble.match(/^([a-zA-Z_]+)(\d+)$/);
        const cauldronIndex = number2letter.indexOf(cauldronLetter);
        const cauldron = cauldrons?.[cauldronsIndexMapping[cauldronIndex]];
        const bubbleA = cauldron?.[bubbleIndex];
        const bubbleName = cleanUnderscore(bubbleA?.bubbleName).toLowerCase().capitalizeAll();
        return {
          _id: bubbleName,
          count,
          color: cauldronColors?.[cauldronIndex]
        }
      }).toSorted((a, b) => a.count - b.count)
    }
  },
  classDistribution: {
    type: 'pie',
    getData: (raw) => {
      return raw.filter(({ count }) => count > 70).map((item) => {
        return { ...item, _id: cleanUnderscore(classes?.[item?._id]) }
      }).toSorted((a, b) => b.count - a.count)
    }
  },
  classDistributionPerSlot: {
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

      for (let i = 0; i <= 9; i++) {
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
    type: 'bar',
    props: {
      axisLeft: {
        legend: 'Account Age (years)'
      }
    },
    getData: (raw) => raw.filter(({ _id }) => _id !== '-1').toSorted((a, b) => a._id - b._id)
  },
  topKilledMonsters: {
    type: 'bar',
    props: {
      enableTotals: true,
      enableLabel: false,
      valueFormat: value => notateNumber(value, 'Big'),
      margin: {
        left: 130,
        right: 150
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      axisBottom: {
        legend: 'Kills',
        format: (value) => notateNumber(value)
      },
      legends: [{
        data: worldColor.map((color, index) => ({ label: `World ${index + 1}`, color })),
        anchor: 'bottom-right',
        direction: 'column',
        translateX: 120,
        itemWidth: 50,
        itemHeight: 20,
        itemsSpacing: 2,
        symbolSize: 20
      }]

    },
    getData: (raw) => raw.filter(({ enemy }) => enemy !== '_').map(({ enemy, kills }) => {
      const world = deathNote.find(({ name }) => name === enemy)?.world;
      return {
        _id: cleanUnderscore(enemy),
        count: kills,
        color: worldColor?.[world]
      }
    }).toSorted((a, b) => a.count - b.count)
  },
  topPrayers: {
    type: 'bar',
    props: {
      enableTotals: true,
      enableLabel: false,
      valueFormat: value => notateNumber(value, 'Big'),
      margin: {
        left: 130,
        right: 60
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      axisBottom: {
        format: (value) => notateNumber(value)
      }
    },
    getData: (raw) => raw.map((item) => ({
      _id: cleanUnderscore(prayers?.[item.prayer]?.name),
      count: item.count
    })).toSorted((a, b) => a.count - b.count)
  },
  topStamps: {
    type: 'bar',
    props: {
      enableTotals: true,
      enableLabel: false,
      valueFormat: value => notateNumber(value, 'Big'),
      margin: {
        left: 170,
        right: 150
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      axisBottom: {
        format: (value) => notateNumber(value),
        legend: 'Levels'
      },
      legends: [{
        data: [
          { label: 'Combat', color: worldColor?.[0] },
          { label: 'Skills', color: worldColor?.[1] },
          { label: 'Misc', color: worldColor?.[2] }
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
    getData: (raw) => raw.map((item) => {
      const category = stamps?.[stampsMapping?.[item?.stampArrayIndex]]
      const stamp = category?.[item.stampIndex];
      return {
        _id: cleanUnderscore(stamp?.displayName),
        count: item.level,
        color: worldColor?.[item?.stampArrayIndex]
      }
    }).toSorted((a, b) => a.count - b.count)
  },
  topExaltedStamps: {
    type: 'bar',
    props: {
      enableTotals: true,
      enableLabel: false,
      valueFormat: value => notateNumber(value, 'Big'),
      margin: {
        left: 170,
        right: 150
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      },
      axisBottom: {
        format: (value) => notateNumber(value),
        legend: 'Levels'
      },
      legends: [{
        data: [
          { label: 'Combat', color: worldColor?.[0] },
          { label: 'Skills', color: worldColor?.[1] },
          { label: 'Misc', color: worldColor?.[2] }
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
    getData: (raw) => raw.map((item) => {
      const [, categoryIndex, stampIndex] = item.stamp.match(/^([a-zA-Z_]+)(\d+)$/);
      const category = stamps?.[altStampsMapping?.[categoryIndex]];
      const stamp = category?.[stampIndex];
      return {
        _id: cleanUnderscore(stamp?.displayName),
        count: item.count,
        color: worldColor?.[number2letter.indexOf(categoryIndex)]
      }
    }).toSorted((a, b) => a.count - b.count)
  }
});