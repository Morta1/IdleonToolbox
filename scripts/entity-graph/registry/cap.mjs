// An effect's cap where the game has a "no max" sentinel that never stops a purchase: an uncapped effect has no
// cap and says so (LevelledEffect's "No max level"). Each row cites its own sentinel and how the game tests it.
export const levelCap = (max, uncapped) => (uncapped ? { cap: null, noMax: true } : { cap: max });
