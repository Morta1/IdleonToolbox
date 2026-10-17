import React from 'react';
import { prefix } from '@utility/helpers';

// One recognisable piece of the game per category, picked for being the thing a player meets first:
// Copper Ore, Green Mushroom, Scripticus.
export const KIND_ART = {
  item: 'data/Copper.png',
  monster: 'monsters/mushG/static.png',
  npc: 'npcs/Scripticus/static.png',
  // The first achievement the game hands out, and the one every player has.
  achievement: 'data/TaskAchA1.png',
  // The app's own Bubbles page icon, and the flask the game draws at every vial level.
  bubble: 'data/aBrewOptionA0.png',
  vial: 'data/aVials1.png',
  // Beginner, which every character starts as.
  class: 'data/ClassIcons1.png',
  // The first talent every character gets, and the icon the game files at index 0.
  talent: 'data/UISkillIcon0.png',
  // Whale: an Exclusive pet, and the one the site's own tournament page draws first.
  pet: 'monsters/Pet4/static.png',
  // The great tree on Blunder Hills, cut out of that world's own map. The full maps are 811x433
  // and letterbox to an unreadable strip in a square tile, so the tile takes the one landmark on
  // them that survives being 44px wide.
  world: 'etc/World_Category.png',
  // Not a bundle banner: at tile size a 711x120 strip is unreadable either squashed or cropped.
  // The gem chest is what every bundle is drawn around, and it is square.
  bundle: 'data/PremiumGem.png',
  // The game systems wear the icon of their page in the app's own menu (components/constants.jsx),
  // so a player recognises the tile from the site they already use. Where the app has no page of
  // its own (chips and jewels share the Lab's, star signs and post office boxes have none), the
  // system's first entry stands in.
  vault: 'data/VaultBut.png',
  guildbonus: 'etc/Guild.png',
  meritshop: 'etc/Merit_4.png',
  dungeonitem: 'data/DungeonA7.png',
  dungeonpassive: 'data/DungCredits1.png',
  dungeontrait: 'data/DungTraitA0.png',
  starsign: 'data/SignStar1b.png',
  constellation: 'data/StarTitle1.png',
  statue: 'data/Statue1.png',
  bribe: 'data/BribeW.png',
  owl: 'etc/Owl.png',
  postbox: 'data/UIboxUpg0.png',
  sigil: 'data/LabBonus12.png',
  arcade: 'data/PachiBall1.png',
  weeklyboss: 'etc/SWR_Containment.png',
  poppy: 'data/RooA.png',
  tarpit: 'etc/KTar.png',
  building: 'data/ConTower7.png',
  prayer: 'data/PrayerSel.png',
  equinox: 'data/Quest78.png',
  dream: 'data/Dream_Cloud.png',
  atom: 'data/ConTower8.png',
  totem: 'data/ClassIcons50.png',
  armorset: 'etc/Armor_Set_Smithy.png',
  chip: 'data/ConsoleChip0.png',
  jewel: 'data/ConsoleJwl0.png',
  meal: 'data/ClassIcons51.png',
  gene: 'data/GeneReady0.png',
  petupgrade: 'data/ClassIcons52.png',
  labbonus: 'data/ClassIcons53.png',
  rift: 'data/Mface75.png',
  riftbonus: 'etc/Rift_0.png',
  tome: 'etc/Tome_0.png',
  god: 'data/ClassIcons55.png',
  artifact: 'data/Arti29.png',
  superbit: 'data/ClassIcons56.png',
  sailingisland: 'data/ClassIcons54.png',
  divstyle: 'etc/Div_Style_0.png',
  gamingimport: 'data/GamingItem0.png',
  palette: 'data/ClassIcons56.png',
  cavern: 'data/Quest90.png',
  schematic: 'etc/Villager_1.png',
  majik: 'etc/Villager_2.png',
  lampwish: 'etc/Cavern_6.png',
  fountainupgrade: 'etc/Cavern_15.png',
  jarcollectible: 'etc/Cavern_10.png',
  coveupgrade: 'etc/Cavern_17.png',
  jade: 'data/ClassIcons58.png',
  summoningupgrade: 'data/ClassIcons59.png',
  summoningbattle: 'monsters/Pet1/static.png',
  marketupgrade: 'data/ClassIcons57.png',
  exoticupgrade: 'data/FarmCrop3.png',
  seed: 'etc/Seed_0.png',
  landrank: 'data/RankUpg0.png',
  ninjaupgrade: 'data/NjUpgI13.png',
  pristinecharm: 'data/NjTrP0.png',
  ninjaitem: 'data/NjTr0.png',
  sneakfloor: 'data/NjD0.png',
  spelunkupgrade: 'etc/Spelunking.png',
  spelunktunnel: 'data/CaveRocka6.png',
  researchsquare: 'data/ClassIcons61.png',
  observation: 'data/ResObj0.png',
  sticker: 'data/FarmStickerB0.png',
  legendtalent: 'etc/Whallamus.png',
  zenithupgrade: 'etc/Cluster.png',
  advicefish: 'data/W7_fish.png',
  mineheadupgrade: 'data/MineHead0.png',
  mineheadopponent: 'data/MineH20.png',
  sushiupgrade: 'data/Sushi6.png',
  sushi: 'data/Sushi0.png',
  jellyupgrade: 'data/JellyUnit0.png',
  jellyobstruction: 'data/JellyOp0.png',
  bubbaupgrade: 'etc/Bubba_0.png',
  clamupgrade: 'data/ClamPearl0.png',
  menageriemission: 'data/MenaIconY0.png',
  menagerieunlock: 'data/MenaIconO0.png',
  menagerieboost: 'data/MenaIconP0.png',
  menageriejelly: 'data/MenaJelly1.png',
  grimoireupgrade: 'data/GrimoireUpg18.png',
  compassupgrade: 'data/UISkillIcon421.png',
  tesseractupgrade: 'data/StatusArc0.png',
  armoryupgrade: 'data/UISkillIcon226.png',
  orbletupgrade: 'data/Orblet.png'
};

// Every listed kind carries real art, so there is no drawn stand-in any more: the glyphs existed
// for quests, maps and shops, and none of the three has a listing left.
export const KindArt = ({ kind, size = 44 }) => {
  const art = KIND_ART[kind];
  if (!art) return null;
  return <img
    src={`${prefix}${art}`}
    alt={''}
    width={size}
    height={size}
    style={{ objectFit: 'contain', flexShrink: 0 }}
  />;
};
