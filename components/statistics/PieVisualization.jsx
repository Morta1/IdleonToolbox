import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Typography } from '@mui/material';
import { nivoTheme } from './consts';

const PieVisualization = ({ data, label, colors, legends, isMd }) => (
  <>
    <Typography>{label}</Typography>
    <ResponsivePie
      data={data}
      margin={{ top: 30, right: 30, bottom: 60, left: 30 }}
      innerRadius={0.5}
      padAngle={1.5}
      cornerRadius={4}
      colors={colors}
      borderWidth={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
      theme={nivoTheme}
      enableArcLabels={true}
      arcLabelsTextColor="#fff"
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
      legends={isMd ? [] : legends}
    />
  </>
);

export default PieVisualization;