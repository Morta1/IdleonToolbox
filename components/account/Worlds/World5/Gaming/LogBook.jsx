import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

// The plants have no names in the game data, so each reads by its place in the book
const LogBook = ({ logBook, crowns }) => {
  const total = logBook?.length ?? 0;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Log book'} icon={'data/GamingPlanth5.png'}
                value={`${formatNum(countOwnedLogBooks(logBook) ?? 0)} / ${formatNum(total)}`}/>
      <StatTile label={'Crowns'} icon={'data/GamingRatCrown.png'} value={`${formatNum(crowns ?? 0)} / ${formatNum(total)}`}/>
    </Stack>
    <CardGrid size={'icon'}>
      {logBook?.map(({ rawName, unlocked, crowned }, index) => <IconTile key={rawName}
                                                                          icon={`data/${rawName}`} alt={`Plant ${index + 1}`}
                                                                          status={unlocked ? undefined : 'missing'}
                                                                          mark={crowned ? 'data/GamingRatCrown.png' : undefined}
                                                                          markAlt={crowned ? 'Crowned' : undefined}
                                                                          details={`Plant ${index + 1}: ${unlocked ? 'found' : 'not found'}${crowned ? ', crowned' : ''}`}/>)}
    </CardGrid>
  </>;
};

export default LogBook;
