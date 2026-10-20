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

export const DESCRIPTORS = [bubble, stamp, grimoire, compass, tesseract, armory, item, greenstack, skill, talent, starTalent,
  postOffice, charLevel,
  statue, forge, owl, bribe, arcade, vial, sigil, cauldronUpgrade, killroyKills, killroyUpgrade, killroyShop, kangaroo, island,
  shrine, prayer, salt, saltLick, building, atom, equinoxUpgrade, equinoxChallenge, totem, deathNote, hatRack, armorSet];

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
