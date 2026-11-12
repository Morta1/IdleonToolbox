import { Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import StatTile from '@components/common/cards/StatTile';
import IconTile from '@components/common/cards/IconTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Num from '@components/common/Num';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

import { HARP_STRING_LETTERS as STRING_LETTERS, harpNoteIcon } from '@parsers/world-5/caverns/the-harp';

const noteName = (index) => `Harp note ${index + 1}`;

const TheHarp = ({ hole }) => {
  const theHarp = hole?.caverns?.theHarp;
  const strings = theHarp?.stringNotes ?? [];
  const newNoteIndex = theHarp?.newNoteIndex ?? 0;
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Power'} value={theHarp?.power ?? 0} kind={{ game: 'Save.HarpPower', unit: '%' }}/>
      <StatTile label={'Power rate'} value={`${formatNum(theHarp?.powerRate ?? 0)}/hr`}/>
      <StatTile label={'Strings'} value={theHarp?.stringSlots ?? 0} kind={'amount'}/>
      <StatTile label={'New note cost'} value={theHarp?.allNotesOwned ? 'All notes owned' : undefined}>
        <ItemCard.Cost icon={`data/HoleHarpNote${newNoteIndex}.png`} iconAlt={noteName(newNoteIndex)}
                       need={theHarp?.newNoteCost ?? 0} have={theHarp?.newNoteOwned ?? 0} game={'Holes.HarpNewNote_Cost'}/>
      </StatTile>
      <StatTile label={'Opal chance'} icon={'data/Opal.png'}
                value={`${formatGame((theHarp?.opalChance ?? 0) * 100, 'Holes.HarpOpalOdds')}%`}/>
      {opalsFoundTile(hole, 5)}
      <StatTile label={'Total string levels'} value={getHoleLeaderboardTotals(hole).stringLevels} kind={'amount'}/>
    </Stack>
    <Stack gap={1} mb={3}>
      <Typography variant={'sectionTitle'} component={'h2'}>Notes</Typography>
      <CardGrid size={'icon'}>
        {(theHarp?.notes ?? []).map((owned, index) => {
          const name = noteName(index);
          return <IconTile key={`note-${index}`} icon={`data/HoleHarpNote${index}.png`} alt={name}
                           value={<Num value={owned} game={'Holes.HarpNoteProduced'} whole/>}
                           status={owned > 0 ? undefined : 'missing'} details={`${name}: ${formatNum(owned, 'exact')}`}/>;
        })}
      </CardGrid>
    </Stack>
    {strings.length > 0 ? <Stack gap={1} mb={3}>
      <Typography variant={'sectionTitle'} component={'h2'}>Strings</Typography>
      <CardGrid size={'icon'}>
        {strings.map((noteId, index) => {
          const letter = STRING_LETTERS[noteId] ?? '?';
          return <IconTile key={`string-${index}`} icon={`${harpNoteIcon(noteId)}.png`} alt={`String ${index + 1}: ${letter}`}
                           value={`#${index + 1}`} details={`String ${index + 1} plays ${letter}`}/>;
        })}
      </CardGrid>
    </Stack> : null}
    <CardGrid size={'m'}>
      {(theHarp?.chords ?? []).map(({ description, level, bonus, exp, expReq }, index) => {
        return <ItemCard key={`chord-${index}`}
                         dimmed={!(level > 0)}
                         icon={`${harpNoteIcon(index)}.png`}
                         iconSize={32}
                         iconAlt={STRING_LETTERS[index] ?? '?'}
                         level={{ value: level ?? 0 }}>
          {/* The game's @ splits the chord's LV bonus onto its own line */}
          <ItemCard.Desc text={(description ?? '').replace('|', formatNum(1 + (bonus ?? 0) / 100, 'mult', { bare: true }))
            .replace('}', formatGame(bonus ?? 0, 'Holes.HarpStringLVbonus'))}/>
          <ItemCard.Progress label={'EXP'} value={exp ?? 0} max={expReq ?? 0} kind={{ game: 'Holes.HarpStringExpREQ' }}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default TheHarp;
