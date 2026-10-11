import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React from 'react';
import UpgradeCard, { CardIcon, IconValueRow } from '@components/common/UpgradeCard';

const STRING_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const harpNoteIcon = (noteId) => `etc/HarpNote_${109 + Number(noteId || 0)}.png`;

const TheHarp = ({ hole }) => {
  const { theHarp } = hole?.caverns;
  return <>
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Power'} value={`${100 > theHarp?.power
        ? '' + notateNumber(theHarp?.power, 'Small')
        : 1E6 > theHarp?.power
          ? '' + notateNumber(theHarp?.power)
          : '' + notateNumber(theHarp?.power, 'Big')}%`}/>
      <CardTitleAndValue title={'Power rate'} value={`${commaNotation(theHarp?.powerRate)} / hr`}/>
      <CardTitleAndValue title={'Strings'} value={theHarp?.stringSlots}/>
      <CardTitleAndValue title={'New note cost'} value={`${notateNumber(theHarp?.newNoteCost)}`}/>
      <CardTitleAndValue title={'Opal chance'} value={`${notateNumber(theHarp?.opalChance * 100, 'MultiplierInfo')}%`}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[5] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theHarp?.notes?.map((value, index) => {
        return <Card key={`note-${index}`} sx={{ opacity: value === 0 ? .5 : 1 }}>
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <IconValueRow src={`data/HoleHarpNote${index}.png`}>{notateNumber(value, 'Big')}</IconValueRow>
          </CardContent>
        </Card>
      })}
    </Stack>
    {theHarp?.stringNotes?.length > 0 && <>
      <Divider sx={{ my: 2 }}/>
      <Typography variant={'h6'} sx={{ mb: 1 }}>Strings</Typography>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
        {theHarp?.stringNotes?.map((noteId, index) => {
          return <Card key={`string-${index}`}>
            <CardContent sx={{ width: 70, textAlign: 'center', '&:last-child': { pb: 2 } }}>
              <Typography variant={'caption'} color={'text.secondary'}>#{index + 1}</Typography>
              <Stack alignItems={'center'} sx={{ height: 40, justifyContent: 'center' }}>
                <img src={`${prefix}${harpNoteIcon(noteId)}`} alt={STRING_LETTERS[noteId] ?? '?'} />
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>}
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {theHarp?.chords?.map(({ description, level, bonus }, index) => {
        return <UpgradeCard key={`chord-${index}`}
                            dimmed={level === 0}
                            icon={<CardIcon src={harpNoteIcon(index)} size={32} alt={STRING_LETTERS[index] ?? '?'}/>}
                            subtitle={`Lv. ${level}`}>
          <Typography variant={'body2'}>
            {cleanUnderscore(description?.replace('|', Math.round(100 * (1 + bonus / 100)) / 100)?.replace('}', notateNumber(bonus, 'Big')))}
          </Typography>
        </UpgradeCard>
      })}
    </Stack>
  </>
};

export default TheHarp;
