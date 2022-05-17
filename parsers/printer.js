import { tryToParse } from "../utility/helpers";

export const getPrinter = (idleonData, charactersData) => {
  const rawPrinter = tryToParse(idleonData?.Print) || idleonData?.Printer;
  return parsePrinter(rawPrinter, charactersData);
}

const parsePrinter = (rawPrinter, charactersData) => {
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
          return [...result, { item: sample[0], value: sample[1], active: sampleIndex >= 10 }];
        }
        return result;
      }, []);
  });
}