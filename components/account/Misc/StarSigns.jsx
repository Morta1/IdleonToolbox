import React from 'react';
import { Box } from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import { visuallyHidden } from '@mui/utils';
import { cleanUnderscore, formatStarSignBonus, getTabs } from 'utility/helpers';
import GameIcon from '@components/common/GameIcon';
import { SectionPills } from '@components/common/SectionTabs';
import DataTable from '@components/common/DataTable';
import { PAGES } from '@components/constants';
import useTabIndex from '@hooks/useTabIndex';
import usePageTop from '@hooks/usePageTop';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const TREES = ['chronus', 'hydron', 'seraph'];
const STAR_SIGNS_TOOLBAR = { search: '' };

const bonusLines = ({ bonuses, description }) => (bonuses
  ? bonuses.map(({ rawName, bonus }) => cleanUnderscore(formatStarSignBonus(rawName, bonus)))
  : [cleanUnderscore(description)]);

const StarSigns = ({ starSigns }) => {
  const tabs = getTabs(PAGES.ACCOUNT.misc.categories, 'constellations', 'Star Signs');
  const [selectedTab, selectTab] = useTabIndex(tabs, { queryKey: 'nt' });
  // 34 rows: the header sticks under the page's top, as Constellations' does.
  const pageTop = usePageTop();
  const [view, setView, resetView] = useToolbarState('star-signs', STAR_SIGNS_TOOLBAR);
  // Search reads the name and the bonus lines across the three trees; each tree's tab counts its matches
  const search = (view?.search ?? '').trim().toLowerCase();
  // The game's placeholders (Filler, Unknown) are not signs
  const signs = (starSigns ?? []).filter(({ indexedStarName }) => !indexedStarName.includes('Filler') && !indexedStarName.includes('Unknown'));
  const matches = (sign) => !search || `${cleanUnderscore(sign?.indexedStarName)} ${bonusLines(sign).join(' ')}`.toLowerCase().includes(search);
  const byTree = TREES.map((tree) => signs.filter((sign) => sign.tree === tree && matches(sign)));
  const rows = byTree[selectedTab] ?? [];
  const shownCount = byTree.reduce((sum, list) => sum + list.length, 0);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      icon: ({ unlocked }) => (unlocked
        ? <Box component={'span'} sx={{ display: 'inline-flex', width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center', color: 'text.success' }}>
          <IconCheck size={20} stroke={2.5} aria-hidden={'true'}/><Box component={'span'} sx={visuallyHidden}>Unlocked</Box>
        </Box>
        : <Box component={'span'} sx={{ display: 'inline-block', width: 24, height: 24, flexShrink: 0 }}/>),
      // The game turns signs infinite in its catalog order, not this list's (the parser's isInfiniteStar)
      render: ({ indexedStarName, isInfiniteStar }) => <>
        {cleanUnderscore(indexedStarName)}
        {isInfiniteStar
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
      {/* The trees sit beside the search: one bar, each tree's pill counting its matches while a search is on */}
      <Toolbar state={view} defaults={STAR_SIGNS_TOOLBAR} onChange={setView} onReset={resetView}
               total={signs.length} shown={shownCount} noun={'star signs'}>
        <Toolbar.Search placeholder={'Search signs or bonuses'}/>
        <Toolbar.Lead ownRow>
          <SectionPills tabs={tabs} selectedTab={selectedTab} onSelect={selectTab} label={'Star signs'} sx={{ mb: 0, alignSelf: 'center' }}
                        names={tabs.map((tab, index) => (search ? `${tab.capitalize()} (${byTree[index]?.length ?? 0})` : tab.capitalize()))}/>
        </Toolbar.Lead>
      </Toolbar>
      <DataTable columns={columns} rows={rows} rowKey={'indexedStarName'} rowLabel={({ indexedStarName }) => cleanUnderscore(indexedStarName)}
                 surface={'card'} stickyTop={pageTop}/>
    </>
  );
};

export default StarSigns;
