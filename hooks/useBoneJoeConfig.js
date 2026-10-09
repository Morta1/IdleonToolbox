import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import { prayers } from '@website-data';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';

const HP_CURSE_PRAYERS = ['Big_Brain_Time', 'Midas_Minded', 'Jawbreaker'];

// Long enough that holding a key down does not reprice every character on the way, short enough
// that the table has caught up by the time you look at it.
const APPLY_DELAY = 300;

const emptyLevels = () => HP_CURSE_PRAYERS.reduce((res, name) => ({ ...res, [name]: 0 }), {});

export const useBoneJoeConfig = (account) => {
  const [pickles, setPickles] = useLocalStorage({
    key: 'boneJoeCalculator:pickles',
    defaultValue: 0
  });
  // Typed levels, only for a visitor with no account to read them from.
  const [prayerLevels, setPrayerLevels] = useLocalStorage({
    key: 'boneJoeCalculator:prayerLevels',
    defaultValue: emptyLevels()
  });
  // With an account the level is prefilled from the save. Only levels typed over it are kept, so a
  // prayer levelled in game moves the field along unless the user is planning ahead of it.
  const [levelOverrides, setLevelOverrides] = useLocalStorage({
    key: 'boneJoeCalculator:prayerLevelOverrides',
    defaultValue: {}
  });
  const [enabledPrayers, setEnabledPrayers] = useLocalStorage({
    key: 'boneJoeCalculator:enabledPrayers',
    defaultValue: {}
  });
  const [applyToCharacters, setApplyToCharacters] = useLocalStorage({
    key: 'boneJoeCalculator:applyToCharacters',
    defaultValue: false
  });
  const [targetHits, setTargetHits] = useLocalStorage({
    key: 'boneJoeCalculator:targetHits',
    defaultValue: 1
  });

  const levelsFromAccount = !!account?.prayers?.length;
  const activePrayers = HP_CURSE_PRAYERS.map((name) => {
    const prayer = prayers?.find(({ name: prayerName }) => prayerName === name);
    const accountLevel = account?.prayers?.find(({ name: prayerName }) => prayerName === name)?.level ?? 0;
    const level = levelsFromAccount
      ? levelOverrides?.[name] ?? accountLevel
      : prayerLevels?.[name] ?? 0;
    return { ...prayer, level, accountLevel, enabled: levelsFromAccount ? !!enabledPrayers?.[name] : true };
  });
  // Level 0 would still score 0.9x the base curse, so only levelled prayers reach the sum.
  const curse = activePrayers.reduce((res, prayer) => prayer?.enabled && prayer?.level > 0
    ? res + getPrayerBonusAndCurse([prayer], prayer.name)?.curse
    : res, 0);
  const hpMulti = 1 + curse / 100;

  const setPrayerLevel = (name, level) => {
    if (!levelsFromAccount) {
      setPrayerLevels((prev) => ({ ...prev, [name]: level }));
      return;
    }
    const accountLevel = activePrayers.find((prayer) => prayer?.name === name)?.accountLevel;
    setLevelOverrides((prev) => {
      const { [name]: _, ...rest } = prev ?? {};
      return level === accountLevel ? rest : { ...rest, [name]: level };
    });
  };
  const togglePrayer = (name) => setEnabledPrayers((prev) => ({ ...prev, [name]: !prev?.[name] }));

  // Passed to the character table as primitives rather than one object, so that its memo boundary
  // can shallow-compare them and skip the work entirely while the toggle is off.
  const [debouncedPickles] = useDebouncedValue(pickles, APPLY_DELAY);
  const [debouncedHpMulti] = useDebouncedValue(hpMulti, APPLY_DELAY);
  const [debouncedTargetHits] = useDebouncedValue(targetHits, APPLY_DELAY);

  return {
    pickles,
    setPickles,
    activePrayers,
    levelsFromAccount,
    setPrayerLevel,
    togglePrayer,
    curse,
    hpMulti,
    applyToCharacters,
    setApplyToCharacters,
    targetHits,
    setTargetHits,
    debouncedTargetHits,
    overridePickles: applyToCharacters ? debouncedPickles : null,
    overrideHpMulti: applyToCharacters ? debouncedHpMulti : null
  };
};
