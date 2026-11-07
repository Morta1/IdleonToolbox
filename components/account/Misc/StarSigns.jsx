import React from 'react';
import { Box } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { visuallyHidden } from '@mui/utils';
import { cleanUnderscore, formatStarSignBonus, getTabs } from 'utility/helpers';
import GameIcon from '@components/common/GameIcon';
import Tabber from '../../common/Tabber';
import DataTable from '@components/common/DataTable';
import { PAGES } from '@components/constants';
import useTabIndex from '@hooks/useTabIndex';
import usePageTop from '@hooks/usePageTop';

const bonusLines = ({ bonuses, description }) => (bonuses
  ? bonuses.map(({ rawName, bonus }) => cleanUnderscore(formatStarSignBonus(rawName, bonus)))
  : [cleanUnderscore(description)]);

const StarSigns = ({ starSigns, infiniteStars }) => {
  const tabs = getTabs(PAGES.ACCOUNT.misc.categories, 'constellations', 'Star Signs');
  const [selectedTab] = useTabIndex(tabs, { queryKey: 'nt' });
  // 34 rows: the header sticks under the page's top, as Constellations' does.
  const pageTop = usePageTop();
  const tree = selectedTab === 0 ? 'chronus' : selectedTab === 1 ? 'hydron' : 'seraph';
  // Infinite stars count from the first sign of Chronus on, so each later tree starts past the ones before it.
  const infiniteCount = selectedTab === 0 ? infiniteStars : selectedTab === 1 ? infiniteStars - 34 : infiniteStars - 63;
  // Each sign keeps its place in the whole tree, which is what the infinite stars count, before the game's
  // placeholders (Filler, Unknown) leave the list.
  const rows = (starSigns ?? []).filter((sign) => sign.tree === tree)
    .map((sign, position) => ({ ...sign, position }))
    .filter(({ indexedStarName }) => !indexedStarName.includes('Filler') && !indexedStarName.includes('Unknown'));

  const columns = [
    {
      key: 'name',
      label: 'Name',
      icon: ({ unlocked }) => (unlocked
        ? <Box component={'span'} sx={{ display: 'inline-flex', width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center', color: 'text.success' }}>
          <IconCheck size={20} stroke={2.5} aria-hidden={'true'}/><Box component={'span'} sx={visuallyHidden}>Unlocked</Box>
        </Box>
        : <Box component={'span'} sx={{ display: 'inline-block', width: 24, height: 24, flexShrink: 0 }}/>),
      render: ({ indexedStarName, unlocked, position }) => <>
        {cleanUnderscore(indexedStarName)}
        {unlocked && position < infiniteCount
          ? <GameIcon src={`data/SignStarInf${selectedTab}.png`} size={16} alt={'Infinite star'}/>
          : null}
      </>
    },
    {
      key: 'bonuses',
      label: 'Bonuses',
      // What a sign gives is the point, so a phone keeps it beside the name; the cost waits under the chevron.
      phone: true,
      value: (row) => bonusLines(row).join(' '),
      // Each of the game's lines on its own: one sentence can run over two ("+10% chance to not" / "consume food"),
      // so a comma between them broke it mid-sentence
      render: (row) => bonusLines(row).map((line, index) => <Box key={index} component={'span'} sx={{ display: 'block' }}>{line}</Box>)
    },
    { key: 'cost', label: 'Cost', numeric: true, value: ({ cost }) => cost }
  ];

  return (
    <>
      <Tabber level={2} label={'Star signs'} tabs={tabs} labels={tabs.map((tab) => tab.capitalize())} keepChildren>
        <DataTable columns={columns} rows={rows} rowKey={'indexedStarName'} rowLabel={({ indexedStarName }) => cleanUnderscore(indexedStarName)}
                   surface={'card'} stickyTop={pageTop}/>
      </Tabber>
    </>
  );
};

export default StarSigns;
