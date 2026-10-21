import bubble from './bubble';
import stamp from './stamp';
import grimoire from './grimoire';
import compass from './compass';
import tesseract from './tesseract';
import armory from './armory';
import item from './item';
import greenstack from './greenstack';
import skill from './skill';
import talent from './talent';
import starTalent from './starTalent';
import postOffice from './postOffice';
import charLevel from './charLevel';
import statue from './statue';
import forge from './forge';
import owl from './owl';
import bribe from './bribe';
import arcade from './arcade';
import vial from './vial';
import sigil from './sigil';
import cauldronUpgrade from './cauldronUpgrade';
import killroyKills from './killroyKills';
import killroyUpgrade from './killroyUpgrade';
import killroyShop from './killroyShop';
import kangaroo from './kangaroo';
import island from './island';
import shrine from './shrine';
import prayer from './prayer';
import salt from './salt';
import saltLick from './saltLick';
import building from './building';
import atom from './atom';
import equinoxUpgrade from './equinoxUpgrade';
import equinoxChallenge from './equinoxChallenge';
import totem from './totem';
import deathNote from './deathNote';
import hatRack from './hatRack';
import armorSet from './armorSet';
import pet from './pet';
import petUpgrade from './petUpgrade';
import meal from './meal';
import kitchen from './kitchen';
import chip from './chip';
import jewel from './jewel';
import tome from './tome';
import card from './card';
import achievement from './achievement';
import task from './task';
import merit from './merit';
import taskUnlock from './taskUnlock';
import rift from './rift';
import god from './god';
import fertilizer from './fertilizer';
import gamingImport from './gamingImport';
import superbit from './superbit';
import logBook from './logBook';
import palette from './palette';
import villager from './villager';
import majik from './majik';
import measurement from './measurement';
import study from './study';
import schematic from './schematic';
import artifact from './artifact';
import captain from './captain';
import boat from './boat';
import lootPile from './lootPile';
import slab from './slab';
import farmMarket from './farmMarket';
import exoticMarket from './exoticMarket';
import landRank from './landRank';
import crop from './crop';
import sticker from './sticker';
import sneakUpgrade from './sneakUpgrade';
import jade from './jade';
import gemstone from './gemstone';
import pristineCharm from './pristineCharm';
import summonUpgrade from './summonUpgrade';
import summonBattle from './summonBattle';
import emperor from './emperor';
import legendTalent from './legendTalent';
import spelunkUpgrade from './spelunkUpgrade';
import spelunkChapter from './spelunkChapter';
import discovery from './discovery';
import loreBoss from './loreBoss';
import elixir from './elixir';
import researchSquare from './researchSquare';
import observation from './observation';
import coralKid from './coralKid';
import dancingCoral from './dancingCoral';
import reefUpgrade from './reefUpgrade';
import clamPearl from './clamPearl';
import scurge from './scurge';
import mineheadUpgrade from './mineheadUpgrade';
import mineheadOpponent from './mineheadOpponent';
import glimbo from './glimbo';
import sushiUpgrade from './sushiUpgrade';
import sushiKnowledge from './sushiKnowledge';
import jellyUpgrade from './jellyUpgrade';
import jellyCell from './jellyCell';
import jellyObstruction from './jellyObstruction';
import menagerieUnlock from './menagerieUnlock';
import menagerieBoost from './menagerieBoost';
import trophy from './trophy';
import nametag from './nametag';
import buttonBonus from './buttonBonus';
import guildBonus from './guildBonus';
import gemShop from './gemShop';
import companion from './companion';
import dungeonItem from './dungeonItem';
import dungeonUpgrade from './dungeonUpgrade';
import vaultUpgrade from './vaultUpgrade';
import constellation from './constellation';
import starSign from './starSign';
import key from './key';
import orblet from './orblet';
import royalStatue from './royalStatue';
import statueFlair from './statueFlair';
import apocalypse from './apocalypse';
import bones from './bones';
import dust from './dust';
import tachyon from './tachyon';
import skillMastery from './skillMastery';
import constructMastery from './constructMastery';
import riftBonus from './riftBonus';
import ninjaMastery from './ninjaMastery';
import ninja from './ninja';
import beanstalk from './beanstalk';
import adviceFish from './adviceFish';
import zenithUpgrade from './zenithUpgrade';
import summonStone from './summonStone';
import emperorBonus from './emperorBonus';
import farmPlot from './farmPlot';
import cavern from './cavern';
import denAmplifier from './denAmplifier';
import monumentBonus from './monumentBonus';
import bellUpgrade from './bellUpgrade';
import harpString from './harpString';
import lampWish from './lampWish';
import jarCollectible from './jarCollectible';
import gambitBonus from './gambitBonus';
import fountainUpgrade from './fountainUpgrade';
import coveUpgrade from './coveUpgrade';
import { PAGE_TOTALS } from './totals/pages';

export const DESCRIPTORS = [bubble, stamp, grimoire, compass, tesseract, armory, item, greenstack, skill, talent, starTalent,
  postOffice, charLevel,
  statue, forge, owl, bribe, arcade, vial, sigil, cauldronUpgrade, killroyKills, killroyUpgrade, killroyShop, kangaroo, island,
  shrine, prayer, salt, saltLick, building, atom, equinoxUpgrade, equinoxChallenge, totem, deathNote, hatRack, armorSet,
  pet, petUpgrade, meal, kitchen, chip, jewel, tome, card, achievement, task, merit, taskUnlock, rift,
  god, fertilizer, gamingImport, superbit, logBook, palette, villager, majik, measurement, study, schematic, artifact, captain, boat, lootPile, slab,
  farmMarket, exoticMarket, landRank, crop, sticker, sneakUpgrade, jade, gemstone, pristineCharm, summonUpgrade, summonBattle, emperor,
  legendTalent, spelunkUpgrade, spelunkChapter, discovery, loreBoss, elixir, researchSquare, observation,
  coralKid, dancingCoral, reefUpgrade, clamPearl, scurge, mineheadUpgrade, mineheadOpponent, glimbo,
  sushiUpgrade, sushiKnowledge, jellyUpgrade, jellyCell, jellyObstruction, menagerieUnlock, menagerieBoost, trophy,
  nametag, buttonBonus,
  guildBonus, gemShop, companion, dungeonItem, dungeonUpgrade, vaultUpgrade, constellation, starSign, key, orblet, royalStatue, statueFlair, apocalypse, bones, dust, tachyon,
  skillMastery, constructMastery, riftBonus, ninjaMastery, ninja, beanstalk, adviceFish, zenithUpgrade, summonStone, emperorBonus, farmPlot,
  cavern, denAmplifier, monumentBonus, bellUpgrade, harpString, lampWish, jarCollectible, gambitBonus, fountainUpgrade, coveUpgrade,
  // page totals last, so a page opens on its own systems first
  ...PAGE_TOTALS];

// DESCRIPTORS is the fixed real list; `active` is what lookups read, so withDescriptors can swap it for tests.
let active = DESCRIPTORS.slice();
const bySystem = () => new Map(active.map((d) => [d.system, d]));

export const getDescriptors = () => active;
export const getDescriptor = (system) => bySystem().get(system);
export const descriptorsForRoute = (pathname) => {
  const path = String(pathname ?? '').split(/[?#]/)[0].replace(/\/$/, '');
  return active.filter((d) => d.route === path);
};

// Test-only: runs fn with a different descriptor list, restoring the real one even if fn throws.
export const withDescriptors = (list, fn) => {
  const previous = active;
  active = list;
  const restore = () => { active = previous; };
  let result;
  try {
    result = fn();
  } catch (err) {
    restore();
    throw err;
  }
  if (result && typeof result.then === 'function') return result.finally(restore);
  restore();
  return result;
};
