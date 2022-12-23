const { tryToParse } = require("../utility/helpers");
export const getDivinity = (idleonData, serializedCharactersData) => {
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  return parseDivinity(divinityRaw, serializedCharactersData);
}

const parseDivinity = (divinityRaw, serializedCharactersData) => {
  const numberOfChars = serializedCharactersData?.length;
  const deitiesStartIndex = 12;
  const linkedDeities = divinityRaw.slice(deitiesStartIndex, deitiesStartIndex + numberOfChars);
  return {
    linkedDeities
  }
}