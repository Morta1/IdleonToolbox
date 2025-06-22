// Nivo theme for statistics visualizations
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { cauldronColors, cauldronsIndexMapping } from '@parsers/alchemy';
import { cauldrons, deathNote, prayers } from '../../data/website-data';
import { worldColor } from '../../pages/account/world-3/death-note';

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
        right: 60
      },
      axisBottom: {
        legend: 'Levels',
        format: (value) => notateNumber(value)
      },
      axisLeft: {
        legendOffset: 0,
        legend: ''
      }
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
  classDistribution: {
    type: 'pie',
    getData: (raw) => {
      return raw.filter(({ count }) => count > 70).map((item) => {
        return { ...item, _id: cleanUnderscore(classes?.[item?._id]) }
      }).toSorted((a, b) => b.count - a.count)
    }
  },
  accountAge: {
    type: 'bar',
    props: {
      axisLeft: {
        legend: 'Account Age (years)'
      }
    },
    getData: (raw) => raw.filter(({ _id }) => _id !== '-1').toSorted((a, b) => b.count - a.count)
  },
  topKilledMonsters: {
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
        legend: 'Kills',
        format: (value) => notateNumber(value)
      }
    },
    getData: (raw) => raw.filter(({ enemy }) => enemy !== '_').map(({ enemy, kills }) => {
      const world = deathNote.find(({ name }) => name === enemy)?.world;
      return {
        _id: cleanUnderscore(enemy),
        count: kills,
        color: worldColor?.[world]
      }
    }).toSorted((a, b) => a.count - b.count)
  }, topPrayers: {
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
      ...item,
      prayer: cleanUnderscore(prayers?.[item.prayer]?.name)
    })).toSorted((a, b) => a.count - b.count)
  }
});