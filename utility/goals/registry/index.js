import bubble from './bubble';
import stamp from './stamp';
import grimoire from './grimoire';
import compass from './compass';
import tesseract from './tesseract';
import armory from './armory';

export const DESCRIPTORS = [bubble, stamp, grimoire, compass, tesseract, armory];

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
