import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, prefix } from '../../../../../utility/helpers';
import { CardTitleAndValue, TitleAndValue } from '../../../../common/styles';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '../../../../Tooltip';

const Mutations = ({ account }) => {
  const {
    mutations,
    unlockedMutations,
    dna,
    mutationCost,
    newMutationChance,
    mutationChanceBreakpoints
  } = account?.gaming;

  return <>
    <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
      <CardTitleAndValue title={'DNA'}>
        <Stack direction={'row'} gap={2}>
          <img style={{ objectFit: 'contain' }} src={`${prefix}etc/DNA.png`} alt=""/>
          <Typography>{dna} ~ {newMutationChance}% chance</Typography>
          <Tooltip title={<BreakpointsTooltip breakpoints={mutationChanceBreakpoints}/>}>
            <InfoIcon/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Mutation cost'} value={notateNumber(mutationCost, 'bits')}
                         icon={`etc/Bits_${getBitIndex(mutationCost)}.png`}/>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
      {mutations?.map(({ name, description }, index) => {
        return <Card key={name} sx={{
          width: 250,
          border: index < unlockedMutations ? '1px solid' : '',
          borderColor: index < unlockedMutations ? 'success.main' : ''
        }}>
          <CardContent>
            <Stack direction={'row'} gap={2} alignItems={'center'}>
              <img style={{ width: 48, height: 48, objectFit: 'contain' }} src={`${prefix}etc/Mutation_${index}.png`}/>
              <Typography variant={'body1'}>{name}</Typography>
            </Stack>
            <Typography mt={2} variant={'body2'}>{cleanUnderscore(description.replaceAll('|', ' '))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const BreakpointsTooltip = ({ breakpoints }) => {
  return <>
    <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>DNA</Typography>
    {breakpoints?.map(({ value, chance }, index) => <TitleAndValue key={`${name}-${index}`}
                                                                   title={value}
                                                                   value={`${chance}%`}/>)}
  </>
}

export default Mutations;
