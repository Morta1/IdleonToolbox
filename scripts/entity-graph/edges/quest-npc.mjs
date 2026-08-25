const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

export const questNpcEdges = (quests) => {
  const edges = [];
  for (const [npcRawName, npcData] of Object.entries(quests)) {
    for (const [index, quest] of Object.entries(npcData)) {
      if (!isQuestEntry(quest)) continue;
      edges.push({
        from: `npc:${npcRawName}`, to: `quest:${quest.QuestName}`,
        rel: 'gives', meta: { order: Number(index) }, source: 'quest-npc',
      });
    }
  }
  return edges;
};
