import { CardTitleAndValue } from '@components/common/styles';
import { Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { notateNumber } from '@utility/helpers';

// MSA_0..8 cover the first nine stats. The game draws no icon of its own for the later two, so
// they borrow their skill's.
const SKILL_ICONS = { spelunkingPow: 'etc/Spelunking.png', researchExp: 'data/ClassIcons61.png' };

const MsaTotalizer = ({ }) => {
  const { state } = useContext(AppContext);

  return <>
    <Typography variant={'sectionTitle'} component={'h2'}>MSA Totalizer</Typography>
    <Stack mt={3} mb={3} direction={'row'} gap={1} flexWrap={'wrap'}>
      {Object.entries(state?.account?.msaTotalizer || {}).map(([stat, { name, value }], index) => {
        return <CardTitleAndValue key={stat} title={name} value={`${notateNumber(value)}%`}
                                  icon={SKILL_ICONS[stat] ?? `etc/MSA_${index}.png`}
                                  imgStyle={SKILL_ICONS[stat] ? { width: 24, height: 24 } : undefined}>
        </CardTitleAndValue>
      })}
    </Stack>
  </>
};

export default MsaTotalizer;
