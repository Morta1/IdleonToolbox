import { CardTitleAndValue } from '@components/common/styles';
import { Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { notateNumber } from '@utility/helpers';

const MsaTotalizer = ({ }) => {
  const { state } = useContext(AppContext);

  return <>
    <Typography variant={'h5'}>MSA Totalizer</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {Object.entries(state?.account?.msaTotalizer || {}).map(([stat, { name, value }], index) => {
        return <CardTitleAndValue key={stat} title={name} value={`${notateNumber(value)}%`} icon={`etc/MSA_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
  </>
};

export default MsaTotalizer;
