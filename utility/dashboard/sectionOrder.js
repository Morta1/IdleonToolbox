export const ALL_SECTIONS = ['goals', 'account', 'characters', 'timers'];

// Saved orders come from storage: keep what is valid, then append sections added since in default order.
export const normalizeSectionOrder = (saved, all = ALL_SECTIONS) => {
  const kept = Array.isArray(saved) ? saved.filter((id, index) => all.includes(id) && saved.indexOf(id) === index) : [];
  return [...kept, ...all.filter((id) => !kept.includes(id))];
};

// Keyboard reorder: one slot left (-1) or right (+1); the ends stay put.
export const moveSection = (order, id, step) => {
  const from = order.indexOf(id);
  const to = from + step;
  if (from === -1 || to < 0 || to >= order.length) return order;
  const next = [...order];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};
