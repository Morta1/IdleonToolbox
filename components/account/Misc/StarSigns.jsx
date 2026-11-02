import React from 'react';
import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { cleanUnderscore, formatStarSignBonus, getTabs, prefix } from 'utility/helpers';
import Tabber from '../../common/Tabber';
import DataTable from '@components/common/DataTable';
import { PAGES } from '@components/constants';
import useTabIndex from '@hooks/useTabIndex';

const StarSigns = ({ starSigns, infiniteStars }) => {
  const tabs = getTabs(PAGES.ACCOUNT.misc.categories, 'constellations', 'Star Signs');
  const [selectedTab] = useTabIndex(tabs, { queryKey: 'nt' });
  const tree = selectedTab === 0 ? 'chronus' : selectedTab === 1 ? 'hydron' : 'seraph';
  // Infinite stars count from the first sign of Chronus on, so each later tree starts past the ones before it.
  const infiniteCount = selectedTab === 0 ? infiniteStars : selectedTab === 1 ? infiniteStars - 34 : infiniteStars - 63;
  // Each sign keeps its place in the whole tree, which is what the infinite stars count, before the game's
  // placeholders (Filler, Unknown) leave the list.
  const rows = starSigns.filter((sign) => sign.tree === tree)
    .map((sign, position) => ({ ...sign, position }))
    .filter(({ indexedStarName }) => !indexedStarName.includes('Filler') && !indexedStarName.includes('Unknown'));

  const columns = [
    {
      key: 'name',
      label: 'Name',
      icon: ({ unlocked }) => (unlocked
        ? <CheckIcon titleAccess={'Unlocked'} sx={{ color: 'text.success' }}/>
        : <Box component={'span'} sx={{ display: 'inline-block', width: 24, height: 24, flexShrink: 0 }}/>),
      render: ({ indexedStarName, unlocked, position }) => <>
        {cleanUnderscore(indexedStarName)}
        {unlocked && position < infiniteCount
          ? <img src={`${prefix}data/SignStarInf${selectedTab}.png`} alt={'Infinite star'}/>
          : null}
      </>
    },
    {
      key: 'bonuses',
      label: 'Bonuses',
      // What a sign gives is the point, so a phone keeps it beside the name; the cost waits under the chevron.
      phone: true,
      value: ({ bonuses, description }) => (bonuses
        ? bonuses.map(({ rawName, bonus }) => cleanUnderscore(formatStarSignBonus(rawName, bonus))).join(', ')
        : cleanUnderscore(description))
    },
    { key: 'cost', label: 'Cost', numeric: true, value: ({ cost }) => cost }
  ];

  return (
    <>
      <Tabber level={2} label={'Star signs'} tabs={tabs} labels={tabs.map((tab) => tab.capitalize())} keepChildren>
        <DataTable columns={columns} rows={rows} rowKey={'indexedStarName'} rowLabel={({ indexedStarName }) => cleanUnderscore(indexedStarName)}
                   surface={'card'}/>
      </Tabber>
    </>
  );
};

export default StarSigns;
