import { differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { getPostOfficeBonus } from '../../parsers/postoffice';
import { items, randomList } from '../../data/website-data';
import { getExpReq, isArenaBonusActive, isCompanionBonusActive } from '../../parsers/misc';
import { getPlayerAnvil, getTimeTillCap } from '../../parsers/anvil';
import {
  checkCharClass,
  CLASSES,
  getTalentBonus,
  getTalentBonusIfActive,
  relevantTalents
} from '../../parsers/talents';
import { getAllTools } from '../../parsers/items';
import { cleanUnderscore } from '@utility/helpers';

export const anvilAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (options?.anvil?.missingHammers?.checked) {
    const hammerBubble = character?.equippedBubbles?.find(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER');
    const maxProducts = hammerBubble ? 3 : 2;
    const {
      production: prod
    } = getPlayerAnvil(characters?.[character?.playerId], characters, account);
    const production = prod?.filter(({ hammers }) => hammers > 0);
    const numOfHammers = production?.reduce((res, { hammers }) => res + hammers, 0);
    alerts.missingHamemrs = maxProducts - numOfHammers;
  }

  if (options?.anvil?.unspentPoints?.checked && character?.anvil?.anvilStats?.availablePoints >= options?.anvil?.unspentPoints?.props?.value) {
    alerts.unspentPoints = character?.anvil?.anvilStats?.availablePoints;
  }
  if (options?.anvil?.anvilOverdue?.checked) {
    const { anvil: anvilOption } = options || {};
    const {
      stats,
      production
    } = getPlayerAnvil(characters?.[character?.playerId], characters, account);
    const allProgress = production?.filter(({ hammers }) => hammers > 0)?.map((slot) => {
      const tillCap = getTimeTillCap({
        ...slot,
        stats,
        afkTime: character?.afkTime
      }) * 1000;
      return {
        date: new Date().getTime() + tillCap,
        name: items?.[slot?.rawName]?.displayName,
        rawName: slot?.rawName
      };
    })
    alerts.anvilOverdue = allProgress?.map(({ date, name, rawName }) => {
      const d = new Date(date - 1);
      return { diff: differenceInMinutes(d, new Date()), name, rawName };
    }).filter(({ diff }) => diff <= anvilOption?.anvilOverdue?.props?.value);
  }
  return alerts;
}
export const worshipAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World2) return alerts;
  if (options?.worship?.unendingEnergy?.checked) {
    const timePassed = new Date().getTime() + (character?.afkTime - lastUpdated);
    const minutes = differenceInMinutes(new Date(), new Date(timePassed));
    if (minutes >= 5) {
      const hasUnendingEnergy = character?.activePrayers?.find(({ name }) => name === 'Unending_Energy');
      const hours = differenceInHours(new Date(), new Date(timePassed));
      alerts.unendingEnergy = hasUnendingEnergy && hours > 10;
    }
  }
  if (options?.worship?.chargeOverdue?.checked) {
    const fivePercent = 5 * character?.worship?.maxCharge / 100;
    alerts.chargeOverdue = character?.worship?.currentCharge >= character?.worship?.maxCharge - fivePercent;
  }
  return alerts;
}
export const trapsAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World2) return alerts;
  if (options?.traps?.missingTraps?.checked) {
    const traps = account?.traps?.[character?.playerId];
    const usedTrap = character?.tools?.[4]?.rawName !== 'Blank' ? character?.tools?.[4] : null;
    const callMeAshBubble = account?.alchemy?.bubbles?.quicc?.find(({ bubbleName }) => bubbleName === 'CALL_ME_ASH')?.level;
    const plusOneTrap = callMeAshBubble > 0 ? 1 : 0;
    const maxTraps = usedTrap
      ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + plusOneTrap
      : traps?.length;
    alerts.missingTraps = traps?.length < Math.min(maxTraps, 8);
  }
  if (options?.traps?.trapsOverdue?.checked) {
    alerts.trapsOverdue = account?.traps?.[character?.playerId].some((slot) => isPast(slot?.timeLeft));
  }
  return alerts;
}
export const alchemyAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (options?.alchemy?.bubbles?.checked) {
    const arenaWave = account?.accountOptions?.[89];
    const waveReqs = randomList?.[53];
    const arenaBonusUnlock = isArenaBonusActive(arenaWave, waveReqs, 11);
    const maxEquippedBubbles = arenaBonusUnlock ? 3 : 2;
    alerts.missingBubbles = character?.equippedBubbles?.length < maxEquippedBubbles;
  }
  if (account?.alchemy?.activities?.[character?.playerId]?.activity === -1) {
    alerts.noActivity = true;
  }
  return alerts;
}
export const obolsAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World1) return alerts;
  if (options?.obols?.missingObols?.checked) {
    alerts.missingObols = character?.obols?.list?.filter(({ rawName }) => rawName === 'Blank')
  }
  return alerts;
}
export const postOfficeAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World1) return alerts;
  if (options?.postOffice?.unspentPoints?.checked) {
    const value = parseInt(options?.postOffice?.unspentPoints?.props?.value);
    alerts.unspentPoints = character?.postOffice?.unspentPoints > (value ?? 0) && character?.postOffice.boxes.some(({
                                                                                                                      level,
                                                                                                                      maxLevel
                                                                                                                    }) => level < maxLevel);
  }
  return alerts;
}
export const starSignsAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (options?.starSigns?.missingStarSigns?.checked) {
    const maxStarSigns = account?.starSigns?.reduce((res, { starName, unlocked }) => {
      if (starName.includes('Chronus_Cosmos') && unlocked) {
        return res < 2 ? 2 : res;
      }
      else if (starName.includes('Hydron_Cosmos') && unlocked) {
        return res < 3 ? 3 : res;
      }
      return res;
    }, 1);
    alerts.missingStarSigns = maxStarSigns - character?.starSigns?.length;
  }
  return alerts;
}
export const crystalCountdownAlerts = (account, characters, character, lastUpdated, options) => {
  return crystalCooldownSkillsReady(character, options)
}
export const toolsAlerts = (account, characters, character) => {
  return hasAvailableToolUpgrade(character, account)
}
export const talentsAlerts = (account, characters, character, lastUpdated, options) => {
  return isTalentReady(character, options)
}
export const isTalentReady = (character, options) => {
  const { talents } = options;
  const { postOffice, afkTime, cooldowns, flatTalents } = character;
  const cooldownBonus = getPostOfficeBonus(postOffice, 'Magician_Starterpack', 2);
  const cdReduction = Math.max(0, cooldownBonus);
  const timePassed = (new Date().getTime() - afkTime) / 1000;
  if (!cooldowns) return [];
  return Object.entries(cooldowns || {})?.reduce((res, [tId, talentCd]) => {
    if (!relevantTalents[tId]) return res;
    const talent = flatTalents?.find(({ talentId }) => parseInt(tId) === talentId);
    const configTalents = Object.entries(talents?.talents?.props?.value || {})?.reduce((res, [name, val]) => ({
      ...res,
      [name.camelToTitleCase()?.replace(/ /g, '_')?.toUpperCase()]: val
    }), {});
    if (!talent || !configTalents?.[talent?.name]) return res;
    const calculatedCooldown = talentCd;
    const actualCd = calculatedCooldown - timePassed;
    const cooldown = actualCd < 0 ? actualCd : new Date().getTime() + actualCd * 1000;
    if (!talents?.alwaysShowTalents?.checked && !isPast(cooldown)) return res;
    return [...res,
      { name: talent?.name, skillIndex: talent?.skillIndex, cooldown }];
  }, []);
}
export const crystalCooldownSkillsReady = (character, options) => {
  if (checkCharClass(character?.class, CLASSES.Maestro)) {
    return Object.entries(character?.skillsInfo || {})?.reduce((res, [name, data]) => {
      if (data?.index < 10 && name !== 'character' && options?.crystalCountdown?.skills?.props?.value?.[data?.icon]) {
        const crystalCountdown = getTalentBonus(character?.flatTalents, 'CRYSTAL_COUNTDOWN', null, null, character.addedLevels, true);
        const expReq = getExpReq(data?.index, data?.level);
        const reduction = (1 - data?.expReq / expReq) * 100;
        const ready = reduction > 0;
        return [...res, {
          name, ...data,
          crystalCountdown,
          reduction: data?.level > 0 ? reduction : 0,
          ready: data?.level > 0 ? ready : false
        }]
      }
      return res;
    }, []);
  }
}
export const hasAvailableToolUpgrade = (character) => {
  const rawTools = getAllTools();
  const charTools = character?.tools?.slice(0, 7);
  const skills = [
    character?.skillsInfo?.mining?.level, character?.skillsInfo?.chopping?.level,
    character?.skillsInfo?.fishing?.level, character?.skillsInfo?.catching?.level,
    character?.skillsInfo?.trapping?.level, character?.skillsInfo?.worship?.level,
    character?.level
  ];
  return charTools?.reduce((alerts, tool, index) => {
    const skillLv = skills?.[index];
    const toolList = rawTools?.[index] || [];
    const bestInSlot = Array.isArray(toolList)
      ? toolList?.findLast(({ lvReqToEquip }) => skillLv >= lvReqToEquip)
      : null;
    if (bestInSlot && bestInSlot?.displayName !== tool?.name) {
      alerts.push(bestInSlot)
    }
    return alerts;
  }, []);
}
export const getDivinityAlert = (account, characters, character, lastUpdated, options) => {
  if (!options.divinityStyle.checked) return null;
  const pocketLinked = account?.hole?.godsLinks?.find(({ index }) => index === 4);
  const isMeditating = character?.afkTarget === 'Divinity' || (character?.afkTarget === 'Laboratory' &&
     (account?.divinity?.linkedDeities?.[character?.playerId] === 4 || character?.secondLinkedDeityIndex === 4 || pocketLinked || isCompanionBonusActive(account, 0)));
  if (isMeditating && character?.skillsInfo?.divinity?.level >= 80 && character?.divStyle?.name !== 'Mindful') {
    return { text: 'doesn\'t have mindful style equipped', icon: 'Div_Style_7' };
  }
  else if (!isMeditating && character?.skillsInfo?.divinity?.level >= 40 && character?.divStyle?.name !== 'TranQi') {
    return { text: 'doesn\'t have tranQi style equipped', icon: 'Div_Style_5' };
  }
  return null;
};
export const getEquipmentAlert = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  if (options?.equipment?.availableUpgradesSlots?.checked) {
    alerts.availableUpgradesSlots = [...(character?.equipment || []),
      ...(character?.tools || [])].reduce((result, item) => {
      return item?.Upgrade_Slots_Left > 0 && item?.Type !== 'PREMIUM_HELMET' && item?.Type !== 'CHAT_RING' && !item?.Premiumified
        ? [...result, item]
        : result;
    }, [])
  }
  return alerts;
};
export const cardsAlert = (account, characters, character, lastUpdated, options) => {
  const alerts = {}
  if (options?.cards?.cardSet?.checked) {
    const equippedCardSet = character?.cards?.cardSet;
    const cardSetEffect = cleanUnderscore(equippedCardSet?.effect).replace('{', '');
    const dbWithWraith = checkCharClass(character?.class, CLASSES.Death_Bringer) && character?.activeBuffs?.find(({ name }) => name === 'WRAITH_FORM') !== -1;
    if (character?.level >= 50 && equippedCardSet?.rawName === 'CardSet0') {
      alerts.cardSet = {
        text: `${character.name} has Blunder hill card set equipped which is for level < 50`
      };
    }
    else if (character.afkType === 'FIGHTING' && (equippedCardSet?.rawName === 'CardSet2'
      || equippedCardSet?.rawName === 'CardSet3'
      || equippedCardSet?.rawName === 'CardSet5'
      || equippedCardSet?.rawName === 'CardSet7') && !dbWithWraith) {
      alerts.cardSet = {
        text: `${character.name} is fighting but has skilling card set (${cardSetEffect})`
      };
    }
    else if (character.afkType !== 'FIGHTING' && character.afkType !== 'Nothing' && character.afkType !== 'Paying_Respect'
      && (equippedCardSet?.rawName === 'CardSet4'
        || equippedCardSet?.rawName === 'CardSet6'
        || equippedCardSet?.rawName === 'CardSet8'
        || equippedCardSet?.rawName === 'CardSet7'
        || equippedCardSet?.rawName === 'CardSet26'
      )) {
      alerts.cardSet = {
        text: `${character.name} is skilling but has fighting card set (${cardSetEffect})`
      };
    }
    const hasPassiveCardsEquipped = character?.cards?.equippedCards?.filter(({ effect }) => effect?.includes('(Passive)') || effect?.includes('(P)'));
    if (hasPassiveCardsEquipped?.length > 0) {
      alerts.passiveCards = true;
    }
    // const hasEmptySlots = character?.cards?.equippedCards?.filter(({ cardName }) => !cardName);
    // if (hasEmptySlots) {
    //   alerts.emptyCards = true;
    // }
    // alerts.cardSet = character?.level >= 50 && character?.cards?.cardSet?.rawName === 'CardSet0';
  }
  return alerts;
}
export const classSpecificAlerts = (account, characters, character, lastUpdated, options) => {
  const alerts = {};
  const wrongItems = {};
  const acFormActive = getTalentBonusIfActive(character?.activeBuffs, 'ARCANIST_FORM');
  const isArcaneCultist = checkCharClass(character?.class, CLASSES.Arcane_Cultist);
  const wwFormActive = getTalentBonusIfActive(character?.activeBuffs, 'TEMPEST_FORM');
  const isWindWalker = checkCharClass(character?.class, CLASSES.Wind_Walker);
  if (options?.classSpecific?.wrongItems?.checked) {
    if (!acFormActive && isArcaneCultist) {
      const hasWeapon = character?.equipment?.[1]?.rawName?.includes('EquipmentWandsArc');
      const hasRings = character?.equipment?.[5]?.rawName?.includes('EquipmentRingsArc') || character?.equipment?.[7]?.rawName?.includes('EquipmentRingsArc');
      wrongItems.acWeapon = hasWeapon ? character?.equipment?.[1]?.rawName : '';
      wrongItems.acRings = hasRings ? character?.equipment?.[5]?.rawName : '';
    }
    if (!wwFormActive && isWindWalker) {
      const hasWeapon = character?.equipment?.[1]?.rawName?.includes('EquipmentBowsTempest');
      const hasRings = character?.equipment?.[5]?.rawName?.includes('EquipmentRingsTempest') || character?.equipment?.[7]?.rawName?.includes('EquipmentRingsTempest');
      wrongItems.wwWeapon = hasWeapon ? character?.equipment?.[1]?.rawName : '';
      wrongItems.wwRings = hasRings ? character?.equipment?.[5]?.rawName : '';
    }
  }
  if (options?.classSpecific?.betterWeapon?.checked) {
    if (isWindWalker && wwFormActive) {
      const weapons = character.inventory.filter(({ rawName }) => rawName.includes('EquipmentBowsTempest'));
      const equippedWeapon = character?.equipment?.[1];
      alerts.betterWeapon = weapons.find((invWeapon) => {
        const isSameElement = invWeapon?.UQ1txt === equippedWeapon?.UQ1txt;
        return isSameElement && invWeapon?.Weapon_Power > equippedWeapon?.Weapon_Power;
      });
    }
    if (isArcaneCultist && acFormActive) {
      const weapons = character.inventory.filter(({ rawName }) => rawName.includes('EquipmentWandsArc'));
      const equippedWeaponWP = calcTotalAcWandDamage(character?.equipment?.[1]) || 0;
      alerts.betterWeapon = weapons.find((invWeapon) => {
        return calcTotalAcWandDamage(invWeapon) > equippedWeaponWP;
      });
    }
  }
  if (Object.keys(wrongItems).length) {
    alerts.wrongItems = wrongItems;
  }

  return alerts;
}

const calcTotalAcWandDamage = (weapon) => {
  const baseDamage = Math.pow(1.04, weapon?.Weapon_Power);
  return baseDamage * (1 + weapon?.UQ1val / 100);
}