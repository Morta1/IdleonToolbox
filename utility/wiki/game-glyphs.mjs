// The game's font draws marks the site's can't. An end-of-line # or ^ is its own art (a button, a smile): the mark goes.
// 论 is its "+" in Sneaking's text ("Find a +50 Yellow Belt"). A talent's name ends in a colour code its font reads
// ("Symbols Of Beyond ~r"). Scanned over every label and description in the graph: these are all of them. An .mjs with no
// imports, so the graph build, a page and a test all read one rule. The page's <title> keeps the graph's label (NextSeo).
export const gameGlyphs = (text) => `${text ?? ''}`.replace(/[_ ]?[#^]$/, '').replace(/论/g, '+');
export const shownName = (label) => gameGlyphs(label).replace(/[_ ]~[a-z]$/, '');
