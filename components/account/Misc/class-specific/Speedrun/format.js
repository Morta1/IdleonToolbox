// A run is a few hundred seconds long, so sub-minute precision is what matters; anything past
// that only needs to read as "not happening this run".
export const formatSeconds = (seconds) => {
  if (!Number.isFinite(seconds)) return '-';
  if (seconds < 1) return '<1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
