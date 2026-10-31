// Chart chrome from the theme's roles, and the one series palette (Charts board), validated per
// scheme on surface.card. Slots are taken from 1 in order and never cycled: a ninth series is Other.
// Slot 1 is every single-series chart; the theme's primary is too pale for a mark in dark.
export const SERIES = {
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  light: ['#1565c0', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
};

export const seriesColors = (mode) => SERIES[mode] ?? SERIES.dark;

// nivo computes with the colors it is given, so this reads theme.palette (real values), not theme.vars.
export const chartTheme = (theme, { tickFontSize = 12 } = {}) => {
  const { text, background, divider, mode } = theme.palette;
  const ink = mode === 'dark' ? '255, 255, 255' : '0, 0, 0';
  return {
    background: 'transparent',
    text: { fill: text.secondary, fontSize: 12, fontFamily: theme.typography.fontFamily },
    axis: {
      domain: { line: { stroke: `rgba(${ink}, 0.23)`, strokeWidth: 1 } },
      ticks: { line: { stroke: `rgba(${ink}, 0.23)`, strokeWidth: 1 }, text: { fill: text.muted, fontSize: tickFontSize } },
      legend: { text: { fill: text.secondary, fontSize: 12, fontWeight: 500 } }
    },
    grid: { line: { stroke: `rgba(${ink}, 0.08)`, strokeWidth: 1 } },
    legends: { text: { fill: text.secondary, fontWeight: 500 } },
    labels: { text: { fill: text.secondary, fontSize: 12, fontWeight: 500 } },
    dots: { text: { fill: text.secondary } },
    crosshair: { line: { stroke: text.muted, strokeWidth: 1, strokeOpacity: 1 } },
    tooltip: {
      container: {
        background: background.paper,
        color: text.secondary,
        fontSize: 14,
        border: `1px solid ${divider}`,
        borderRadius: 8,
        boxShadow: theme.shadows[8],
        padding: 8
      }
    }
  };
};
