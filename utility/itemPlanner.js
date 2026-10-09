const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const objectsOnly = (list) => Array.isArray(list) ? list.filter(isPlainObject) : [];

// Sections come from localStorage and user-picked import files, and render() maps over them,
// so a wrong shape would crash the page on every load
export const getValidPlannerSections = (planner) => objectsOnly(planner?.sections).map((section) => ({
  ...section,
  items: objectsOnly(section.items),
  materials: objectsOnly(section.materials)
}));
