// Settings no page reads any more, each with the commit that left it. They go once per browser. A later list takes a new
// guard key, or a browser that already ran this one never sees it.
const CLEANED_KEY = 'storage-cleaned:1';

const DEAD_KEYS = [
  ['card-search:hidePassives', 'a26a2394c2'],
  ['activeDropSections', 'd48d72c21a'],
  ['activeDropResultsOnly', 'd48d72c21a'],
  ['voteBallot-hideOffRotation', 'f0f17dfa1e'],
  ['apocalypseCharacters', 'a774fa79e8'],
  ['bubbles:bargainTag', 'a49e910c39'],
  ['bubbles:classDiscount', 'a49e910c39'],
  ['bubbles:futureAnchor', 'a49e910c39'],
  ['bubbles:hidePastLevelThreshold', 'a49e910c39'],
  ['bubbles:hidePastThreshold', 'a49e910c39'],
  ['bubbles:levelThreshold', 'a49e910c39'],
  ['bubbles:showMissingLevels', 'a49e910c39'],
  ['bubbles:effThreshold', 'a49e910c39'],
  ['bubbles:searchText', '2e6224be31'],
  ['bubbles:viewMode', '2e6224be31'],
  ['stamps:forceMaxCapacity', 'ae508d2393'],
  ['stamps:subtractGreenStacks', 'ae508d2393'],
  ['stamps:types', 'ae508d2393'],
  ['checkbox-Hide killed abominations', 'e76dc8c0c9'],
  ['checkbox-Hide future abominations', 'e76dc8c0c9'],
  ['checkbox-Hide coined monsters', 'e76dc8c0c9'],
  ['checkbox-Show wind walker drops', 'e76dc8c0c9'],
  ['checkbox-Hide unlocked portals', 'e76dc8c0c9'],
  ['checkbox-Hide maxed upgrades', '20d0a4cd10'],
  ['checkbox-Hide locked upgrades', '819db39985'],
  ['checkbox-Group by world', 'dc01c8e983'],
  ['checkbox-Hide unused slots', 'd320d3c562'],
  ['checkbox-Only unconnected', 'd320d3c562'],
  ["checkbox-Hide portals I can't hit", 'b50f4d9d7d'],
  ['checkbox-Detailed view', 'b50f4d9d7d'],
  ['checkbox-Hide unlocked maps', '987097fd01'],
  ['checkbox-Hide owned event shop bonuses', 'ee21ca2255'],
  ['checkbox-Show all pets', '5e4d354ae4'],
  ['checkbox-Order by time', '5e4d354ae4'],
  ['checkbox-Apply threshold', '96c4862ecd'],
  ['checkbox-Group by stat', '5e4d354ae4'],
  ['checkbox-Hide maxed', '9079c90fad'],
  ['checkbox-Compact view', 'ae7e28468f'],
  ['checkbox-Hide purchased unlocks', '6633b3709a'],
  ['checkbox-Show level-up indicator', 'ae508d2393'],
  ['checkbox-Hide maxed vials', '9e731ff458'],
  ['checkbox-Hide unlocked', 'f1c45e7e95'],
  ['checkbox-Show bonus only', 'f1c45e7e95'],
  ['checkbox-Hide maxed buildings', '82427c2925'],
  ['checkbox-Show quantity thresholds', '310e055c76'],
  ['checkbox-Hide capped', '310e055c76'],
  ['checkbox-Show progress bars', '310e055c76'],
  ['checkbox-Show quantity calculator', '310e055c76'],
  ['checkbox-Force nano chip', 'e3dae21fca'],
  ['breeding:shinyLevelThreshold', '5e4d354ae4'],
  ['meals-nmlb-procs', 'd0ad9196cc']
];

// Call only from an effect. A visitor with site data blocked gets a SecurityError from every touch of localStorage.
export const removeDeadStorageKeys = () => {
  try {
    if (localStorage.getItem(CLEANED_KEY)) return;
    DEAD_KEYS.forEach(([key]) => localStorage.removeItem(key));
    localStorage.setItem(CLEANED_KEY, '1');
  } catch (err) {
    console.warn('Failed to remove old settings from localStorage:', err);
  }
};
