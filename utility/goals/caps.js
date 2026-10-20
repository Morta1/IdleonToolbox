export const MASTERCLASS_PLACEHOLDER = 999999;
export const ARMORY_PLACEHOLDER = 999;

// null = uncapped: the game stores 0 / nothing / a huge sentinel where an entry has no real cap.
export const realCap = (n, placeholderAtLeast = Infinity) =>
  n == null || !(n > 0) || n >= placeholderAtLeast ? null : n;
