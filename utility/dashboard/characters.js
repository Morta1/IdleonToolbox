import { differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { getPostOfficeBonus } from '../../parsers/postoffice';
import { items, randomList } from '../../data/website-data';
import { getExpReq, isArenaBonusActive } from '../../parsers/misc';
import { getPlayerAnvil, getTimeTillCap } from '../../parsers/anvil';
import { checkCharClass, getTalentBonus, relevantTalents } from '../../parsers/talents';
import { getAllTools } from '../../parsers/items';

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
  if (options?.anvil?.unspentPoints?.checked) {
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
    }).filter(({ diff }) => anvilOption?.showAlertBeforeFull ? diff <= 60 : diff <= 0);
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
      } else if (starName.includes('Hydron_Cosmos') && unlocked) {
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
export const toolsAlerts = (account, characters, character, lastUpdated, options) => {
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
    const calculatedCooldown = (1 - cdReduction / 100) * talentCd;
    const actualCd = calculatedCooldown - timePassed;
    const cooldown = actualCd < 0 ? actualCd : new Date().getTime() + actualCd * 1000;
    if (!talents?.alwaysShowTalents?.checked && !isPast(cooldown)) return res;
    return [...res,
      { name: talent?.name, skillIndex: talent?.skillIndex, cooldown }];
  }, []);
}
export const crystalCooldownSkillsReady = (character) => {
  if (checkCharClass(character?.class, 'Maestro')) {
    return Object.entries(character?.skillsInfo || {})?.reduce((res, [name, data]) => {
      if (data?.index < 10 && name !== 'character') {
        const crystalCountdown = getTalentBonus(character?.talents, 2, 'CRYSTAL_COUNTDOWN', null, null, character.addedLevels, true);
        const expReq = getExpReq(data?.index, data?.level);
        const reduction = (1 - data?.expReq / expReq) * 100;
        const ready = reduction > 0;
        return [...res, {
          name, ...data,
          crystalCountdown,
          reduction,
          ready
        }]
      }
      return res;
    }, []);
  }
}

export const hasAvailableToolUpgrade = (character, account) => {
  const rawTools = getAllTools();
  const charTools = character?.tools?.slice(0, 6);
  const skills = [
    character?.skillsInfo?.mining?.level, character?.skillsInfo?.chopping?.level,
    character?.skillsInfo?.fishing?.level, character?.skillsInfo?.catching?.level,
    character?.skillsInfo?.trapping?.level, character?.skillsInfo?.worship?.level
  ];
  return charTools?.reduce((alerts, tool, index) => {
    const skillLv = skills?.[index];
    const toolList = rawTools?.[index];
    const bestInSlot = toolList?.findLast(({ lvReqToEquip }) => skillLv >= lvReqToEquip);
    if (bestInSlot && bestInSlot?.displayName !== tool?.name) {
      alerts.push(bestInSlot)
    }
    return alerts;
  }, []);
}

export const cardsAlert = (account, characters, character, lastUpdated, options) => {
  const alerts = {}
  if (options?.cards?.cardSet?.checked) {
    alerts.cardSet = character?.level >= 50 && character?.cards?.cardSet?.rawName === 'CardSet0';
  }
  return alerts
}