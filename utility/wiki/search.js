export const searchEntities = (searchList, query, limit = 30) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix = [];
  const substring = [];
  for (const entry of searchList) {
    const label = entry.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(entry);
    else if (label.includes(q)) substring.push(entry);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...substring].slice(0, limit);
};
