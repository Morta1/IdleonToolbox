// Which anvil upgrade points each monster material buys. The anvil's "Points From Mats" are paid
// for in one material at a time, switching to the next once the bought count reaches its
// threshold (getAnvilUpgradeCostItem): Spore Cap pays for points 1 to 5, Frog Leg for 6 to 15,
// and so on up the list.
//
// An annotation rather than an edge, because the anvil is not an entity: there is no node for an
// edge to come from, and inventing one would be a page with nothing on it but this list.
//
// The last material has no upper bound in the data: the game keeps charging it for every point
// past the previous threshold, so its range is open-ended.
export const anvilPoints = (anvilUpgradeCost) => {
  const ranges = new Map();
  (anvilUpgradeCost || []).forEach((cost, index, list) => {
    if (!cost?.rawName) return;
    const from = index === 0 ? 1 : Number(list[index - 1].costThreshold) + 1;
    const to = index === list.length - 1 ? null : Number(cost.costThreshold);
    if (!ranges.has(cost.rawName)) ranges.set(cost.rawName, { from, to });
  });
  return ranges;
};
