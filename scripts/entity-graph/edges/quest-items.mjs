const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

export const questItemEdges = (quests) => {
  const edges = [];
  for (const npcData of Object.values(quests)) {
    for (const quest of Object.values(npcData)) {
      if (!isQuestEntry(quest)) continue;
      for (const reward of quest.rewards || []) {
        if (!reward?.rawName) continue;
        edges.push({
          from: `quest:${quest.QuestName}`, to: `item:${reward.rawName}`,
          rel: 'rewards', meta: { amount: reward.amount }, source: 'quest-items',
        });
      }
      for (const req of quest.itemReq || []) {
        if (!req?.rawName) continue;
        edges.push({
          from: `quest:${quest.QuestName}`, to: `item:${req.rawName}`,
          rel: 'requires', meta: { amount: req.amount }, source: 'quest-items',
        });
      }
    }
  }
  return edges;
};
