// Royal Guardian timers run from minutes to years apart, so a single unit reads badly across the
// whole range.
export const formatEta = (hours) => {
  if (!(hours > 0)) return 'ready now';
  if (hours < 1) return `${Math.ceil(hours * 60)}m`;
  // Hours up to 5 days so the ETA can be read against the daily reset.
  if (hours < 120) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)}d`;
  return days < 365 * 1000 ? `${Math.round(days / 365)}y` : '1000y+';
};
