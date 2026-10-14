import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import InfoBox from './InfoBox';
import LevelledEffect from './LevelledEffect';

const FamilyBonusInfo = ({ node }) => {
  if (!node?.familyBonus) return null;

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
