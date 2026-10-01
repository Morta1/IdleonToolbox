// The Talent Book Library checks out one of four class talent books, Beginner, Warrior, Archer or
// Wizard (N.js:93416 picks the name, then DropSomething hands it over). The Special Talent Book,
// TalentBook1, is the one monsters drop and is not on the library's list.
//
// `yields` rather than `produces`: the item page then reads "Obtained from", and the search
// description for `produces` says "produced at the anvil", which a library is not.
//
// The four names are the code's, not a list in website-data; the edge only fires while the
// building itself is still in the construction data.
const LIBRARY = 'Talent_Book_Library';
const LIBRARY_BOOKS = ['TalentBook2', 'TalentBook3', 'TalentBook4', 'TalentBook5'];

export const talentLibraryEdges = (towers, items) => {
  if (!towers?.[LIBRARY]) return [];
  return LIBRARY_BOOKS
    .filter((rawName) => items?.[rawName])
    .map((rawName) => ({ from: `building:${LIBRARY}`, to: `item:${rawName}`, rel: 'yields', meta: {}, source: 'talent-library' }));
};
