import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React from 'react';

const STRING_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const harpNoteIcon = (noteId) => `${prefix}etc/HarpNote_${109 + Number(noteId || 0)}.png`;

const TheHarp = ({ hole }) => {
  const { theHarp } = hole?.caverns;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Power'} value={`${100 > theHarp?.power
        ? '' + notateNumber(theHarp?.power, 'Small')
        : 1E6 > theHarp?.power
          ? '' + notateNumber(theHarp?.power)
          : '' + notateNumber(theHarp?.power, 'Big')}%`}/>
      <CardTitleAndValue title={'Power rate'} value={`${commaNotation(theHarp?.powerRate)} / hr`}/>
      <CardTitleAndValue title={'Strings'} value={theHarp?.stringSlots}/>
      <CardTitleAndValue title={'New note cost'} value={`${notateNumber(theHarp?.newNoteCost)}`}/>
      <CardTitleAndValue title={'Opal chance'} value={`${notateNumber(theHarp?.opalChance * 100, 'MultiplierInfo')}%`}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theHarp?.notes?.map((value, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 150, opacity: value === 0 ? .5 : 1 }}>
            <Stack direction={'row'}>
              <img src={`${prefix}data/HoleHarpNote${index}.png`} alt={''}/>
              <Typography>{notateNumber(value, 'Big')}</Typography>
            </Stack>
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
                <img src={harpNoteIcon(noteId)} alt={STRING_LETTERS[noteId] ?? '?'} />
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>}
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theHarp?.chords?.map(({ description, level, bonus, owned }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, height: 150, opacity: level === 0 ? .5 : 1 }}>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <img src={harpNoteIcon(index)} alt={STRING_LETTERS[index] ?? '?'} />
              <Typography sx={{ ml: 1 }}>Lv. {level}</Typography>
            </Stack>
            <Typography>{cleanUnderscore(description?.replace('|', Math.round(100 * (1 + bonus / 100)) / 100)?.replace('}', notateNumber(bonus, 'Big')))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheHarp;
