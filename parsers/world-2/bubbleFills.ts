import { lavaLog, lavaLog2 } from '@utility/helpers';
import { getPlayerSpeedBonus } from '@parsers/character';
import { getMaxHp, getMaxMp } from '@parsers/damage';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { getClearedWorld6Maps } from '@parsers/world-6/farming';

// game: the bubble panel fills these three "$" from the character you're logged in as (PlayerHPmax above 250,
// PlayerSpeedBonus above 110%, PlayerMPmax above 150). The toolbox can't always tell who that is: it reads the best one.
const CHARACTER_FILLS: Record<string, (character: any, characters: any[], account: any) => number> = {
  BIG_MEATY_CLAWS: (character, characters, account) => lavaLog(Math.max(getMaxHp(character, characters, account) - 250, 1)),
  QUICK_SLAP: (character, characters, account) => lavaLog2(Math.max(getPlayerSpeedBonus(character, characters, account) / 100 - 0.1, 0)) / 0.25,
  NAME_I_GUESS: (character, characters, account) => lavaLog(Math.max(getMaxMp(character, characters, account) - 150, 1))
};

export const getBubbleDollarFills = (account: any, characters: any[] = []) => {
  const fromCharacters = Object.entries(CHARACTER_FILLS).map(([bubbleName, term]) => {
    const bonus = getBubbleBonus(account, bubbleName, false);
    const best = characters.reduce((res: { value: number; character?: string }, character: any) => {
      const value = bonus * term(character, characters, account);
      return value > res.value ? { value, character: character?.name } : res;
    }, { value: 0 });
    return [bubbleName, best];
  });
  const alchemyLevel = account?.totalSkillsLevels?.alchemy?.level ?? 0;
  return {
    ...Object.fromEntries(fromCharacters),
    DA_DAILY_DRIP: { value: getBubbleBonus(account, 'DA_DAILY_DRIP', false) * Math.max(Math.pow(alchemyLevel / 25, 0.3), 0) },
    // game: NotateNumber(AlchBubbles.Y6, "Big") + "%"
    CROPIUS_MAPPER: { value: getBubbleBonus(account, 'CROPIUS_MAPPER', false) * getClearedWorld6Maps(characters), percent: true }
  } as Record<string, { value: number; character?: string; percent?: boolean }>;
};
