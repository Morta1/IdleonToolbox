const colosseumIndexMapping = { 1: true, 2: true, 3: true, 4: true };
const minigameIndexMapping = { 0: 'chopping', 1: 'fishing', 2: 'catching', 3: 'mining' };

export const getHighscores = (idleonData) => {
  const coloHighscores = idleonData?.FamilyValuesMap?.ColosseumHighscores || idleonData?.FamValColosseumHighscores;
  const minigameHighscores = idleonData?.FamilyValuesMap?.MinigameHiscores || idleonData?.FamValMinigameHiscores;

  return {
    coloHighscores: parseColosseum(coloHighscores),
    minigameHighscores: parseMinigame(minigameHighscores)
  }
}

const parseColosseum = (coloHighscores) => {
  return coloHighscores
    .filter((_, index) => colosseumIndexMapping[index])
    .map((score) => parseFloat(score));
}

const parseMinigame = (coloHighscores) => {
  return coloHighscores
    .filter((_, index) => minigameIndexMapping[index])
    .map((score, index) => ({ minigame: minigameIndexMapping[index], score }));
}
