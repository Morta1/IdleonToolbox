import { getCharacters, initializeCharacter } from "./character";
import { getCards } from "./cards";
import { getObols } from "./obols";
import { applyStampsMulti, getStamps } from "./stamps";
import { getStatues } from "./statues";
import { getShrines } from "./shrines";
import { getHighscores } from "./highScores";
import { getGemShop } from "./gemShop";
import { getShops } from "./shops";
import { applyArtifactBonusOnSigil, applyVialsMulti, getAlchemy, getEquippedBubbles } from "./alchemy";
import { getStorage } from "./storage";
import { getBribes } from "./bribes";
import { getConstellations, getStarSigns } from "./starSigns";
import { getPrayers } from "./prayers";
import { getCoinsArray, tryToParse } from "../utility/helpers";
import { getForge } from "./forge";
import { getConstruction, getTowers } from "./construction";
import { getAchievements } from "./achievements";
import { getRefinery } from "./refinery";
import { getTasks } from "./tasks";
import { getArcade } from "./arcade";
import {
  calculateLeaderboard,
  getBundles,
  getCurrencies,
  getLibraryBookTimes,
  getLooty,
} from "./misc";
import { getSaltLick } from "./saltLick";
import { getDungeons } from "./dungeons";
import { applyMealsMulti, getCooking, getKitchens } from "./cooking";
import { applyBonusDesc, getJewelBonus, getLab, getLabBonus } from "./lab";
import { classes } from "../data/website-data";
import { getGuild } from "./guild";
import { getPrinter } from "./printer";
import { getTraps } from "./traps";
import { getQuests } from "./quests";
import { getDeathNote } from "./deathNote";
import { getBreeding } from "./breeding";
import { getDivinity } from "./divinity";
import { getArtifacts, getSailing } from "./sailing";
import { getGaming } from "./gaming";
import { getAtoms } from "./atomCollider";

export const parseData = (idleonData, charNames, guildData, serverVars) => {
  let accountData, charactersData;

  try {
    console.log("Start Parsing");
    if (idleonData?.PlayerDATABASE) {
      charNames = Object.keys(idleonData?.PlayerDATABASE);
      charactersData = Object.values(idleonData?.PlayerDATABASE).reduce(
        (charRes, charData, index) => ({
          ...charRes,
          ...Object.entries(charData)?.reduce((res, [key, value]) => ({ ...res, [`${key}_${index}`]: value }), {})
        }),
        {}
      );
      idleonData = { ...idleonData, ...charactersData };
    }
    // } else {
    const parsed = serializeData(idleonData, charNames, guildData, serverVars);
    accountData = parsed?.accountData;
    charactersData = parsed?.charactersData;
    // }
    return { account: accountData, characters: charactersData };
  } catch (err) {
    console.error("Error while parsing data", err);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'error', {
        event_category: 'error',
        event_label: 'engagement',
        value: JSON.stringify(err),
      })
    }
  }
};

const serializeData = (idleonData, charsNames, guildData, serverVars) => {
  let accountData = {},
    charactersData;
  const serializedCharactersData = getCharacters(idleonData, charsNames);
  accountData.accountOptions = idleonData?.OptionsListAccount || tryToParse(idleonData?.OptLacc); //
  accountData.bribes = getBribes(idleonData);
  accountData.timeAway = tryToParse(idleonData?.TimeAway) || idleonData?.TimeAway;
  accountData.alchemy = getAlchemy(idleonData);
  accountData.equippedBubbles = getEquippedBubbles(idleonData, accountData.alchemy?.bubbles);
  accountData.storage = getStorage(idleonData); // changed from inventory
  accountData.saltLick = getSaltLick(idleonData, accountData.storage);
  accountData.dungeons = getDungeons(idleonData, accountData.accountOptions);
  accountData.prayers = getPrayers(idleonData, accountData.storage);
  accountData.cards = getCards(idleonData);
  accountData.gemShopPurchases = getGemShop(idleonData);
  accountData.guild = getGuild(guildData);
  accountData.currencies = getCurrencies(idleonData, accountData);
  accountData.stamps = getStamps(idleonData);
  accountData.obols = getObols(idleonData);
  accountData.looty = getLooty(idleonData);
  accountData.tasks = getTasks(idleonData); //
  accountData.breeding = getBreeding(idleonData, accountData);
  accountData.cooking = getCooking(idleonData, accountData);
  accountData.divinity = getDivinity(idleonData, serializedCharactersData);

  // lab dependencies: cooking, cards, gemShopPurchases, tasks, accountOptions, breeding, deathNote, storage
  accountData.lab = getLab(idleonData, serializedCharactersData, accountData);
  accountData.shrines = getShrines(idleonData, accountData);
  accountData.towers = getTowers(idleonData, accountData);
  accountData.statues = getStatues(idleonData, serializedCharactersData);
  accountData.achievements = getAchievements(idleonData);

  accountData.lab.connectedPlayers = accountData.lab.connectedPlayers?.map((char) => ({
    ...char,
    isDivinityConnected: accountData?.divinity?.linkedDeities?.[char?.playerId] === 4
  }))
  // Update values for meals, stamps, vials
  const certifiedStampBookMulti = getLabBonus(accountData.lab.labBonuses, 7); // stamp multi
  accountData.stamps = applyStampsMulti(accountData.stamps, certifiedStampBookMulti);
  const myFirstChemistrySet = getLabBonus(accountData.lab.labBonuses, 10); // vial multi
  accountData.alchemy.vials = applyVialsMulti(accountData.alchemy.vials, myFirstChemistrySet);
  const spelunkerObolMulti = getLabBonus(accountData.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(accountData.lab.jewels, 16, spelunkerObolMulti);
  accountData.cooking.meals = applyMealsMulti(accountData.cooking.meals, blackDiamondRhinestone);

  const charactersLevels = serializedCharactersData?.map((char) => {
    const personalValuesMap = char?.[`PersonalValuesMap`];
    return { level: personalValuesMap?.StatList?.[4], class: classes?.[char?.[`CharacterClass`]] };
  });

  accountData.charactersLevels = charactersLevels;

  charactersData = serializedCharactersData.map((char) => {
    return initializeCharacter(char, charactersLevels, { ...accountData }, idleonData);
  });

  const artifacts = getArtifacts(idleonData, charactersData, accountData)
  accountData.alchemy.p2w.sigils = applyArtifactBonusOnSigil(accountData.alchemy.p2w.sigils, artifacts);
  accountData.sailing = getSailing(idleonData, artifacts, charactersData, accountData, serverVars);
  accountData.gaming = getGaming(idleonData, charactersData, accountData, serverVars);

  const skills = charactersData?.map(({ name, skillsInfo }) => ({ name, skillsInfo }));
  const leaderboard = calculateLeaderboard(skills);
  charactersData = charactersData.map((character) => ({ ...character, skillsInfo: leaderboard[character?.name] }));

  accountData.highscores = getHighscores(idleonData);
  accountData.shopStock = getShops(idleonData);
  accountData.starSigns = getStarSigns(idleonData);
  accountData.constellations = getConstellations(idleonData);
  accountData.forge = getForge(idleonData, accountData);
  accountData.construction = getConstruction(idleonData);
  accountData.refinery = getRefinery(idleonData, accountData.storage, accountData.tasks);
  accountData.arcade = getArcade(idleonData, accountData.accountOptions, serverVars);
  accountData.printer = getPrinter(idleonData, charactersData, accountData);
  accountData.traps = getTraps(serializedCharactersData);
  accountData.quests = getQuests(charactersData);
  accountData.deathNote = getDeathNote(charactersData);
  accountData.atoms = getAtoms(idleonData, accountData);

  // reduce anvil
  accountData.anvil = charactersData.map(({ anvil }) => anvil);

  accountData.bundles = getBundles(idleonData);
  const bankMoney = parseInt(idleonData?.MoneyBANK);
  const playersMoney = charactersData?.reduce((res, char) => res + parseInt(char?.money), 0);
  const money = bankMoney + playersMoney;
  accountData.currencies.money = getCoinsArray(money);
  accountData.currencies.gems = idleonData?.GemsOwned;

  // kitchens
  accountData.cooking.kitchens = getKitchens(idleonData, accountData);
  accountData.libraryTimes = getLibraryBookTimes(idleonData, accountData);
  // update lab bonuses
  const greenMushroomKilled = Math.floor(accountData?.deathNote?.[0]?.mobs?.[0].kills / 1e6);
  const fungyFingerBonusFromJewel = accountData.lab.labBonuses?.[13]?.active ? greenMushroomKilled * 1.5 : 0;
  const fungyFingerBonus = greenMushroomKilled * accountData.lab.labBonuses?.[9]?.bonusOn;
  accountData.lab.labBonuses = applyBonusDesc(accountData.lab.labBonuses, fungyFingerBonus + fungyFingerBonusFromJewel, 9);

  return { accountData, charactersData };
};
