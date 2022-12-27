import { tryToParse } from "../utility/helpers";
import { isDeityLinked } from "./divinity";
import { isArtifactAcquired } from "./sailing";

export const getPrinter = (idleonData, charactersData, accountData) => {
  const rawPrinter = tryToParse(idleonData?.Print) || idleonData?.Printer;
  return parsePrinter(rawPrinter, charactersData, accountData);
}

const parsePrinter = (rawPrinter, charactersData, accountData) => {
  const harriepGodIndex = 0 ?? isDeityLinked(accountData?.divinity?.linkedDeities, 3);
  const goldRelic = isArtifactAcquired(accountData?.sailing?.artifacts, 'Gold_Relic')
  const wiredInBonus = accountData?.lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;
  const connectedPlayers = accountData?.lab?.connectedPlayers;
  const daysSinceLastSample = accountData?.accountOptions?.[125];

  const printData = rawPrinter.slice(5, rawPrinter.length); // REMOVE 5 '0' ELEMENTS
  // There are 14 items per character
  // Every 2 items represent an item and it's value in the printer.
  // The first 5 pairs represent the stored samples in the printer.
  // The last 2 pairs represent the samples in production.
  const chunk = 14;

  return charactersData.map((_, charIndex) => {
    const relevantPrinterData = printData.slice(
      charIndex * chunk,
      charIndex * chunk + chunk
    );

    return relevantPrinterData.reduce(
      (result, printItem, sampleIndex, array) => {
        if (sampleIndex % 2 === 0) {
          const sample = array
            .slice(sampleIndex, sampleIndex + 2)
            .map((item, sampleIndex) => sampleIndex === 0 ? item : item);
          let boostedValue = sample[1], multiplier = 1, baseMath = 1, affectedBy = [];
          if (goldRelic?.acquired) {
            const goldRelicBonus = goldRelic?.acquired === 2 ? goldRelic?.multiplier : 0;
            baseMath = 1 + ((daysSinceLastSample) * (1 + goldRelicBonus)) / 100;
            affectedBy = [...affectedBy, `Gold Relic (artifact) - x${baseMath}`];
          }
          const isPlayerConnected = connectedPlayers.find(({ playerId }) => playerId === charIndex);
          if (harriepGodIndex !== -1 && harriepGodIndex === charIndex) {
            affectedBy = [...affectedBy, 'Harriep (god) - x3'];
            if (isPlayerConnected && wiredInBonus) {
              affectedBy = [...affectedBy, 'Wired In (lab) - x2'];
              multiplier = 6;
            } else {
              multiplier = 3;
            }
          } else if (isPlayerConnected && wiredInBonus) {
            affectedBy = [...affectedBy, 'Wired In (lab) - x2'];
            multiplier = 2;
          }
          boostedValue *= multiplier * baseMath;
          return [...result, {
            item: sample[0],
            value: sample[1],
            active: sampleIndex >= 10,
            boostedValue,
            affectedBy
          }];
        }
        return result;
      }, []);
  });
}

// Harriep
// This character produces 3x more resources at 3d Printer! Works with the Lab Bonus, but won't affect the displayed printer amount.

// Gold Relic
// All 3d printer samples grow by +1% per day for 40 days. Resets when taking new samples.
// Samples grow by 1.5% for 60 days instead!