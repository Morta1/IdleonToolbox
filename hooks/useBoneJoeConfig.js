import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import { prayers } from '@website-data';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';

export const HP_CURSE_PRAYERS = ['Big_Brain_Time', 'Midas_Minded', 'Jawbreaker'];

// Long enough that holding a key down does not reprice every character on the way, short enough
// that the table has caught up by the time you look at it.
const APPLY_DELAY = 300;

const emptyLevels = () => HP_CURSE_PRAYERS.reduce((res, name) => ({ ...res, [name]: 0 }), {});

export const useBoneJoeConfig = () => {
  const [pickles, setPickles] = useLocalStorage({
    key: 'boneJoeCalculator:pickles',
    defaultValue: 0
  });
  const [prayerLevels, setPrayerLevels] = useLocalStorage({
    key: 'boneJoeCalculator:prayerLevels',
    defaultValue: emptyLevels()
  });
  const [applyToCharacters, setApplyToCharacters] = useLocalStorage({
    key: 'boneJoeCalculator:applyToCharacters',
    defaultValue: false
  });

  const activePrayers = HP_CURSE_PRAYERS.map((name) => {
    const prayer = prayers?.find(({ name: prayerName }) => prayerName === name);
    return { ...prayer, level: prayerLevels?.[name] ?? 0 };
  });
  // Level 0 would still score 0.9x the base curse, so only levelled prayers reach the sum.
  const curse = activePrayers.reduce((res, prayer) => prayer?.level > 0
    ? res + getPrayerBonusAndCurse([prayer], prayer.name)?.curse
    : res, 0);
  const hpMulti = 1 + curse / 100;

  // Passed to the character table as two primitives rather than one object, so that its memo
  // boundary can shallow-compare them and skip the work entirely while the toggle is off.
  const [debouncedPickles] = useDebouncedValue(pickles, APPLY_DELAY);
  const [debouncedHpMulti] = useDebouncedValue(hpMulti, APPLY_DELAY);

  return {
    pickles,
    setPickles,
    activePrayers,
    setPrayerLevels,
    curse,
    hpMulti,
    applyToCharacters,
    setApplyToCharacters,
    overridePickles: applyToCharacters ? debouncedPickles : null,
    overrideHpMulti: applyToCharacters ? debouncedHpMulti : null
  };
};
