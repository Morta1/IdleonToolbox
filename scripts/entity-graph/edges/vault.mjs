// Which items raise an Upgrade Vault upgrade's max level, from the same parallel lists Glimbo's
// trades come from (research.json [27] the item, [26] the vault index). The edge runs vault -> item,
// the direction a page reads: the upgrade lists what feeds it, and an item finds the upgrade it
// feeds from the same edge. Glimbo's own `buys` edges stay, since they are what puts the trade on his page.
import { isPlaceholder, vaultId } from '../nodes/vault.mjs';

export const vaultEdges = (research, upgradeVault) => {
  const itemNames = research?.[27] || [];
  const vaultIndexes = research?.[26] || [];
  return itemNames
    .map((rawName, position) => ({ rawName, index: Number(vaultIndexes[position]) }))
    .filter(({ rawName, index }) => rawName && upgradeVault?.[index] && !isPlaceholder(upgradeVault[index]))
    .map(({ rawName, index }) => ({
      from: vaultId(index),
      to: `item:${rawName}`,
      rel: 'maxRaisedBy',
      meta: {},
      source: 'vault'
    }));
};
