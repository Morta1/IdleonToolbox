import { describe, expect, it } from 'vitest';
import { getPlayerQuests, getQuests, isWorldFinished } from '@parsers/quests';

const build = (questComplete) => [{ quests: getPlayerQuests(questComplete) }];

const findNpc = (result, world, name) => result[world].find((npc) => npc.name === name);

describe('quest markers', () => {
  it('keeps the character on an open quest even when a later quest is turned in', () => {
    const qc = {};
    for (let i = 2; i <= 11; i++) qc[`Scripticus${i}`] = 1;
    qc.Scripticus12 = 0;
    qc.Scripticus13 = 1;

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Scripticus');
    const questNamed = (name) => npc.npcQuests.find((quest) => quest.QuestName === name);

    expect(questNamed('Scripticus12').progress).toEqual([{ charIndex: 0, status: 0 }]);
    // and only there - one marker per character per npc
    expect(questNamed('Scripticus13').progress ?? []).toEqual([]);
    expect(questNamed('Scripticus13').completed).toEqual([{ charIndex: 0, status: 1 }]);
    expect(npc.npcQuests.filter(({ progress }) => progress?.length)).toHaveLength(1);
  });

  it('treats a reclaimable quest re-opened after the chain was finished as done', () => {
    // Complete Class Redo resets Promotheus2 to 0 without touching the later story quests, so the
    // raw data looks like an unfinished quest sitting in the middle of a completed chain.
    const qc = { Promotheus1: 1, Promotheus2: 0, Promotheus3: 1, Promotheus4: 1 };

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Promotheus');
    const questNamed = (name) => npc.npcQuests.find((quest) => quest.QuestName === name);
    const withMarker = npc.npcQuests.filter(({ progress }) => progress?.length);

    expect(questNamed('Promotheus2').completed).toEqual([{ charIndex: 0, status: 1 }]);
    expect(withMarker).toHaveLength(1);
    expect(withMarker[0].QuestName).toBe('Promotheus4');
  });

  it('leaves a reclaimable quest in progress while the rest of the chain is unfinished', () => {
    // Same quest, first time through - nothing later is turned in, so it's genuinely open
    const qc = { Promotheus1: 1, Promotheus2: 0, Promotheus3: -1, Promotheus4: -1 };

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Promotheus');
    const questNamed = (name) => npc.npcQuests.find((quest) => quest.QuestName === name);

    expect(questNamed('Promotheus2').completed ?? []).toEqual([]);
    expect(questNamed('Promotheus2').progress).toEqual([{ charIndex: 0, status: 0 }]);
  });

  it('still holds the marker on an open repeatable that is not reclaimable', () => {
    // Champion_of_the_Grasslands isn't on the game's reclaim list, so a later turn-in proves nothing
    const qc = { Scripticus12: 0, Scripticus13: 1 };

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Scripticus');
    const questNamed = (name) => npc.npcQuests.find((quest) => quest.QuestName === name);

    expect(questNamed('Scripticus12').completed ?? []).toEqual([]);
    expect(questNamed('Scripticus12').progress).toEqual([{ charIndex: 0, status: 0 }]);
  });

  it('carries the marker past a quest that was never unlocked', () => {
    // Promotheus1 stays at -1 for characters who moved on without it
    const qc = { Promotheus1: -1, Promotheus2: 1, Promotheus3: 1, Promotheus4: 1 };

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Promotheus');
    const withMarker = npc.npcQuests.filter(({ progress }) => progress?.length);

    expect(withMarker).toHaveLength(1);
    expect(withMarker[0].QuestName).toBe('Promotheus4');
    expect(npc.npcQuests.filter(({ completed }) => completed?.length)).toHaveLength(3);
  });

  it('parks the marker on the next quest once the previous one is turned in', () => {
    const qc = { Promotheus1: 1, Promotheus2: -1 };

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Promotheus');
    const withMarker = npc.npcQuests.filter(({ progress }) => progress?.length);

    expect(withMarker).toHaveLength(1);
    expect(withMarker[0].QuestName).toBe('Promotheus2');
    expect(withMarker[0].progress[0].status).toBe(-1);
  });

  it('leaves the marker on the last quest once the whole chain is done', () => {
    const qc = {};
    for (let i = 1; i <= 13; i++) qc[`Scripticus${i}`] = 1;

    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Scripticus');
    const withMarker = npc.npcQuests.filter(({ progress }) => progress?.length);

    expect(withMarker).toHaveLength(1);
    expect(withMarker[0].QuestName).toBe('Scripticus13');
  });

  it('still advances the marker across a normal completed chain', () => {
    const qc = { Scripticus2: 1, Scripticus3: 1, Scripticus4: 0 };
    const npc = findNpc(getQuests(build(qc)), 'Blunder_Hills', 'Scripticus');
    const questNamed = (name) => npc.npcQuests.find((quest) => quest.QuestName === name);

    expect(questNamed('Scripticus2').progress ?? []).toEqual([]);
    expect(questNamed('Scripticus3').progress ?? []).toEqual([]);
    expect(questNamed('Scripticus4').progress).toEqual([{ charIndex: 0, status: 0 }]);
  });

  it('exposes the codex-only quests that carry no dialogue requirements', () => {
    const npc = findNpc(getQuests([]), 'Blunder_Hills', 'Scripticus');
    expect(npc.npcQuests).toHaveLength(13);
    expect(npc.npcQuests[0].Name).toBe('The_Journey_Begins!');
  });

  it('places the newly mapped npcs in their worlds', () => {
    const result = getQuests([]);
    expect(findNpc(result, 'Hyperion_Nebula', 'Nebula_Neddy')).toBeTruthy();
    expect(findNpc(result, "Smolderin'_Plateau", 'Lava_Larry')).toBeTruthy();
    expect(findNpc(result, 'Spirited_Valley', 'Spirit_Sungmin')).toBeTruthy();
    expect(findNpc(result, 'Shimmerfin_Deep', 'Zenelith')).toBeTruthy();
    expect(findNpc(result, 'Blunder_Hills', 'Obol_Altar')).toBeTruthy();
  });

  it('resolves the world 6 gate from the account flag without any characters', () => {
    expect(isWorldFinished([], { accountOptions: { 408: 1 } }, 6)).toBe(true);
    expect(isWorldFinished([], { accountOptions: { 408: 0 } }, 6)).toBe(false);
    expect(isWorldFinished([{ npcDialog: { Lafu_Shi: 19 } }], {}, 5)).toBe(true);
    expect(isWorldFinished([{ npcDialog: {} }], {}, 5)).toBe(false);
    expect(isWorldFinished([{ npcDialog: { Lafu_Shi: 19 } }], {}, 7)).toBe(false);
  });
});
