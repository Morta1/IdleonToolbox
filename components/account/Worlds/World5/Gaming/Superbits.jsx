import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { bitsIcon } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The page's fill: } is the superbit's count, { its total in the kind its sentence gives it ("x{" or "{x" a
// multiplier, "{%" a percent, a level or a count otherwise), the sentence keeping its own x or %
const totalKind = (description) => (/x\{|\{x/.test(description) ? 'mult' : /\{%/.test(description) ? 'pct' : 'amount');
const superbitText = ({ description, bonus, totalBonus }) => description
  ?.replace('}', formatNum(bonus ?? 0))
  ?.replace('{', formatNum(totalBonus ?? 0, totalKind(description), { bare: true }));

const GROUPS = [
  ['Super Bits', (item) => !item?.isDuper && !item?.isZuper],
  ['Duper Bits', (item) => item?.isDuper && !item?.isZuper],
  ['Zuper Bits', (item) => item?.isZuper]
];

const Superbits = ({ superbits, bits }) => {
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
    {GROUPS.map(([title, inGroup]) => {
      const group = (superbits ?? []).filter(inGroup);
      return group.length ? <Stack key={title} gap={2}>
        <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
        <CardGrid size={'m'}>{group.map(superbitCard)}</CardGrid>
      </Stack> : null;
    })}
  </Stack>;
};

export default Superbits;
