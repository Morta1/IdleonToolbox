// Data-free on purpose: the goals registry reads the tier names from here without loading React.
export const ARTIFACT_TIERS = [
  { level: 1, short: 'Base', full: 'Base' },
  { level: 2, short: 'Anc', full: 'Ancient' },
  { level: 3, short: 'Eld', full: 'Eldritch' },
  { level: 4, short: 'Sov', full: 'Sovereign' },
  { level: 5, short: 'Omn', full: 'Omnipotent' },
  { level: 6, short: 'Tra', full: 'Transcendent' },
  { level: 7, short: 'Ver', full: 'Verisimilitude' }
];

export const artifactTierColor = (acquired) => {
  if (acquired === 7) return '#ff7eb6';
  if (acquired === 6) return '#b388ff';
  if (acquired === 5) return '#00ffde';
  if (acquired === 4) return '#67da80';
  if (acquired === 3) return '#ffa092';
  if (acquired === 2) return 'gold';
  return 'white';
};
