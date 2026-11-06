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

// A form's colour, the theme's (palette.identity.artifactTiers), as an sx callback: { color: artifactTierColor(3) }
export const artifactTierColor = (tier) => (theme) => (theme.vars || theme).palette.identity.artifactTiers[Math.max(0, (tier || 1) - 1)];
