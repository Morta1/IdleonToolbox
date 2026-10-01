import { cleanVaultName } from '../nodes/vault.mjs';

// What Glimbo takes in trade at his Swap Meet, and which Upgrade Vault upgrade each trade raises the
// max level of. The lists are parallel and live in research.json: [27] the item, [26] the vault
// index it feeds. The edges hang off his NPC node, so his own page lists the trades.
//
// No cost on the edge: a trade's price is a curve off the number already made (the base in [28] is
// the growth factor, not a price), so a save-less page has nothing honest to print.

// The vault pages' own cleaner, so a trade row and the upgrade page it points at read one name.
const cleanUpgradeName = (name) => (name ? cleanVaultName(name) : name);

export const glimboEdges = (research, upgradeVault) => {
  const itemNames = research?.[27] || [];
  const vaultIndexes = research?.[26] || [];
  return itemNames
    .map((rawName, index) => ({ rawName, upgrade: cleanUpgradeName(upgradeVault?.[Number(vaultIndexes[index])]?.name) }))
    .filter(({ rawName, upgrade }) => rawName && upgrade)
    .map(({ rawName, upgrade }) => ({
      from: 'npc:Glimbo',
      to: `item:${rawName}`,
      rel: 'buys',
      meta: { upgrade },
      source: 'glimbo'
    }));
};
