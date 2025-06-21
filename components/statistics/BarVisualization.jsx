import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Typography } from '@mui/material';
import { nivoTheme } from './consts';

const BarVisualization = ({ data, indexKey, keys, label, color, layout = 'horizontal', axisBottom, axisLeft, valueFormat, margin, enableTotals, enableLabel }) => (
  <>
    <Typography>{label}</Typography>
    <ResponsiveBar
      data={data}
      keys={['count']}
      indexBy={indexKey}
      margin={{ top: 30, right: 30, bottom: 60, left: 70, ...margin }}
      padding={0.3}
      borderRadius={4}
      layout={layout}
      enableTotals={enableTotals}
      enableLabel={enableLabel}
      axisBottom={{
        legend: 'Players',
        legendPosition: 'middle',
        legendOffset: 45,
        ...axisBottom
      }}
      axisLeft={{
        legend: label,
        legendPosition: 'middle',
        legendOffset: -50,
        ...axisLeft
      }}
      valueFormat={valueFormat ? valueFormat : null}
      colors={color}
      animate={true}
      motionConfig="gentle"
      theme={nivoTheme}
      labelTextColor="#ffffff"
      enableGridX={false}
      enableGridY={true}
      borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
      defs={[
        {
          id: 'gradientA',
          type: 'linearGradient',
          colors: [
            { offset: 0, color: 'inherit' },
            { offset: 100, color: 'inherit', opacity: 0.8 }
          ]
        }
      ]}
      fill={[
        { match: '*', id: 'gradientA' }
      ]}
    />
  </>
);

export default BarVisualization; 