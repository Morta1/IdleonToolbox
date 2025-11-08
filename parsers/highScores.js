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
        score: account?.accountOptions?.[242] || 0
      },
      {
        name: 'darts',
        score: 0 // TODO: find dart score index
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