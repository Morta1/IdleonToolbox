// Single-page game systems that make or consume items: the town's anvil, the World 6 beanstalk.
// Their own kind, because they are neither a shop (nothing is bought) nor an NPC (nobody stands
// there), and listed nowhere, the same as the shops: they are reached from their items.
export const stationNodes = () => ({
  'station:anvil': {
    kind: 'station',
    rawName: 'anvil',
    name: 'Anvil',
    icon: '/data/SmithingHammerChisel.png',
    category: 'World 1'
  },
  'station:beanstalk': {
    kind: 'station',
    rawName: 'beanstalk',
    name: 'Beanstalk',
    icon: '/etc/beanstalk1.png',
    category: 'World 6',
    description: 'Feed it golden food to rank that food up: its bonus then applies without equipping it.'
  }
});
