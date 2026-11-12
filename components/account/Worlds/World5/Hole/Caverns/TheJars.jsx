import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs, msToDate } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { PAGES } from '@components/constants';
import useTabIndex from '@hooks/useTabIndex';
import ViewSwitch from '@components/common/ViewSwitch';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatTile from '@components/common/cards/StatTile';
import IconTile from '@components/common/cards/IconTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Num from '@components/common/Num';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { MAX_JARS } from '@parsers/world-5/caverns/the-jars';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const VIEWS = getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole', 'Explore', 'The Jars');

// A drawer headed with its tile's own text
const withText = (breakdown, text) => (breakdown ? { ...breakdown, totalValue: text } : undefined);

const TheJars = ({ hole, sectionFailed }) => {
  const [view] = useTabIndex(VIEWS, { queryKey: 'dnt' });
  const theJars = hole?.caverns?.theJars;
  const perHour = theJars?.perHour?.value ?? 0;
  const perHourText = formatNum(perHour);
  const rupieText = formatGame(theJars?.rupieValue?.value ?? 0, 'Holes.JarRupieValue');
  const newJar = theJars?.newJar;
  const extraText =formatNum(theJars?.rupieExtraChance?.value ?? 0, 'pct');

  const jarCard = (jar, index) => {
    const req = jar?.req ?? 0;
    const perSlots = (slots) => (req > 0 ? Math.floor((perHour * slots) / req) : 0);
    // Info 5: the rate with one, two and three slots on this jar, a list inside a hover note before
    const rates = createBreakdown(`${jar?.name} per hour`, formatNum(perSlots(1)), flatLines([1, 2, 3].map((slots) => ({
      name: `${slots} ${slots === 1 ? 'slot' : 'slots'}`, value: perSlots(slots), formatted: formatNum(perSlots(slots))
    }))), { combine: 'list' });
    const tiers = jar?.owned?.tiers ?? [];
    const heldText = `${formatNum(jar?.owned?.total ?? 0, 'whole')} (${formatNum(jar?.owned?.quantity ?? 0, 'whole')} quantity)`;
    // Each tier's count and what it is worth in tier 1 jars, a hover list before (the muted tier line goes with it)
    const held = tiers.length ? createBreakdown(`${jar?.name} held`, heldText, flatLines(tiers.map(({ tier, count }) => ({
      name: `Tier ${tier}`, value: count,
      formatted: `${formatNum(count, 'whole')} (${formatNum(count * Math.pow(10, tier - 1), 'whole')} quantity)`
    }))), { combine: 'list' }) : null;
    const enchant = jar?.enchant?.breakdown;
    const newCollectible = jar?.newCollectible?.breakdown;
    return <ItemCard key={`jar-${index}`} icon={`etc/Jar_${index}.png`} title={cleanUnderscore(jar?.name)} dimmed={!jar?.unlocked}>
      <ItemCard.Desc>{jar?.effect}</ItemCard.Desc>
      <ItemCard.Facts rows={[
        enchant ? ['Enchant chance', <Breakdown key={'enchant'} asValue data={enchant}>{enchant.totalValue}</Breakdown>] : null,
        newCollectible ? ['New collectible chance', <Breakdown key={'collectible'} asValue data={newCollectible}>
          {newCollectible.totalValue}
        </Breakdown>] : null,
        ['Jars per hour', <Breakdown key={'rates'} asValue data={rates}>{formatNum(perSlots(1))}</Breakdown>],
        ['Destroyed', jar?.destroyed ?? 0, 'amount'],
        ['Held', held ? <Breakdown key={'held'} asValue data={held}>{heldText}</Breakdown> : heldText],
        ['Time to full', perHour > 0 ? msToDate((req / perHour) * 3600 * 1000) : '-'],
        ['Needed', Math.floor(req), 'amount']
      ]}/>
    </ItemCard>;
  };

  return <>
    <CardGrid size={'icon'} sx={{ mb: 3 }}>
      {(theJars?.rupies ?? []).map((amount, index) => {
        const owned = Math.floor(Number(amount) || 0);
        const name = `Rupie tier ${index + 1}`;
        // Big, as the rupie costs print (ItemCard.Cost's default)
        return <IconTile key={`rupie-${index}`} icon={`data/HoleJarR${index}.png`} alt={name} value={<Num value={owned} game={'Big'} whole/>}
                         status={owned > 0 ? undefined : 'missing'} details={`${name}: ${formatNum(owned, 'exact')}`}/>;
      })}
    </CardGrid>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
      <StatTile label={'Progress per hour'} value={perHourText} breakdown={withText(theJars?.perHour?.breakdown, perHourText)}/>
      <StatTile label={'Progress per minute'} value={perHour / 60} kind={'amount'}/>
      <StatTile label={'Rupie value'} value={rupieText} breakdown={withText(theJars?.rupieValue?.breakdown, rupieText)}/>
      <StatTile label={'Extra rupie chance'} value={extraText}
                breakdown={withText(theJars?.rupieExtraChance?.breakdown, extraText)}/>
      <StatTile label={'Total jars'} value={`${formatNum(theJars?.totalJars ?? 0)} / ${formatNum(MAX_JARS)}`}/>
      <StatTile label={'Total quantity'} value={theJars?.totalJarQuantity ?? 0} kind={'whole'}
                info={'Every jar counted as its tier 1 equivalent: a tier 2 jar is worth 10.'}/>
      <StatTile label={'Total enhancing levels'} value={theJars?.totalEnhancingLevels ?? 0} kind={'amount'}/>
      <StatTile label={'Total jars destroyed'} value={theJars?.totalJarsDestroyed ?? 0} kind={'amount'}/>
      <StatTile label={'Next jar type'}
                value={newJar?.maxed ? 'All jar types owned' : <ItemCard.Cost icon={`data/HoleJarR${newJar?.rupieTier ?? 0}.png`}
                                                                   iconAlt={`Rupie tier ${(newJar?.rupieTier ?? 0) + 1}`}
                                                                   need={newJar?.cost ?? 0} have={newJar?.owned ?? 0}/>}
                sub={newJar?.maxed ? undefined : cleanUnderscore(theJars?.jars?.[(newJar?.rupieTier ?? 0) + 1]?.name)}/>
      {opalsFoundTile(hole, 10)}
    </Stack>
    {theJars?.activeSlots?.length ? <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      {theJars.activeSlots.map(({ progress, req, jarType }, index) => <StatTile key={`slots-${index}`}
        label={cleanUnderscore(theJars?.jars?.[jarType]?.name)} icon={`etc/Jar_${jarType}.png`}
        value={`${formatNum(Math.floor(progress ?? 0))} / ${formatNum(Math.floor(req ?? 0))}`}/>)}
    </Stack> : null}
    {/* How this cavern shows (Tabs board, level 3): a switch in its title row, still ?dnt= in the URL. */}
    {sectionFailed ? null : <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} mb={2}>
      <Typography variant={'sectionTitle'} component={'h2'}>The Jars</Typography>
      <ViewSwitch options={VIEWS.map((name) => [name, name])} queryKey={'dnt'} label={'The Jars view'} sx={{ ml: 'auto' }}/>
    </Stack>}
    {view === 0
      ? <CardGrid size={'m'}>{(theJars?.jars ?? []).map(jarCard)}</CardGrid>
      : <CardGrid size={'m'}>
        {(theJars?.collectibles ?? []).map(({ name, level, description, doubled }, index) =>
          <ItemCard key={`collectible-${index}`} icon={`data/HoleJarC${index}.png`} title={name} level={{ value: level ?? 0 }}
                    dimmed={!(level > 0)}
                    aside={doubled
                      ? <Typography variant={'caption'} color={'secondary'}>x2 Doubled</Typography> : null}>
            <ItemCard.Desc text={description}/>
          </ItemCard>)}
      </CardGrid>}
  </>;
};

export default TheJars;
