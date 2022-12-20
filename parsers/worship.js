import { getStampBonus } from "./stamps";
import { growth, round } from "../utility/helpers";
import { calcCardBonus } from "./cards";
import { getTalentBonus } from "./talents";
import { getPostOfficeBonus } from "./postoffice";
import { getBubbleBonus } from "./alchemy";

export const getMaxCharge = (skull, cardBonus, prayDayStamp, gospelBonus, worshipLevel, popeBonus, postOfficeWorshipBox) => {
  const skullSpeed = skull?.lvReqToCraft;
  const base = prayDayStamp + gospelBonus * Math.floor(worshipLevel / 10);
  return Math.floor(Math.max(50, cardBonus + postOfficeWorshipBox + (base + skullSpeed * Math.max(popeBonus, 1))));
};

export const getChargeRate = (skull, worshipLevel, popeBonus, cardBonus, stampBonus, talentBonus) => {
  const skullSpeed = skull?.Speed ?? 0;
  const speedMath = 0.2 * Math.pow(skullSpeed, 1.3);
  const levelMath = (0.9 * Math.pow(worshipLevel, 0.5)) / (Math.pow(worshipLevel, 0.5) + 250);
  const base = 6 / Math.max(5.7 - (speedMath + (levelMath + (0.6 * worshipLevel) / (worshipLevel + 40))), 0.57);
  return base * Math.max(1, popeBonus) * (1 + (cardBonus + stampBonus) / 100) * Math.max(talentBonus, 1);
};

export const getPlayerWorship = (character, pages, account, playerCharge) => {
  // 0 - current worship charge rate
  const worshipLevel = character?.skillsInfo?.worship?.level;
  const prayDayBonus = getStampBonus(account?.stamps, "skills", "StampB35", 0);
  let gospelBonus = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'GOSPEL_LEADER', false);
  const cauldronMultiBonus = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'SEVERAPURPLE', false);
  gospelBonus *= cauldronMultiBonus;
  const multiBonus = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'MAGE_IS_BEST', false);
  const popeBubble = account?.alchemy?.bubbles?.["high-iq"]?.find(({ rawName }) => rawName === "aUpgradesP11");
  const popeBonus = character?.equippedBubbles?.find(({ bubbleName }) => bubbleName === "CALL_ME_POPE") ? growth(popeBubble?.func, popeBubble?.level, popeBubble?.x1, popeBubble?.x2) : 0;
  const maxChargeCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === "F10");
  const maxChargeCardBonus = calcCardBonus(maxChargeCard);
  let nearbyOutletBonus = 0;

  if (pages?.includes("Mage")) {
    gospelBonus *= multiBonus;
    nearbyOutletBonus = getTalentBonus(character?.talents, 2, "NEARBY_OUTLET");
  }
  const chargeCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === "F11");
  const chargeCardBonus = calcCardBonus(chargeCard);
  const flowinStampBonus = getStampBonus(account?.stamps, "skills", "StampB34", worshipLevel);
  const hasSkull = character?.tools?.[5]?.rawName !== "Blank";

  const postOfficeWorshipBox = getPostOfficeBonus(character?.postOffice, 'Crate_of_the_Creator', 1);
  const maxCharge = hasSkull ? getMaxCharge(character?.tools?.[5], maxChargeCardBonus, prayDayBonus, gospelBonus, worshipLevel, popeBonus, postOfficeWorshipBox) : 0;
  const chargeRate = hasSkull ? getChargeRate(character?.tools?.[5], worshipLevel, popeBonus, chargeCardBonus, flowinStampBonus, nearbyOutletBonus) : 0;

  return {
    maxCharge: round(maxCharge),
    chargeRate: round(chargeRate),
    currentCharge: round(parseInt(playerCharge))
  };
};
