import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';

// The Lab level each of a character's seven chip slots opens at
export const CHIP_SLOT_LEVELS = [5, 10, 15, 25, 35, 50, 75];

// The game writes chip, jewel and lab bonus names in capitals: "GROUNDED_NANOCHIP" reads "Grounded nanochip"
export const titleCase = (name) => cleanUnderscore(name?.toLowerCase()?.capitalize());

// A chip's bonus with its { filled by its base value
export const chipText = (chip) => cleanUnderscore(chip?.bonus?.replace(/{/g, chip?.baseVal ?? 0));

export const chipDetails = (chip) => <ItemCard.Desc text={[titleCase(chip?.name), chipText(chip)]}/>;

// A character's chip slots (drawn by Console and by /characters): a chip opens its text on a tap, an empty slot says
// when it opens
const Chips = ({ playerChips, playerLabLevel, charactersPage }) => {
  return <CardGrid size={'icon'} columns={charactersPage ? 4 : 7}>
    {playerChips?.map((chip, chipIndex) => chip !== -1
      ? <IconTile key={chipIndex} icon={`data/ConsoleChip${chip?.index}.png`} alt={titleCase(chip?.name)}
                  details={chipDetails(chip)}/>
      : <IconTile key={chipIndex} status={'empty'}
                  details={playerLabLevel >= CHIP_SLOT_LEVELS[chipIndex] ? 'Empty slot' : `Unlocks at Lab Lv ${CHIP_SLOT_LEVELS[chipIndex]}`}/>)}
  </CardGrid>;
};

export default Chips;
