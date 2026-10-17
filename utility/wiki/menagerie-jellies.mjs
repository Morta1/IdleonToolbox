// The Luminous Menagerie's six side jellyfish: the words their panels draw. Data-free, so the Menagerie page and the wiki's
// jellyfish pages (the entity-graph build, plain node) read one copy.
//
// UPKEEP: hand-copied from each jellyfish's in-game panel. The game bakes these lines into the panel images or builds them in
// its draw code, so they exist in neither website-data nor any table z-processing extracts; re-check them when a patch
// touches the Menagerie.

// In MenagerieStuff SideJellyUnlocked order. The first unlock's text calls the first one Purple, its panel says Pink.
export const JELLY_NAMES = ['Pink', 'Blue', 'Red', 'Silver', 'Yellow', 'Green'];

// The flavour line under each jellyfish's name, by jellyfish; the Pink panel has none.
export const PANEL_TEXT = [
  null,
  "Give me ladles, and I'll use them every day!",
  "I'll keep track of all the Spelunking Pages you read... so we can re-read them together!",
  'Obols auto recycle into fragments!',
  'Leave your 8th Construction Slot open for me to build in!',
  'You must be good to get this far... but are you one of the greats? Turn in 12 Top 0.1% Nametags to claim the Top 0.01% Nametag!'
];

// The Pink Jellyfish's two upgrade lines, filled with the amount its panel prints.
export const pinkShellLine = (amount) => `Gives you +${amount} Shell for your Luminous Menagerie`;
export const pinkLumiLine = (amount) => `Boost your hourly Lumi gains rate by +${amount}%`;

// The Silver Jellyfish's two upgrade lines, the value printed after each.
export const SILVER_LINES = ['Multiply the MISC bonuses of all obols by:', 'Fragments earned per auto trash:'];

// The Yellow Jellyfish's four construction bonuses, as its panel names them.
export const YELLOW_BONUS_NAMES = ['Construction Build Rate', 'Construction EXP Gain', 'Flaggy Rate', 'hourly Lumi gains rate'];
