const colosseumIndexMapping = { 0: 'dewdrop', 1: 'sandstone', 2: 'chillsnap', 3: 'astro' };
const minigameIndexMapping = { 0: 'chopping', 1: 'fishing', 2: 'catching', 3: 'mining' };

export const getHighscores = (idleonData, account) => {
  const coloHighscores = idleonData?.FamilyValuesMap?.ColosseumHighscores || idleonData?.FamValColosseumHighscores;
  const minigameHighscores = idleonData?.FamilyValuesMap?.MinigameHiscores || idleonData?.FamValMinigameHiscores;

  return {
    coloHighscores: parseColosseum(coloHighscores),
    minigameHighscores: parseMinigame(minigameHighscores).concat([{
      name: 'pen pals',
      score: account?.accountOptions?.[99] || 0
    }])
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
