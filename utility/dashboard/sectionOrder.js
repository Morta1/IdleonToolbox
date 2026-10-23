export const ALL_SECTIONS = ['goals', 'account', 'characters', 'timers'];

// Saved orders come from storage: keep what is valid, then append sections added since in default order.
export const normalizeSectionOrder = (saved, all = ALL_SECTIONS) => {
  const kept = Array.isArray(saved) ? saved.filter((id, index) => all.includes(id) && saved.indexOf(id) === index) : [];
  return [...kept, ...all.filter((id) => !kept.includes(id))];
};
