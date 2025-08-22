import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Typography, useMediaQuery } from '@mui/material';
import { nivoTheme } from './consts';

const BarVisualization = ({
                            data,
                            indexKey,
                            keys,
                            label,
                            color,
                            colors,
                            layout = 'horizontal',
                            axisBottom,
                            axisLeft,
                            valueFormat,
                            margin,
                            enableTotals = true,
                            enableLabel = false,
                            legends,
                            labelTextColor = '#ffffff'
                          }) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  return (
    <>
      <Typography>{label}</Typography>
      <ResponsiveBar
        data={data}
        keys={keys || ['count']}
        indexBy={indexKey}
        margin={{ top: 30, right: 30, bottom: 60, left: 70, ...margin }}
        padding={0.3}
        borderRadius={4}
        layout={layout}
        enableTotals={isSm || enableTotals}
        enableLabel={isSm ? false : enableLabel}
        axisBottom={{
          legend: 'Players',
          legendPosition: 'middle',
          legendOffset: isSm ? 20 : 45,
          ...axisBottom,
          ...(isSm ? { format: () => '', tickSize: 0, tickPadding: 0, tickRotation: 0 } : {})
        }}
        axisLeft={{
          legend: label,
          legendPosition: 'middle',
          legendOffset: -50,
          ...axisLeft
        }}
        colors={colors || (({ data }) => {
          return data?.color || color;
        })}
        legends={legends}
        valueFormat={valueFormat ? valueFormat : null}
        animate={true}
        motionConfig="gentle"
        theme={nivoTheme}
        labelTextColor={labelTextColor}
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
  )
};

export default BarVisualization; 