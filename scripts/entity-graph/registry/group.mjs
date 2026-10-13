// A row's group is where its kind sits in the wiki's nav, which is also its category chip.
export const inGroup = (group, rows) => rows.map((row) => ({ ...row, group }));
