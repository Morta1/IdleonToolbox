const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

const clean = (text) => String(text).replace(/_/g, ' ').trim();

// DialogueText is the NPC's line followed by the quest brief, and everything after the QUEST:
// marker is the brief. Split on the marker rather than on the @ that usually precedes it: the
// marker reads MAIN_QUEST: for the 8 Scripticus quests, and Sprout's two carry no @ at all. No
// quest's text contains a second marker. 21 of 348 are pure dialogue with no brief, and get no
// description rather than the NPC's chatter passed off as one.
const questText = (dialogueText) => {
  const marker = /quest:/i.exec(String(dialogueText || ''));
  if (!marker) return null;
  return clean(String(dialogueText).slice(marker.index + marker[0].length)) || null;
};

// One quest's Difficulty is the string '4f'; parseInt reads the 4 rather than dropping the row.
const difficulty = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

// The non-item half of a quest's requirements: "Spelunking LV: 2" and the like. 217 quests carry
// these, and nothing else in the graph records them, since they point at no entity to link to.
const objectives = (customArray) => (customArray || [])
  .filter((entry) => entry?.desc)
  .map((entry) => ({ desc: clean(entry.desc).replace(/:$/, ''), value: entry.value }));

export const npcQuestNodes = (quests) => {
  const nodes = {};
  for (const [npcRawName, npcData] of Object.entries(quests)) {
    nodes[`npc:${npcRawName}`] = { kind: 'npc', rawName: npcRawName, name: npcRawName, icon: null };
    for (const quest of Object.values(npcData)) {
      if (!isQuestEntry(quest)) continue;
      const itemReq = quest.itemReq || [];
      nodes[`quest:${quest.QuestName}`] = {
        kind: 'quest', rawName: quest.QuestName, name: quest.Name, icon: null,
        description: questText(quest.DialogueText),
        difficulty: difficulty(quest.Difficulty),
        // Whether the items are taken only means anything for a quest that asks for items.
        consumed: itemReq.length > 0 ? Boolean(quest.ConsumeItems) : null,
        objectives: objectives(quest.customArray),
      };
    }
  }
  return nodes;
};
