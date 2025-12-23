const colosseumIndexMapping = { 0: 'dewdrop', 1: 'sandstone', 2: 'chillsnap', 3: 'astro', 4: 'molten', 5: 'whimsical' };
const minigameIndexMapping = { 0: 'chopping', 1: 'fishing', 2: 'catching', 3: 'mining' };

export const getHighscores = (idleonData, account) => {
  const coloHighscores = idleonData?.FamilyValuesMap?.ColosseumHighscores || idleonData?.FamValColosseumHighscores;
  const minigameHighscores = idleonData?.FamilyValuesMap?.MinigameHiscores || idleonData?.FamValMinigameHiscores;

  return {
    coloHighscores: parseColosseum(coloHighscores),
    minigameHighscores: parseMinigame(minigameHighscores).concat([
      {
        name: 'pen pals',
        score: account?.accountOptions?.[99] || 0
      }, {
        name: 'poing',
        score: account?.gaming?.poingHighscore
      },
      {
        name: 'hoops',
        score: account?.accountOptions?.[242] || 0,
        ...getHoopsData(account)
      },
      {
        name: 'darts',
        score: account?.accountOptions?.[442] || 0,
        ...getDartsData(account)
      },
      {
        name: 'spiketrap',
        score: account?.accountOptions?.[201] || 0,
      }
    ])
  }
}

const parseColosseum = (coloHighscores) => {
  return coloHighscores.slice(1)
    .filter((_, index) => colosseumIndexMapping[index])
    .map((score, index) => ({ name: colosseumIndexMapping[index], score: parseFloat(score) }));
}

const parseMinigame = (coloHighscores) => {
  return coloHighscores
    .filter((_, index) => minigameIndexMapping[index])
    .map((score, index) => ({ name: minigameIndexMapping[index], score }));
}

export const calcColoTotalScore = (colo) => {
  return colo?.reduce((res, { score }) => res + score, 0);
}

export const calcMinigameTotalScore = (colo) => {
  return colo?.reduce((res, { score }, index) => res + (index < 5 ? score : 0), 0);
}

export const getDartsData = (account) => {
  const upgradeTexts = ["+{%_Extra_Damage_against_Monsters!", "+{_Talent_PTS_for_the_first_page!", "All_Vault_upgrades_are_}x_Cheaper!", "+{%_Movement_Speed,_so_you_can_run_faster!"];
  const upgradeReqs = [0, 40, 150, 250];
  const points = account?.accountOptions?.slice(435, 439);
  const totalPoints = points.reduce((res, point) => res + point, 0);
  const upgrades = upgradeTexts.map((text, index) => ({
    description: text.replace('{', points[index]),
    pointsToUnlock: upgradeReqs[index],
    level: points[index],
    unlocked: points[index] > 0,
    cost: 1 == index ? Math.floor(3 + points[index] / 0.25) : 3 == index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12)
  }));

  return {
    totalPoints,
    upgrades
  }
}

export const getHoopsData = (account) => {
  const upgradeTexts = ["+{%_Damage_to_Monsters", "+{%_Coins_dropped_by_monsters", "+{%_Class_EXP_when_killing_monsters", "+{%_Efficiency_for_all_Skills,_like_Mining_and_Choppin!"];
  const upgradeReqs = [0, 12, 80, 200];
  const points = account?.accountOptions?.slice(419, 423);
  const totalPoints = points.reduce((res, point) => res + point, 0);
  const upgrades = upgradeTexts.map((text, index) => ({
    description: text.replace('{', points[index]),
    pointsToUnlock: upgradeReqs[index],
    level: points[index],
    unlocked: points[index] > 0,
    cost: 1 == index ? Math.floor(3 + points[index] / 0.25) : 3 == index ? Math.floor(5 + points[index] / 0.05) : Math.floor(2 + points[index] / 12)
  }));

  return {
    totalPoints,
    upgrades
  }
}