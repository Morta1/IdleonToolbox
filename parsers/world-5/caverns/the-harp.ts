import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getCosmoBonus, getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { holesInfo } from '@website-data';
import { commaNotation, fillArrayToLength, notateNumber } from '@utility/helpers';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getBellBonus } from '@parsers/world-5/caverns/the-bell';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { getCglunkoBonus } from '@parsers/world-5/caverns/crystal-glunko-cove';

export const HARP_STRING_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// The note art of a string type (no extension)
export const harpNoteIcon = (noteId: any) => `etc/HarpNote_${109 + Number(noteId || 0)}`;

export const getTheHarp = (holesObject: any, accountData: any) => {
  const stringSlots = getStringSlots(holesObject);
  const stringTypes = getStringTypesOwned(holesObject);
  const uniqueStringTypes = getUniqueHarpStringTypes(holesObject);
  const newNoteCost = getNewNoteCost(holesObject);
  const power = holesObject?.extraCalculations?.[22];
  const powerRate = getHarpPowerPerHour(holesObject);
  const stringAllBonus = getHarpStringAllBonus(holesObject, uniqueStringTypes);
  const harpExpGain = getHarpExpGain(holesObject, accountData, stringAllBonus, power);
  const opalChance = getHarpOpalChance(holesObject, stringAllBonus, power);
  const notes = holesObject?.wellSediment?.slice(10, 20);
  const stringNotes = (holesObject?.harpStringNotes ?? []).slice(0, stringSlots).map((noteId: any) => Number(noteId) || 0);
  const chords = fillArrayToLength(6).map((_, index) => {
    const description = holesInfo[45][index];
    const level = holesObject?.harpRelated?.[2 * index];
    const exp = holesObject?.harpRelated?.[2 * index + 1];
    const expReq = getStringExpReq(holesObject, index);
    const ind = index === 0 || index === 1 ? 0 : index === 3 ? 1 : index === 5 ? 2 : index === 4 ? 4 : 0;
    const owned = getHarpNoteProduced({ index: ind, holesObject, stringAllBonus, power, accountData });
    const bonus = getHarpStringBonus(holesObject, index);
    let result;
    if (index === 0) {
      result = notateNumber(owned, 'Big');
    } else if (index === 1) {
      result = notateNumber(100 * opalChance, 'Small');
    } else if (index === 3) {
      result = notateNumber(owned, 'Big');
    } else if (index === 5) {
      result = notateNumber(owned, 'Big');
    } else if (index === 4) {
      result = commaNotation(harpExpGain);
    }
    return {
      level,
      exp,
      expReq,
      owned,
      description: description?.replace('{', String(result)),
      bonus
    };
  });
  return {
    stringSlots,
    stringTypes,
    uniqueStringTypes,
    newNoteCost,
    powerRate,
    power,
    harpExpGain,
    chords,
    opalChance,
    notes,
    stringNotes
  };
}

// game: "HarpNoteProduced", per string plucked, at the power the strum started with
export const getHarpNoteProduced = ({ index, holesObject, stringAllBonus, power, accountData }: any) => {
  const stampBonus = getStampsBonusByEffect(accountData, 'more_Resources_from_all_Caverns') || 0;
  return ((power / 100)
    * stringAllBonus
    * Math.max(1, getSchematicBonus({ holesObject, t: 41, i: 1 })
      * Math.pow(1.1, holesObject?.extraCalculations?.[3]))
    * (1 + (getHarpStringBonus(holesObject, 0)
      + (getHarpStringBonus(holesObject, 3)
        + getHarpStringBonus(holesObject, 5))) / 100)
    * (1 + getHarpStringBonus(holesObject, 1) / 100)
    * (1 + getLampBonus({ holesObject, t: 99, i: 0, account: accountData }) / 100)
    * (1 + getGambitBonus(accountData, 3) / 100)
    * (1 + getMonumentBonus({ holesObject, t: 1, i: 1 }) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 3 }) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 8 }) / 100)
    * (1 + getBellBonus({ holesObject, t: 2 }) / 100)
    * (1 + (accountData?.gemShopPurchases?.[2] ?? 0) / 2)
    * (1 + getJarBonus({ holesObject, i: 20, account: accountData }) / 100)
    * (1 + stampBonus / 100)
    * (1 + getCglunkoBonus(accountData, 14) / 100)) / Math.pow(4, index);
}

const getHarpPowerPerHour = (holesObject: any) => {
  return 200 * (1 + getHarpStringBonus(holesObject, 2) / 100);
}

// game: "HarpEXPgain". Study 5 adds a 1% chance at a (1 + study bonus)x crit that the game rolls on
// every call, its readout included; this is the regular gain the other 99% of plucks get.
export const getHarpExpGain = (holesObject: any, accountData: any, stringAllBonus: any, power: any) => {
  return (1 + getStudyBonus(holesObject, 5, 99))
    * (power / 100)
    * stringAllBonus
    * (1 + getHarpStringBonus(holesObject, 4) / 100)
    * (1 + getMeasurementBonus({ holesObject, accountData, t: 6 }) / 100)
    * (1 + (accountData?.gemShopPurchases?.[2] ?? 0) / 2)
    * (1 + getFountainBonusTotal(holesObject, 1, 15) / 100);
}

const getHarpStringBonus = (holesObject: any, t: any) => {
  return Number(holesInfo[47][t]) * (holesObject?.harpRelated?.[Math.round(2 * t)]);
}

// game: "StringSlots"
export const getStringSlots = (holesObject: any) => {
  return Math.min(15, Math.round(1 + getCosmoBonus({ majik: holesObject?.holeMajiks, t: 0, i: 1 })
    + (getSchematicBonus({ holesObject, t: 32, i: 1 })
      + (getSchematicBonus({ holesObject, t: 33, i: 1 })
        + (getSchematicBonus({ holesObject, t: 34, i: 1 })
          + (getSchematicBonus({ holesObject, t: 35, i: 1 })
            + getSchematicBonus({ holesObject, t: 36, i: 1 })))))))
}

const getStringTypesOwned = (holesObject: any) => {
  return Math.round(Math.min(7, Math.min(1, (holesObject?.harpRelated?.[0]))
    + (Math.min(1, (holesObject?.harpRelated?.[2]))
      + (Math.min(1, (holesObject?.harpRelated?.[4]))
        + (Math.min(1, (holesObject?.harpRelated?.[6]))
          + (Math.min(1, (holesObject?.harpRelated?.[8]))
            + (Math.min(1, (holesObject?.harpRelated?.[10]))
              + Math.min(1, (holesObject?.harpRelated?.[12])))))))))
}

const getStringExpReq = (holesObject: any, t: any) => {
  return (4 + (holesObject?.harpRelated[Math.round(2 * t)]))
    * Math.pow(1.15, (holesObject?.harpRelated[Math.round(2 * t)]))
}
const getNewNoteCost = (holesObject: any) => {
  return 150 * Math.pow(1 + (holesObject?.extraCalculations?.[20]), 1.5)
    * Math.pow(4.5, (holesObject?.extraCalculations?.[20]))
}

// Unique note types among the strings on the harp: the game's _GenINFO[129], counted when the harp is drawn
export const getUniqueHarpStringTypes = (holesObject: any) => {
  const notes = Array.from({ length: getStringSlots(holesObject) }, (_, slot) => Number(holesObject?.harpStringNotes?.[slot]) || 0);
  return new Set(notes).size;
}

// game: "HarpStringAllBonus". Domino Effect scales with the strings already plucked in the strum
// (_GenINFO[128], 0 for the first one), Variety Effect with the unique string types on the harp
export const getHarpStringAllBonus = (holesObject: any, uniqueStringTypes: number, stringsPlucked = 0) => {
  return 1 + (getSchematicBonus({ holesObject, t: 39, i: 15 })
    + getSchematicBonus({ holesObject, t: 37, i: 20 }) * stringsPlucked
    + getSchematicBonus({ holesObject, t: 38, i: 30 }) * uniqueStringTypes) / 100;
}

// game: "HarpOpalOdds"
export const getHarpOpalChance = (holesObject: any, stringAllBonus: any, power: any) => {
  return Math.min(1, stringAllBonus
    * (1 - Math.pow(1 - Math.pow(0.2, (holesObject?.opalsPerCavern?.[5]) + 1),
      Math.max(1, (power) / 100))));
}