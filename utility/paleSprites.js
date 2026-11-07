// Sprites that lose their shape on a white card: almost nothing but near-white, or a pale glow with no outline of its own.
// Paths under public/; one ending in * is a whole family. A mostly white sprite with its own dark outline stays off
// (Mutation_0, Tome_13, ClassIcons1), and so does one whose word or glow the edge would smudge (BribeW, SumExp, MenaIconO).
const PALE_SPRITES = [
  'data/GamingPlant*',
  'data/PrayerSel',
  'data/Atom*',
  'data/DungTraitA*',
  'data/HoleLampUpg*',
  'data/MenaIconY*',
  'data/MineUpg23',
  'data/MineUpg24',
  'data/GamingItem0',
  'data/GamingItem1',
  'data/GamingItem3_0',
  'data/GamingItem5',
  'data/GamingItem6',
  'data/JellyUpg14',
  'data/WWeffect1',
  'etc/Constellation_*',
  'etc/DNA',
  'etc/Exalted_Stamp_Frame',
  'etc/Amp_Best_Score',
  'etc/GamingEnvelope',
  // The palette's pale hexes: Pastel Yellow, Offwhite, Light Cyan, Peachy Pink, Lilac Purple
  'etc/Palette_17',
  'etc/Palette_18',
  'etc/Palette_19',
  'etc/Palette_25',
  'etc/Palette_26'
];

const inSrc = (sprite) => `[src*="${sprite.endsWith('*') ? sprite.slice(0, -1) : `${sprite}.`}"]`;

// In light such a sprite wears a thin edge in the page's ink. A global rule on the img's src, so art reaches it however it
// is drawn (GameIcon, the nav's own imgs, a build's) and no caller can forget a prop. The variable is for a rule that has
// its own filter on the same img: GameIcon's status="missing" adds it to its grey.
export const PALE_SPRITE_STYLES = {
  [`:where(.light) img:is(${PALE_SPRITES.map(inSrc).join(',')})`]: {
    '--pale-edge': 'drop-shadow(0 0 1px var(--mui-palette-text-primary))',
    filter: 'var(--pale-edge)'
  }
};
