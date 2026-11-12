import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { bitsIcon, superbitFill } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const SUPERBITS_TOOLBAR = { search: '', group: 'all', hideOwned: false };

// The game's fill: } is the superbit's count, { its total in the mode the game's own tooltip draws it in for that
// superbit, the sentence keeping its own x or %
const superbitText = ({ description, bonus, totalBonus, originalIndex }) => description
  ?.replace('}', formatNum(bonus ?? 0))
  ?.replace('{', superbitFill(originalIndex, totalBonus));

const GROUPS = [
  ['super', 'Super Bits', (item) => !item?.isDuper && !item?.isZuper],
  ['duper', 'Duper Bits', (item) => item?.isDuper && !item?.isZuper],
  ['zuper', 'Zuper Bits', (item) => item?.isZuper]
];

const Superbits = ({ superbits, bits }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('gaming-superbits', SUPERBITS_TOOLBAR);
  const all = superbits ?? [];
  // One group at a time from its pill (none picked shows all three), owned ones hidden on request
  const groups = GROUPS.filter(([key]) => !toolbar?.group || toolbar.group === 'all' || toolbar.group === key)
    .map(([key, title, inGroup]) => [key, title, all.filter(inGroup)]);
  // By name or by what it does ("snail", "palette"), within the picked group
  const search = String(toolbar?.search ?? '').trim().toLowerCase();
  const matches = (upgrade) => !search || [upgrade?.name, superbitText(upgrade), upgrade?.additionalInfo]
    .some((text) => cleanUnderscore(String(text ?? '')).toLowerCase().includes(search));
  const visible = (group) => group.filter((upgrade) => (!toolbar?.hideOwned || !upgrade?.unlocked) && matches(upgrade));
  const shownTotal = groups.reduce((sum, [, , group]) => sum + visible(group).length, 0);
  const superbitCard = (upgrade, index) => {
    const { name, unlocked, additionalInfo, cost } = upgrade;
    return <ItemCard key={`${name}-${index}`} title={cleanUnderscore(name?.capitalize?.() ?? name)} dimmed={!unlocked}
                     status={unlocked ? 'done' : undefined} statusLabel={unlocked ? 'Owned' : undefined}
                     footer={unlocked ? null : <ItemCard.Cost icon={bitsIcon}
                                                              iconAlt={'Bits'} need={cost ?? 0} have={bits ?? 0}
                                                              game={'GamingStatType.SuperbitCost'}/>}>
      <ItemCard.Desc text={superbitText(upgrade)}/>
      {additionalInfo ? <ItemCard.Desc text={additionalInfo}/> : null}
    </ItemCard>;
  };

  return <Stack gap={4}>
    <Toolbar state={toolbar} defaults={SUPERBITS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={all.length} shown={shownTotal} noun={'superbits'}>
      <Toolbar.Search placeholder={'Search superbits'}/>
      <Toolbar.Show name={'group'} label={'Group'} pills options={[
        ['all', 'All', all.length],
        ...GROUPS.map(([key, title, inGroup]) => [key, title, all.filter(inGroup).length])
      ]}/>
      <Toolbar.Filter name={'hideOwned'} label={'Hide owned'}/>
    </Toolbar>
    {groups.map(([key, title, group]) => {
      const shown = visible(group);
      return shown.length ? <Stack key={key} gap={2}>
        <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
        <CardGrid size={'m'}>{shown.map(superbitCard)}</CardGrid>
      </Stack> : null;
    })}
  </Stack>;
};

export default Superbits;
