export const getExpDiff = (snapshot, current, lastUpdated) => {
  const snapshotChar = snapshot?.skillsInfo?.character;
  const currentChar = current?.skillsInfo?.character;
  if (!snapshotChar || !currentChar) return null;

  let expEarned;

  if (currentChar.level === snapshotChar.level) {
    // Normal case, no level-up
    expEarned = currentChar.exp - snapshotChar.exp;
  } else if (currentChar.level > snapshotChar.level) {
    // Account for level-ups
    expEarned = snapshotChar.expReq - snapshotChar.exp; // Exp needed to finish the level
    for (let lvl = snapshotChar.level + 1; lvl < currentChar.level; lvl++) {
      expEarned += getExpToLevel(snapshotChar, lvl);
    }
    expEarned += currentChar.exp; // Add progress in the current level
  } else {
    // Somehow lost levels? Shouldn't happen, but return null to avoid incorrect calculations
    return null;
  }

  const expPerMinute = expEarned / ((lastUpdated - snapshot?.snapshotTime) / 1000 / 60);
  const expToLevel = getExpToLevel(currentChar, currentChar.level + 1);
  const totalMinutes = Math.ceil(expToLevel / expPerMinute);

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    expEarned,
    expReq: currentChar.expReq,
    expPerMinute,
    expPerHour: expPerMinute * 60,
    expToLevel,
    timeToLevel: `${days}d:${hours}h:${minutes}m`
  };
};

export const getExpToLevel = (character, targetLevel) => {
  let exp = 0;
  for (let i = character?.level; i < targetLevel; i++) {
    exp += (15 + Math.pow(i, 1.9) + 11 * i) * Math.pow(1.208 - Math.min(0.164, (0.215 * i) / (i + 100)), i) - 15;
  }
  exp -= character?.exp;
  return exp;
}

export const consolidateItems = (items) => {
  // Create a map to store consolidated items
  const consolidatedMap = new Map();
  if (!Array.isArray(items)) return null;
  // Iterate through each item in the array
  items.forEach(item => {
    // Use displayName as the key for consolidation
    const key = item.displayName;

    // If the item already exists in the map, update its amount
    if (consolidatedMap.has(key)) {
      const existingItem = consolidatedMap.get(key);
      existingItem.amount += item.amount;
    } else {
      // If it's a new item, create a deep copy and add to the map
      consolidatedMap.set(key, { ...item });
    }
  });

  // Convert the map back to an array
  return Array.from(consolidatedMap.values());
}

export const compareInventories = (snapshotInventory, currentInventory, lastUpdated, snapshotTime, goal) => {
  if (!Array.isArray(snapshotInventory) || !Array.isArray(currentInventory)) return [];

  const snapshotInv = consolidateItems(snapshotInventory);
  const currentInv = consolidateItems(currentInventory);
  const snapshotInvMap = new Map(snapshotInv.map(item => [item.displayName, item]));
  const currentInvMap = new Map(currentInv.map(item => [item.displayName, item]));
  const report = [];
  new Set([...snapshotInvMap.keys(), ...currentInvMap.keys()]).forEach(name => {
    const snapshotItem = snapshotInvMap.get(name) || { displayName: name, amount: 0 };
    const currentItem = currentInvMap.get(name) || { displayName: name, amount: 0 };
    const difference = currentItem.amount - snapshotItem.amount;

    if (difference !== 0) {
      const perHour = (difference / ((lastUpdated - snapshotTime) / 1000 / 60)) * 60;
      report.push({
        ...currentItem,
        snapshotInventoryItem: snapshotItem.amount ? snapshotItem : null,
        currentInventoryItem: currentItem.amount ? currentItem : null,
        snapshotInventoryAmount: snapshotItem.amount,
        currentInventoryAmount: currentItem.amount,
        difference,
        perHour,
        perDay: perHour * 24,
        perGoal: (Number(goal.replace(/,/g, '')) - difference) / perHour,
        status: difference > 0 ? 'increased' : 'decreased'
      });
    }
  });

  return report;
}

export const compareCards = (snapshot, current, lastUpdated, snapshotTime) => {
  if (!snapshot || !current) return [];
  const timeDiff = (lastUpdated - snapshotTime) / 3600000; // Convert ms to hours

  return Object.entries(current).reduce((result, [cardId, card]) => {
    const snapshotCard = snapshot[cardId];
    const difference = snapshotCard ? card.amount - snapshotCard.amount : card.amount;

    // Skip cards with no change if they existed in snapshot
    if (snapshotCard && difference === 0) return result;

    const perHour = timeDiff > 0 ? (difference / timeDiff).toFixed(2) : 'N/A';
    const hoursForNextLevel =
      perHour !== 'N/A' && parseFloat(perHour) > 0 && card.nextLevelReq > card.amount
        ? ((card.nextLevelReq - card.amount) / parseFloat(perHour)).toFixed(2)
        : 'N/A';

    result.push({
      ...card,
      amount: difference,
      perHour,
      hoursForNextLevel
    });

    return result;
  }, []);
}