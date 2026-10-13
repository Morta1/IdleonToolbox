import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { questsAlerts } from '@utility/dashboard/characters';

// Read from the running game on 2026-10-13 through the debug server, logged in as MortasNinth. Every
// character's QuestComplete in latest.json matches the live one key for key.
const GAME = {
  // ArbitraryCode("TotalQuestsComplete") = DNSM.TomeQTY[4]: SceneNPCquestOrder quests any character has at 1
  totalQuestsComplete: 282,
  // Per character: QuestComplete entries at 1, NPCdialogue.Picnic_Stowaway (the daily reset clamps it to 20),
  // and whether the picnic alert should fire: past the daily questline's start with none of today's quests done
  characters: [
    ['morta11', 160, 20, true],
    ['mortastr', 171, 14, false],
    ['MortaWiz', 138, 20, true],
    ['MortaStir', 131, 20, true],
    ['MortaWiiz', 148, 16, false],
    ['IAmTheHunterrr', 199, 20, true],
    ['MortaMan', 254, 20, true],
    ['MortaCatch', 123, 20, true],
    ['MortasNinth', 161, 20, true],
    ['Morojo', 110, 19, false],
    ['Morojoze', 77, 0, false]
  ],
  // SceneNPCquestOrder ends on Wavey_Wayne1 (World 7's task unlock quest), at 1 on every character
  newestQuest: { world: 'Shimmerfin_Deep', npc: 'Wavey_Wayne', quest: 'Wavey_Wayne1' },
  // DialogueDefGET.Picnic_Stowaway[1] entries from 20 on that resetQuest clears at the daily reset; every
  // character had all of them at -1 (nobody fed him yet today)
  picnicDailyQuests: [4, 5, 6, 7, 8, 9, 10, 11, 12]
};

const { account, characters } = parseFixture(latest);
const byName = (name) => characters.find((character) => character.name === name);
const picnicOption = { quests: { picnicDaily: { checked: true } } };

describe('quests verified against the live game', () => {
  it('unique quests completed across the account', () => {
    expect(account.totalQuestsCompleted).toBe(GAME.totalQuestsComplete);
  });

  it.each(GAME.characters)('%s completed quests and picnic dialogue', (name, completed, picnicDialogue) => {
    const character = byName(name);
    expect([character.questCompleted, character.npcDialog?.Picnic_Stowaway ?? 0]).toEqual([completed, picnicDialogue]);
  });

  it.each(GAME.characters)('%s picnic daily alert', (name, _, __, alert) => {
    const character = byName(name);
    expect(GAME.picnicDailyQuests.map((index) => character.quests.Picnic_Stowaway[index])).toEqual(GAME.picnicDailyQuests.map(() => -1));
    expect(questsAlerts(account, characters, character, 0, picnicOption).picnicDaily).toBe(alert);
  });

  it('lists the newest quest with every character done', () => {
    const { world, npc, quest } = GAME.newestQuest;
    const npcQuests = account.quests[world].find(({ name }) => name === npc)?.npcQuests;
    const completedBy = npcQuests?.find(({ QuestName }) => QuestName === quest)?.completed?.map(({ charIndex }) => charIndex);
    expect(completedBy).toEqual(characters.map((_, index) => index));
  });
});
