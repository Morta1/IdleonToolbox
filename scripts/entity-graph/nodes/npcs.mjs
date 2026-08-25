// The roster is sprite group 84, the game's NPC actor group: 118 NPCs against the 94 that
// quests.json names. Everything quest-less lived nowhere before - taskmasters, the soul altars,
// W7's coral crew - so this is the full set rather than a supplement. Every quest NPC is in it,
// which is why these nodes can replace the ones npcQuestNodes builds instead of merging with them.
export const npcNodes = (npcRoster) => {
  const nodes = {};
  for (const rawName of Object.keys(npcRoster)) {
    nodes[`npc:${rawName}`] = {
      kind: 'npc',
      rawName,
      name: rawName.replace(/_/g, ' '),
      icon: `/npcs/${rawName}.gif`,
    };
  }
  return nodes;
};
