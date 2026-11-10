// A descriptor's groups is one grouping or a list of them (Pets: by world and by passive). Group ids never repeat
// across a descriptor's groupings, so a goal stores only the id and the grouping is found from it.
export const groupingsOf = (descriptor) => {
  const groups = descriptor?.groups;
  if (!groups) return [];
  return Array.isArray(groups) ? groups : [groups];
};

export const groupingOf = (descriptor, id) => {
  const groupings = groupingsOf(descriptor);
  return groupings.find(({ names }) => Object.hasOwn(names ?? {}, String(id))) ?? groupings[0] ?? null;
};

export const firstGroupOf = (grouping) => Object.keys(grouping?.names ?? {})[0] ?? null;

export const isInGroup = (descriptor, id, row) => String(groupingOf(descriptor, id)?.of(row)) === String(id);
