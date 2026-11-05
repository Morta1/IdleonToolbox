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

// A character's chip slots (drawn by Console and by /characters): a chip opens its text on a tap, a locked slot says
// when it opens, and an open empty one is only the dashed slot
const Chips = ({ playerChips, playerLabLevel }) => {
  return <CardGrid size={'icon'} columns={7} sheetColumns={[8, 6]}>
    {playerChips?.map((chip, chipIndex) => chip !== -1
      ? <IconTile key={chipIndex} icon={`data/ConsoleChip${chip?.index}.png`} alt={titleCase(chip?.name)}
                  details={chipDetails(chip)}/>
      : playerLabLevel >= CHIP_SLOT_LEVELS[chipIndex] ? <IconTile key={chipIndex} status={'empty'}/>
        : <IconTile key={chipIndex} status={'empty'} alt={'Locked slot'}
                    details={`Unlocks at Lab Lv ${CHIP_SLOT_LEVELS[chipIndex]}`}/>)}
  </CardGrid>;
};

export default Chips;
