import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Typography, useMediaQuery } from '@mui/material';
import { nivoTheme } from './consts';

const truncate = (str, max) => str?.length > max ? str.slice(0, max) + '…' : str;

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
                            labelTextColor = '#ffffff',
                            scale,
                          }) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  const resolvedMargin = isSm
    ? {
      top: 10,
      right: 30,
      bottom: 10,
      left: Math.min(margin?.left ?? 40, 100),
    }
    : { top: 30, right: 30, bottom: 60, left: 70, ...margin };

  return (
    <>
      <Typography>{label}</Typography>
      <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveBar
        data={data}
        keys={keys || ['count']}
        indexBy={indexKey}
        margin={resolvedMargin}
        padding={0.3}
        borderRadius={4}
        layout={layout}
        enableTotals={isSm || enableTotals}
        enableLabel={isSm ? false : enableLabel}
        valueScale={scale}
        axisBottom={{
          legend: 'Players',
          legendPosition: 'middle',
          legendOffset: isSm ? 20 : 45,
          ...axisBottom,
          ...(isSm ? { format: () => '', tickSize: 0, tickPadding: 0, tickRotation: 0, legend: '' } : {})
        }}
        axisLeft={{
          legend: label,
          legendPosition: 'middle',
          legendOffset: -50,
          ...axisLeft,
          ...(isSm ? { format: (v) => truncate(String(v), 12), legend: '' } : {})
        }}
        colors={colors || (({ data }) => {
          return data?.color || color;
        })}
        legends={isSm ? undefined : legends}
        valueFormat={valueFormat ? valueFormat : null}
        animate={true}
        motionConfig="gentle"
        theme={isSm ? { ...nivoTheme, axis: { ...nivoTheme.axis, ticks: { ...nivoTheme.axis.ticks, text: { ...nivoTheme.axis.ticks.text, fontSize: 10 } } } } : nivoTheme}
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
      </div>
    </>
  )
};

export default BarVisualization;
