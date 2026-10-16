import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import InfoBox from './InfoBox';
import LevelledEffect from './LevelledEffect';

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const familyBonusShows = (node) => Boolean(node?.familyBonus);

const FamilyBonusInfo = ({ node }) => {
  if (!familyBonusShows(node)) return null;

  // The key resets the typed level when the page moves to another class: the panel stays mounted
  // across client-side navigation, so the field would otherwise keep the previous class's level.
  return <InfoBox groups={[{
    title: 'Family bonus',
    content: <Stack gap={1}>
      <LevelledEffect key={node.rawName} node={node.familyBonus}/>
      <Typography variant={'caption'} color={'text.disabled'}>
        {`Every character whose class line includes ${cleanUnderscore(node.name)} gives this bonus to the whole account; the highest one counts.`}
      </Typography>
    </Stack>
  }]}/>;
};

export default FamilyBonusInfo;
