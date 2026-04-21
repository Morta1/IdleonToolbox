// Class hierarchy + family theming for builds UI.
// Built entirely on the existing definitions in parsers/talents.ts so we don't
// duplicate the Idleon class tree.

import { CLASSES, getBaseClass, talentPagesMap } from '@parsers/talents';

// The first entry of a class's talent-page sequence tells us the family.
// Warrior subclasses start with 'Rage_Basics', archers with 'Calm_Basics', etc.
const FIRST_TAB_TO_FAMILY = {
  Beginner: 'Beginner',
  Rage_Basics: 'Warrior',
  Calm_Basics: 'Archer',
  Savvy_Basics: 'Mage'
};

export const FAMILY_ORDER = ['Beginner', 'Warrior', 'Archer', 'Mage'];

export const FAMILY_THEME = {
  Beginner: {
    primary: '#f5b93c',
    soft: 'rgba(245, 185, 60, 0.18)',
    gradient: 'linear-gradient(135deg, #3a2b10 0%, #1a1204 100%)',
    glow: '0 0 0 1px rgba(245, 185, 60, 0.25)',
    contrast: '#111'
  },
  Warrior: {
    primary: '#e85d3c',
    soft: 'rgba(232, 93, 60, 0.18)',
    gradient: 'linear-gradient(135deg, #3a1812 0%, #1a0906 100%)',
    glow: '0 0 0 1px rgba(232, 93, 60, 0.25)',
    contrast: '#fff'
  },
  Archer: {
    primary: '#4caf50',
    soft: 'rgba(76, 175, 80, 0.18)',
    gradient: 'linear-gradient(135deg, #12341a 0%, #0a1a0d 100%)',
    glow: '0 0 0 1px rgba(76, 175, 80, 0.25)',
    contrast: '#fff'
  },
  Mage: {
    primary: '#3d9ff5',
    soft: 'rgba(61, 159, 245, 0.18)',
    gradient: 'linear-gradient(135deg, #0e2b47 0%, #061523 100%)',
    glow: '0 0 0 1px rgba(61, 159, 245, 0.25)',
    contrast: '#fff'
  }
};

// Accent tokens used for chip tints, filter-pill active state, and the small
// glowing bits in the page header. Aligned with the `multi` palette value in
// darkTheme.js. Buttons themselves stay on plain MUI defaults to match the
// other tool pages in the app (active-stuff-calculator, material-tracker, etc).
export const ACCENT = {
  primary: '#2087e8',
  primaryHover: '#3a95ee',
  primarySoft: 'rgba(32, 135, 232, 0.16)',
  primaryBorder: 'rgba(32, 135, 232, 0.55)'
};

// Muted text shades reused across cards / meta rows.
export const TEXT_MUTED = 'rgba(255,255,255,0.55)';
export const TEXT_SUBTLE = 'rgba(255,255,255,0.7)';
export const TEXT_STRONG = 'rgba(255,255,255,0.85)';

// 3-px left accent strip used on BuildCard and per-tab cards in BuildForm.
// Kept as a helper because the color is a runtime value (per family) — a
// styled component would need a prop dance for this one use case.
export const familyAccentBar = (color) => ({
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    background: color
  }
});

// Visual primitives (SurfaceCard, TagChip, PillTextField) live in
// components/tools/builds/styled.js — importing them here would create a
// cycle and they're consumed by components, not by this utility file.

export const familyOf = (classKey) => {
  if (!classKey) return 'Beginner';
  const pages = talentPagesMap[classKey];
  if (!pages?.length) return 'Beginner';
  return FIRST_TAB_TO_FAMILY[pages[0]] || 'Beginner';
};

export const themeOf = (classKey) => FAMILY_THEME[familyOf(classKey)];

// Resolve { class, subclass, family } for any class key. `class` is always the
// base-class name; `subclass` is the chosen variant (null when the user picked
// a base class directly).
export const resolveHierarchy = (classKey) => {
  if (!classKey || !talentPagesMap[classKey]) {
    return { class: classKey || null, subclass: null, family: 'Beginner' };
  }
  const base = getBaseClass(classKey);
  const family = familyOf(classKey);
  if (!base || classKey === base) {
    return { class: base || classKey, subclass: null, family };
  }
  return { class: base, subclass: classKey, family };
};

// Accepts a classKey string or a build object `{ class, subclass }`.
// Returns the theme entry merged with the resolved family label.
export const familyTheme = (input) => {
  if (!input) return { ...FAMILY_THEME.Beginner, family: 'Beginner' };
  const key = typeof input === 'string' ? input : input.subclass || input.class;
  const fam = familyOf(key);
  return { ...FAMILY_THEME[fam], family: fam };
};

// All selectable class keys in a stable order that keeps families grouped.
export const CLASS_KEYS = Object.keys(CLASSES);

export { CLASSES };
