import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Typography } from '@mui/material';
import { nivoTheme } from './consts';

const PieVisualization = ({ data, label, colors, isMd, isSm }) => (
  <>
    <Typography>{label}</Typography>
    <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
      {!isMd && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            maxHeight: '100%',
            columnGap: 16,
            overflow: 'hidden'
          }}
        >
          {data.map((datum, index) => (
            <div
              key={datum.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 18 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colors[index % colors.length],
                  flexShrink: 0
                }}
              />
              <span style={{ color: '#fff', fontSize: 12, whiteSpace: 'nowrap' }}>{datum.label}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
    <ResponsivePie
      data={data}
      margin={isSm
        ? { top: 20, right: 10, bottom: 30, left: 10 }
        : { top: 30, right: 30, bottom: 60, left: 30 }
      }
      innerRadius={0.5}
      padAngle={1.5}
      cornerRadius={4}
      colors={colors}
      borderWidth={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
      theme={nivoTheme}
      enableArcLabels={true}
      arcLabelsTextColor="#fff"
      enableArcLinkLabels={isMd && !isSm}
      arcLinkLabelsTextColor="#fff"
      arcLinkLabelsThickness={2}
      arcLabelsSkipAngle={10}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsColor={{ from: 'color' }}
      activeOuterRadiusOffset={4}
      tooltip={({ datum }) => (
        <div style={{
          color: '#fff',
          background: '#1C252E',
          padding: 8,
          borderRadius: 8,
          border: '1px solid #424242',
          minWidth: 120
        }}>
          <strong>{datum.label}</strong>: {datum.value}
        </div>
      )}
      legends={[]}
    />
      </div>
    </div>
  </>
);

export default PieVisualization;