export const artifactTierColor = (acquired) => {
  if (acquired === 6) return '#b388ff';
  if (acquired === 5) return '#00ffde';
  if (acquired === 4) return '#67da80';
  if (acquired === 3) return '#ffa092';
  if (acquired === 2) return 'gold';
  return 'white';
};
