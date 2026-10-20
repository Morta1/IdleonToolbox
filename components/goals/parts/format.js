import { numberWithCommas } from '@utility/helpers';

export const formatNumber = (n) => numberWithCommas(Math.round(n));

// Floored so 89.99% never reads as a reached 90%
export const formatPercent = (n) => `${Math.floor(n)}%`;
