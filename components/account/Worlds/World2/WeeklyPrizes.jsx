import { Box } from '@mui/material';
import { format } from 'date-fns';
import { weeklyBossesShop } from '@website-data';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { isWeeklyUiOwned } from '@parsers/world-2/weeklyBosses';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { prizeIcon, TROPHY_ICON } from '@components/account/Worlds/World2/WeeklyBoss';

// Every prize the weekly shop can draw (its two pools), with the first of the coming weeks that sells it
const prizeRows = (account, schedule) => (weeklyBossesShop ?? []).flat().map((prize) => {
  const nextWeek = schedule.findIndex(({ shopItems }) => (shopItems ?? []).some(({ name }) => name === prize.name));
  return {
    ...prize,
    key: prize.name,
    owned: isWeeklyUiOwned(account, prize.rawName),
    nextWeek,
    nextDate: nextWeek >= 0 ? schedule[nextWeek]?.date : null
  };
});

// When it is next in the shop: this week, a date (unambiguous month name, as the week tiles), or past the horizon
const nextText = ({ owned, nextWeek, nextDate }, weeks) => {
  // With no clock (a guest) there is no schedule to look in
  if (!weeks) return '-';
  if (owned) return <StatusText status={'done'}>Owned</StatusText>;
  if (nextWeek === 0) return <StatusText status={'ready'}>This week</StatusText>;
  if (nextWeek > 0) return `${format(nextDate, 'MMM d')} (in ${formatNum(nextWeek)} week${nextWeek === 1 ? '' : 's'})`;
  return <Box component={'span'} sx={{ color: 'text.secondary' }}>{`Not in the next ${formatNum(weeks)} weeks`}</Box>;
};

const columns = (weeks) => [
  {
    key: 'name',
    label: 'Prize',
    icon: (row) => {
      const icon = prizeIcon(row, 24);
      return typeof icon === 'string' ? <GameIcon src={icon} size={24} alt={''}/> : icon;
    },
    value: (row) => cleanUnderscore(row.name)
  },
  {
    key: 'cost',
    label: 'Cost',
    numeric: true,
    value: (row) => Number(row.x1) || 0,
    render: (row) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <GameIcon src={TROPHY_ICON} size={16} alt={'Trophies'}/>{formatNum(Number(row.x1) || 0)}
    </Box>
  },
  {
    key: 'next',
    label: 'Next in shop',
    // Owned last, then the soonest first, then the ones past the horizon
    value: (row) => (row.owned ? 1e6 : row.nextWeek >= 0 ? row.nextWeek : 1e5),
    render: (row) => nextText(row, weeks)
  }
];

const WeeklyPrizes = ({ account, schedule, weeks: horizon }) => {
  const weeks = schedule?.length ? horizon : 0;
  const rows = prizeRows(account, schedule).toSorted((a, b) => columns(weeks)[2].value(a) - columns(weeks)[2].value(b));
  return <DataTable columns={columns(weeks)} rows={rows} rowKey={'key'} rowLabel={(row) => cleanUnderscore(row.name)}
                    muted={(row) => row.owned} surface={'card'}/>;
};

export default WeeklyPrizes;
