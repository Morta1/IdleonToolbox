// Entity names are stored the way the game stores them, with underscores for spaces. Kept out of
// the panel component so getStaticProps and the SEO helpers can read it without pulling MUI into
// the build graph. An .mjs because field-links.mjs, which the Node build imports, names link targets with it.
export const entityName = (node) => (node?.name || node?.rawName || '').replace(/_/g, ' ');
