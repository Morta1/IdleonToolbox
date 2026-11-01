// Chart chrome from the theme's roles, and the one series palette (Charts board), validated per
// scheme on surface.card. Slots are taken from 1 in order and never cycled: a ninth series is Other.
// Slot 1 is every single-series chart; the theme's primary is too pale for a mark in dark.
export const SERIES = {
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  light: ['#1565c0', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
};

export const seriesColors = (mode) => SERIES[mode] ?? SERIES.dark;

// The chart's two lines (Charts board, "Marks and chrome"): the 8% grid and the 23% edge the marks stand on.
export const chartLines = (theme) => {
  const ink = theme.palette.mode === 'dark' ? '255, 255, 255' : '0, 0, 0';
  return { grid: `rgba(${ink}, 0.08)`, edge: `rgba(${ink}, 0.23)` };
};
