export const TOOLS = {
  PICKAXE: 0,
  HATCHET: 1,
  ROD: 2,
  NET: 3,
  TRAP: 4,
  SKULL: 5
}
// Skills every character shares: one level for the whole account
export const GLOBAL_SKILLS = ['gaming', 'sailing', 'breeding', 'farming', 'summoning'];
export const isGlobalSkill = (name) => GLOBAL_SKILLS.includes(name);
