import { differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { getPostOfficeBonus } from "../../parsers/postoffice";
import { items, randomList } from "../../data/website-data";
import { getExpReq, isArenaBonusActive } from "../../parsers/misc";
import { getTimeTillCap } from "../../parsers/anvil";
import { getTalentBonus } from "../../parsers/talents";
import { isWorldFinished } from "../../parsers/quests";

// character, characters, characterIndex, account

export const isTrapOverdue = (account, characterIndex) => {
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  return account?.traps?.[characterIndex].some((slot) => isPast(slot?.timeLeft));
}

export const isTrapMissing = (tools, account, characterIndex) => {
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  const traps = account?.traps?.[characterIndex];
  const usedTrap = tools?.[4]?.rawName !== 'Blank' ? tools?.[4] : null;
  const callMeAshBubble = account?.alchemy?.bubbles?.quicc?.find(({ bubbleName }) => bubbleName === 'CALL_ME_ASH')?.level;
  const plusOneTrap = callMeAshBubble > 0 ? 1 : 0;
  const maxTraps = usedTrap ? parseInt(usedTrap?.rawName?.charAt(usedTrap?.rawName?.length - 1) ?? 0) + plusOneTrap : traps?.length;
  return traps?.length < Math.min(maxTraps, 8);
}

export const isWorshipOverdue = (account, worship) => {
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  const fivePercent = 5 * worship?.maxCharge / 100;
  return worship?.currentCharge >= worship?.maxCharge - fivePercent;
}

export const hasUnspentPoints = (account, postOffice) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
  return postOffice?.unspentPoints > 0 && postOffice.boxes.some(({ level, maxLevel }) => level < maxLevel);
}

export const isProductionMissing = (equippedBubbles, account, characterIndex) => {
  const hammerBubble = equippedBubbles?.find(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER');
  const maxProducts = hammerBubble ? 3 : 2;
  const production = account?.anvil?.[characterIndex]?.production?.filter(({ hammers }) => hammers > 0);
  const numOfHammers = production.reduce((res, { hammers }) => res + hammers, 0);
  return maxProducts - numOfHammers;
}

export const isAnvilOverdue = (account, afkTime, characterIndex) => {
  const anvil = account?.anvil?.[characterIndex];
  const allProgress = anvil?.production?.filter(({ hammers }) => hammers > 0)?.map((slot) => {
    const tillCap = getTimeTillCap({
      ...slot,
      anvil,
      afkTime
    }) * 1000;
    return { date: new Date().getTime() + tillCap, name: items?.[slot?.rawName]?.displayName, rawName: slot?.rawName };
  })

  return allProgress?.map(({ date, name, rawName }) => {
    const d = new Date(date - 1);
    return { diff: differenceInMinutes(d, new Date()), name, rawName };
  }).filter(({ diff }) => diff <= 60);
}

export const isTalentReady = (character) => {
  const { postOffice, afkTime, cooldowns, flatTalents } = character;
  const relevantTalents = {
    32: true, // Printer_Go_Brr
    130: true, // Refinery_Throttle
    490: true, // Cranium,
    25: true // ITS_YOUR_BIRTHDAY!
  };
  const cooldownBonus = getPostOfficeBonus(postOffice, "Magician_Starterpack", 2);
  const cdReduction = Math.max(0, cooldownBonus);
  const timePassed = (new Date().getTime() - afkTime) / 1000;
  return Object.entries(cooldowns)?.reduce((res, [tId, talentCd]) => {
    if (!relevantTalents[tId]) return res;
    const talent = flatTalents?.find(({ talentId }) => parseInt(tId) === talentId);
    if (!talent) return res;
    const calculatedCooldown = (1 - cdReduction / 100) * talentCd;
    const actualCd = calculatedCooldown - timePassed;
    const cooldown = actualCd < 0 ? actualCd : new Date().getTime() + actualCd * 1000;
    if (!isPast(cooldown)) return res;
    return [...res,
      { name: talent?.name, skillIndex: talent?.skillIndex }];
  }, []);
}

export const isMissingEquippedBubble = (character, account) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
  const arenaWave = account?.accountOptions?.[89];
  const waveReqs = randomList?.[53];
  const arenaBonusUnlock = isArenaBonusActive(arenaWave, waveReqs, 11);
  const maxEquippedBubbles = arenaBonusUnlock ? 3 : 2;
  return character?.equippedBubbles?.length < maxEquippedBubbles;
}

export const isObolMissing = (character) => {
  if (!isWorldFinished(character?.npcDialog, 1)) return false;
  return character?.obols?.list?.filter(({ rawName }) => rawName === 'Blank')
}

export const isMissingStarSigns = (character, account) => {
  const maxStarSigns = account?.starSigns?.reduce((res, { starName, unlocked }) => {
    if (starName.includes('Chronus_Cosmos') && unlocked) {
      return res < 2 ? 2 : res;
    } else if (starName.includes('Hydron_Cosmos') && unlocked) {
      return res < 3 ? 3 : res;
    }
    return res;
  }, 1);
  return maxStarSigns - character?.starSigns.length;
}

export const isAkfForMoreThanTenHours = (character, lastUpdated) => {
  const timePassed = new Date().getTime() + (character?.afkTime - lastUpdated);
  const minutes = differenceInMinutes(new Date(), new Date(timePassed));
  if (minutes >= 5) {
    const hasUnendingEnergy = character?.activePrayers?.find(({ name }) => name === "Unending_Energy");
    const hours = differenceInHours(new Date(), new Date(timePassed));
    return hasUnendingEnergy && hours > 10;
  }
  return false;
}

export const crystalCooldownSkillsReady = (character,) => {
  if (character?.class === 'Maestro') {
    return Object.entries(character?.skillsInfo)?.reduce((res, [name, data]) => {
      if (data?.index < 10 && name !== 'character') {
        const crystalCountdown = getTalentBonus(character?.talents, 2, 'CRYSTAL_COUNTDOWN')
        const expReq = getExpReq(data?.index, data?.level);
        const reduction = 100 * (1 - Math.max((1 - crystalCountdown / 100) * expReq, .98 * data?.expReq) / expReq);
        if (reduction > 0) {
          if (reduction === crystalCountdown) {
            return [...res, { name, ...data, crystalCountdown }]
          }
        }
      }
      return res;
    }, []);
  }
}