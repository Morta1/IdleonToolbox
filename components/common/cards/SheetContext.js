import { createContext, useContext } from 'react';

// Inside a character's sheet (/characters) the card parts draw small: a Panel is one section of the character's card, an
// IconTile the small tile. Off by default, so nothing else on the site moves. { side } says the sheet is one column of
// several side by side; { fold: { open, onToggle, summary } } folds the section on a phone. A portal keeps React context,
// so NoteTrigger and AppDrawer turn this off around what they float.
const SheetContext = createContext(null);

export const useSheet = () => useContext(SheetContext);

export default SheetContext;
