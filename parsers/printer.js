import { lavaLog, notateNumber, tryToParse } from '../utility/helpers';
import { getDeityLinkedIndex } from './divinity';
import { isArtifactAcquired } from './sailing';
import { checkCharClass, CLASSES, getTalentBonus } from './talents';
import { getEventShopBonus, getSkillMasteryBonusByIndex, isCompanionBonusActive } from './misc';
import { getAtomColliderThreshold } from './atomCollider';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getCompassBonus } from '@parsers/compass';

export const getPrinter = (idleonData, charactersData, accountData) => {
  const rawPrinter = tryToParse(idleonData?.Print) || idleonData?.Printer;
  const rawExtraPrinter = tryToParse(idleonData?.PrinterXtra) || idleonData?.PrinterXtra;
  return parsePrinter(rawPrinter, rawExtraPrinter, charactersData, accountData);
}

const parsePrinter = (rawPrinter, rawExtraPrinter, charactersData, accountData) => {
  const harriepGodIndex = getDeityLinkedIndex(accountData, charactersData, 3);
  const pocketLinked = accountData?.hole?.godsLinks?.find(({ index }) => index === 3);
  const wiredInBonus = accountData?.lab?.labBonuses?.find((bonus) => bonus.name === 'Wired_In')?.active;
  const connectedPlayers = accountData?.lab?.connectedPlayers;
  const { value: extraPrinting, params } = getPrinterMulti(accountData, charactersData);
  const printData = rawPrinter?.slice(5, rawPrinter?.length); // REMOVE 5 '0' ELEMENTS
  const printExtra = rawExtraPrinter;
  // There are 14 items per character
  // Every 2 items represent an item and it's value in the printer.
  // The first 5 pairs represent the stored samples in the printer.
  // The last 2 pairs represent the samples in production.
  const chunk = 14;
  const extraChunk = 10;
  return charactersData.map((charData, charIndex) => {
    let relevantPrinterData = printData?.slice(
      charIndex * chunk,
      charIndex * chunk + chunk
    );
    if (printExtra) {
      const relevantExtraPrinterData = printExtra?.slice(
        charIndex * extraChunk,
        charIndex * extraChunk + extraChunk
      )
      relevantPrinterData.splice(-4, 0, relevantExtraPrinterData);
      relevantPrinterData = relevantPrinterData.flat();
    }
    return relevantPrinterData?.reduce(
      (result, printItem, sampleIndex, array) => {
        if (sampleIndex % 2 === 0) {
          const sample = array
            .slice(sampleIndex, sampleIndex + 2)
            .map((item, sampleIndex) => sampleIndex === 0 ? item : item);
          let boostedValue = sample[1];
          const isPlayerConnected = connectedPlayers?.find(({ playerId }) => playerId === charIndex);

          const multi = (wiredInBonus && isPlayerConnected ?
            ((harriepGodIndex.includes(charIndex) || pocketLinked)
              ? 6 * extraPrinting
              : 2 * extraPrinting)
            : (harriepGodIndex.includes(charIndex) || pocketLinked)
              ? 3 * extraPrinting
              : extraPrinting)

          boostedValue *= multi;

          const breakdown = [
            { title: 'Multiplicative' },
            { name: '' },
            { name: 'Lab', value: isPlayerConnected && wiredInBonus ? 2 : 0 },
            { name: 'Harriep God', value: (harriepGodIndex.includes(charIndex) || pocketLinked) ? 3 : 0 },
            { name: 'Companion', value: params.companionBonus },
            { name: 'Compass', value: params.compassBonus },
            { name: 'Skill Mastery', value: 1 + params.skillMasteryBonus / 100 },
            {
              name: 'Divine Knight',
              value: notateNumber(1 + (params.highestKingOfRemembrance * lavaLog(params.orbOfRemembranceKills)) / 100, 'MultiplierInfo')
            },
            { name: 'Gold Relic', value: 1 + (params.daysSinceLastSample * (2 + params.goldRelicBonus)) / 100 },
            { name: 'Charm', value: 1 + (params.charmBonus) / 100 },
            { name: 'Vote', value: params.voteBonus },
            {
              name: 'Winter event',
              value: 1 + (2 * accountData?.accountOptions?.[323] * getEventShopBonus(accountData, 4)) / 100
            }
          ];

          return [...result, {
            item: sample[0],
            value: sample[1],
            active: sampleIndex >= relevantPrinterData.length - 4,
            boostedValue,
            breakdown,
            expression: ``
          }];
        }
        return result;
      }, []);
  });
}

export const getPrinterMulti = (accountData, charactersData) => {
  const goldRelic = isArtifactAcquired(accountData?.sailing?.artifacts, 'Gold_Relic');
  const goldRelicBonus = goldRelic?.acquired === 4 ? goldRelic?.sovereignMultiplier : goldRelic?.acquired === 3
    ? goldRelic?.eldritchMultiplier
    : goldRelic?.acquired === 2
      ? goldRelic?.ancientMultiplier
      : 0;
  const daysSinceLastSample = accountData?.accountOptions?.[125];
  const orbOfRemembranceKills = accountData?.accountOptions?.[138];
  const divineKnights = charactersData?.filter((character) => checkCharClass(character?.class, CLASSES.Divine_Knight));
  const highestKingOfRemembrance = divineKnights?.reduce((res, { flatTalents, addedLevels }) => {
    const kingOfRemembrance = getTalentBonus(flatTalents, 'KING_OF_THE_REMEMBERED', false, false, addedLevels, false);
    if (kingOfRemembrance > res) {
      return kingOfRemembrance
    }
    return res;
  }, 0);

  const isSkillMasteryUnlocked = accountData?.rift?.currentRift > 15;
  const skillMasteryBonus = isSkillMasteryUnlocked
    ? getSkillMasteryBonusByIndex(accountData?.totalSkillsLevels, accountData?.rift, 3)
    : 0;

  // this._DNprint = .1 + m._customBlock_WorkbenchStuff("ExtraPrinting", this._DRI, 0)
  const charmBonus = getCharmBonus(accountData, 'Lolly_Flower');
  const voteBonus = (1 + getVoteBonus(accountData, 11) / 100);
  const companionBonus = 1 + accountData?.accountOptions?.[354] * isCompanionBonusActive(accountData, 17) / 100;
  const compassBonus = 1 + (accountData?.accountOptions?.[364] * getCompassBonus(accountData, 43)) / 100;
  const extraPrinting = (1 + (daysSinceLastSample * (2 + goldRelicBonus)) / 100)
    * (1 + (highestKingOfRemembrance * lavaLog(orbOfRemembranceKills)) / 100)
    * (1 + skillMasteryBonus / 100
    ) * (1 + charmBonus / 100)
    * voteBonus
    * (1 + (2 * accountData?.accountOptions?.[323] * getEventShopBonus(accountData, 4)) / 100)
    * companionBonus
    * compassBonus;

  return {
    params: {
      daysSinceLastSample,
      highestKingOfRemembrance,
      skillMasteryBonus,
      charmBonus,
      voteBonus,
      orbOfRemembranceKills,
      goldRelicBonus,
      companionBonus,
      compassBonus,
    },
    value: extraPrinting,
    expression: `(1 + (daysSinceLastSample * (2 + goldRelicBonus)) / 100)
* (1 + (highestKingOfRemembrance * lavaLog(orbOfRemembranceKills)) / 100)
* (1 + skillMasteryBonus / 100) * (1 + charmBonus / 100)
* voteBonus
* (1 + (2 * accountData?.accountOptions?.[323] * getEventShopBonus(accountData, 4)) / 100)
* companionBonus
* compassBonus`
  }
}
export const calcTotals = (account, showAlertWhenFull) => {
  const { printer, storage } = account || {};
  const atomThreshold = getAtomColliderThreshold(account?.accountOptions?.[133]);
  let totals = printer?.reduce((res, character) => {
    character.forEach(({ boostedValue, item, active }) => {
      if (item !== 'Blank' && active) {
        if (res?.[item]) {
          res[item] = { ...res[item], boostedValue: boostedValue + res[item]?.boostedValue };
        } else {
          const storageItem = storage?.list.find(({ rawName }) => rawName === item)?.amount;
          res[item] = { boostedValue, atomable: storageItem >= atomThreshold - (atomThreshold * .01), storageItem };
        }
      }
    })
    return res;
  }, {});
  totals = calcAtoms(totals, atomThreshold, showAlertWhenFull);
  const totalAtoms = Object.entries(totals)?.reduce((sum, [, slot]) => sum + (slot?.atoms ?? 0), 0);
  return { ...totals, atom: { boostedValue: totalAtoms, atoms: totalAtoms } }
}

const calcAtoms = (totals = {}, atomThreshold, showAlertWhenFull) => {
  return Object.entries(totals)?.reduce((sum, [key, slot]) => {
    const { boostedValue, atomable, storageItem } = slot;
    let val = boostedValue, hasAtoms;
    if (showAlertWhenFull?.checked) {
      hasAtoms = atomable;
    } else {
      const printingMoreThanThreshold = boostedValue >= atomThreshold && !atomable;
      const storageAndPrintingMoreThanThreshold = boostedValue > atomThreshold - storageItem && !atomable;
      if (printingMoreThanThreshold) {
        val = boostedValue - atomThreshold;
      } else if (storageAndPrintingMoreThanThreshold) {
        const diff = atomThreshold - storageItem;
        val = boostedValue - diff;
      } else {
        val = boostedValue
      }
      hasAtoms = printingMoreThanThreshold || storageAndPrintingMoreThanThreshold || atomable;
    }

    sum[key] = {
      ...slot,
      ...(hasAtoms ? { atoms: val / 10e6 } : {})
    }
    return sum;
  }, {});
}

export const getPrinterExclusions = () => {
  return [
    'Copper',
    'OakTree',
    'Grasslands1',
    'Bug1',
    'Fish1'
  ].toSimpleObject();
}