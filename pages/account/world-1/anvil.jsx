import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, fillArrayToLength, formatNum, getCoinsArray } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from 'components/common/Timer';
import {
  calcTotals,
  getAnvilProductCatalog,
  getAnvilSlotPerHour,
  getAnvilTotalsBreakdowns,
  getAnvilExpBreakdown,
  getAnvilFutureExp,
  getAnvilFutureProduction,
  getAnvilTotalPoints,
  getPlayerAnvil,
  getTimeTillCap
} from '@parsers/world-1/anvil';
import { isCompanionBonusActive } from '@parsers/misc';
import { items } from '@website-data';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import { Duration } from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';
import { DIM } from '@components/common/cards/tokens';
import GameIcon from '@components/common/GameIcon';
import MetaParts from '@components/common/MetaParts';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CoinDisplay from '@components/common/CoinDisplay';

// The anvil is the characters' own, not a section: its speed reads these sections (the stamp, the statue, the star
// sign, the vault upgrade and the Hammer Hammer bubble). While one failed, every number made from the speed reads "-",
// and the note names the first failed in this order.
const SECTION_NAMES = {
  stamps: 'Stamps', statues: 'Statues', starSigns: 'Star Signs', upgradeVault: 'the Upgrade Vault',
  equippedBubbles: 'equipped bubbles', alchemy: 'Bubbles', companions: 'Companions'
};
const SPEED_SECTIONS = Object.keys(SECTION_NAMES);

const itemName = (rawName) => cleanUnderscore(items?.[rawName]?.displayName ?? rawName);

// game: the count it sets as the anvil opens: one, one with Hammer Hammer equipped (Sheepie counts every big bubble as
// equipped), and one from the gem shop
const SHEEPIE = 4;
const THIRD_HAMMER_GEM_ITEM = 103;
const hammersOwned = (character, account) => 1
  + (character?.equippedBubbles?.some(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER') || isCompanionBonusActive(account, SHEEPIE) ? 1 : 0)
  + (account?.gemShopPurchases?.[THIRD_HAMMER_GEM_ITEM] === 1 ? 1 : 0);

const LINE_SX = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 };
const BAR_SX = { flex: 1, height: 6, borderRadius: 3, bgcolor: 'divider' };
const NAME_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5 };
// The time to full sits level with the product's name, not in the middle of its lines
const ROW_SX = { alignItems: 'flex-start' };
const EMPTY_SX = { opacity: DIM };

// One line of parts, each kept whole ("Points 300 / 320" never breaks inside its pair)
const metaLine = (parts) => <MetaParts>{parts}</MetaParts>;

// A material cost as the game's sprite after the amount: an item's name made both rows wrap in the note
const matAmount = (amount, rawName) => <Box component={'span'} sx={NAME_SX}>
  {formatNum(amount, 'whole')}<GameIcon src={`data/${rawName}.png`} size={16} alt={itemName(rawName)}/>
</Box>;

// Where the points came from and the next ones to buy: only the material being bought now, as players farm one at a
// time. Every material to max is on the character page.
const pointsNote = (stats) => {
  const { anvilCost = {}, pointsFromCoins = 0, pointsFromMats = 0 } = stats ?? {};
  const [currentMat, nextMat] = anvilCost?.matsToMax ?? [];
  // The last material runs to the 700 cap; an earlier one only until the anvil asks for the next item
  const restLabel = nextMat ? `Next ${formatNum(currentMat?.points, 'whole')} points` : 'To max';
  const rows = [
    ['From coins', formatNum(pointsFromCoins, 'whole')],
    ['From materials', formatNum(pointsFromMats, 'whole')],
    ['From Acme Anvil', formatNum(stats?.pointsFromAcme ?? 0, 'whole')],
    ...(anvilCost?.coinsToMax > 0 ? [['Next coin point', <CoinDisplay key={'next-coin'} dense money={getCoinsArray(anvilCost?.nextCoinUpgrade)}/>]] : []),
    ...(currentMat ? [['Next material point', matAmount(anvilCost?.nextMatUpgrade, currentMat.rawName)],
      ...(currentMat.points > 1 ? [[restLabel, matAmount(currentMat.amount, currentMat.rawName)]] : [])] : [])
  ];
  return <ItemCard.Facts rows={rows}/>;
};

const catalogCard = ({ rawName, displayName, requiredAmount, levelReq, exp }) => <ItemCard
  key={rawName} icon={`data/${rawName}.png`} title={cleanUnderscore(displayName)}>
  <ItemCard.Facts rows={[['Smithing Lv', formatNum(levelReq ?? 0, 'whole')], ['Materials', formatNum(requiredAmount ?? 0, 'whole')],
    ['EXP per craft', formatNum(exp ?? 0)]]}/>
</ItemCard>;

const Anvil = () => {
  const { state } = useContext(AppContext);
  const anvil = state?.account?.anvil ?? [];
  const speedFailed = SPEED_SECTIONS.find((section) => isSectionFailed(state?.account, section));

  const totals = calcTotals(state?.account, state?.characters) ?? {};
  const totalsBreakdowns = getAnvilTotalsBreakdowns(state?.account, state?.characters);

  const productTile = ([rawName, perHour]) => {
    const name = itemName(rawName);
    const text = speedFailed ? '-' : formatNum(perHour, 'rate');
    const breakdown = speedFailed ? undefined : totalsBreakdowns?.[rawName];
    return <StatTile key={rawName} icon={`data/${rawName}.png`} label={name} value={text}
                     sub={speedFailed ? undefined : `${formatNum(perHour * 24)} per day`}
                     breakdown={breakdown ? { ...breakdown, totalValue: text } : undefined}
                     breakdownTitle={name} breakdownNoun={'characters'}/>;
  };

  // A slot in two lines under its product, as the old page had it: the cap's bar with its numbers, then the hammers and
  // the EXP waiting; the time to full on the right. The rate, the time from empty and the EXP a craft open from its i.
  // A card per slot with six fact rows stacked two or three a character, 1.11x the old page's height.
  const slotRow = (slot, slotIndex, stats, afkTime) => {
    if (!slot?.hammers) return <Panel.Row key={`empty-${slotIndex}`} name={'Empty slot'} sub={'A free hammer'} sx={EMPTY_SX}/>;
    const { rawName, hammers, displayName, exp, totalProduced } = slot;
    const future = getAnvilFutureProduction({ ...slot, stats, afkTime });
    const capacity = stats?.anvilCapacity;
    const percentOfCap = Math.round(future / capacity * 100);
    const perDay = 24 * getAnvilSlotPerHour(stats, slot);
    const timeTillCap = getTimeTillCap({ ...slot, stats, afkTime });
    const timeFromZero = getTimeTillCap({
      ...slot,
      stats,
      afkTime,
      currentAmount: 0,
      currentProgress: 0,
      fromZero: true
    });
    const capText = formatGame(capacity, 'AnvilProduceStats.Cap', { whole: true });
    const fullIn = percentOfCap >= 100
      ? <StatusText status={'ready'}>Full</StatusText>
      : <Timer type={'countdown'} component={'span'} date={new Date().getTime() + (timeTillCap * 1000)}
               lastUpdated={state?.lastUpdated} placeholder={<StatusText status={'ready'}>Full</StatusText>}/>;
    const name = cleanUnderscore(displayName ?? rawName);
    const full = !speedFailed && percentOfCap >= 100;
    return <Panel.Row key={`${rawName}-${slotIndex}`} icon={`data/${rawName}.png`} sx={ROW_SX}
                      name={<Box component={'span'} sx={NAME_SX}>
                        {name}
                        <InfoButton label={name}>
                          <ItemCard.Facts rows={[
                            ['Per day', speedFailed ? '-' : formatNum(perDay)],
                            ['Full from empty', speedFailed ? '-' : <Duration seconds={timeFromZero}/>],
                            ['EXP per craft', formatNum((exp ?? 0) * (stats?.expMulti ?? 1))],
                            ['Made all time', formatNum(totalProduced ?? 0, 'whole')]
                          ]}/>
                        </InfoButton>
                      </Box>}
                      value={speedFailed ? '-' : fullIn}
                      valueSub={speedFailed || full ? undefined : 'until full'}
                      sub={<Stack component={'span'} gap={0.5} sx={{ mt: 0.5 }}>
                        {/* Without the speed, the amount made since the save is unknown: the cap alone, no bar */}
                        <Box component={'span'} sx={LINE_SX}>
                          {speedFailed ? null : <LinearProgress variant={'determinate'} aria-label={`${name}: share of the cap`}
                                                                value={Number.isFinite(percentOfCap) ? Math.min(100, percentOfCap) : 0}
                                                                color={full ? 'success' : 'primary'} sx={BAR_SX}/>}
                          <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>
                            {speedFailed ? `Cap ${capText}` : `${formatGame(future, 'AnvilProduceStats.Cap', { whole: true })} / ${capText}`}
                          </Box>
                        </Box>
                        <span>{metaLine([`${formatNum(hammers)} ${hammers === 1 ? 'hammer' : 'hammers'}`,
                          `${formatGame(speedFailed ? slot.currentXP ?? 0 : getAnvilFutureExp({ ...slot, stats, afkTime }), 'Big', { whole: true })} EXP waiting`])}</span>
                      </Stack>}/>;
  };

  const anvilPanel = (_, index) => {
    const character = state?.characters?.[index];
    const smithing = character?.skillsInfo?.smithing?.level ?? 0;
    const { stats, production } = getPlayerAnvil(character, state?.characters, state?.account);
    const { availablePoints = 0, pointsFromCoins = 0, pointsFromMats = 0 } = stats ?? {};
    const totalPoints = getAnvilTotalPoints(stats, smithing);
    const working = production?.filter(({ hammers }) => hammers > 0) ?? [];
    const placed = working.reduce((res, { hammers }) => res + hammers, 0);
    // An Empty slot is a free hammer. Hammers stack on a product, so a card per hammer would draw blanks for a full anvil
    const free = Math.max(0, hammersOwned(character, state?.account) - placed);
    const slots = fillArrayToLength(working.length + free, working);
    const speedText = `${formatGame(stats?.anvilSpeed, 'AnvilProduceStats.ProductionSpeed')} / hr`;
    // Two lines on every card, the full card width each: the speed on the right squeezed the rest into three
    const speed = speedFailed ? null : <span key={'speed'}>Speed <Breakdown asValue title={`${cleanUnderscore(character?.name)}: anvil speed`}
                                                                          data={{ ...stats?.speedBreakdown, totalValue: speedText }}>{speedText}</Breakdown></span>;
    const meta = <>
      {metaLine([`Smithing ${formatNum(smithing, 'level')}`, speed])}
      {metaLine([<Box component={'span'} key={'points'} sx={NAME_SX}>
        {`Points ${formatNum(totalPoints - availablePoints)} / ${formatNum(totalPoints)}`}
        <InfoButton label={'Anvil points'}>{pointsNote(stats)}</InfoButton>
      </Box>,
      availablePoints > 0 ? `${formatNum(availablePoints)} unspent` : null])}
    </>;
    return <Panel key={`anvil-${index}`} icon={`data/ClassIcons${character?.classIndex}.png`}
                  title={cleanUnderscore(character?.name) || `Character ${index + 1}`} meta={meta}>
      {slots.map((slot, slotIndex) => slotRow(slot, slotIndex, stats, character?.afkTime))}
    </Panel>;
  };

  const products = Object.entries(totals);
  const { perHour: expPerHour, breakdown: expBreakdown } = getAnvilExpBreakdown(state?.account, state?.characters);
  const expText = speedFailed ? '-' : formatNum(expPerHour, 'rate');
  const expTile = expPerHour > 0 ? <StatTile key={'smithing-exp'} icon={'data/ClassIcons43.png'} label={'Smithing EXP'} value={expText}
                                             sub={speedFailed ? undefined : `${formatNum(expPerHour * 24)} per day`}
                                             breakdown={speedFailed ? undefined : { ...expBreakdown, totalValue: expText }}
                                             breakdownTitle={'Smithing EXP'} breakdownNoun={'characters'}/> : null;

  return <>
    <NextSeo
      title="Anvil | Idleon Toolbox"
      description="Monitor your characters' anvil production rates, craft queues, and smithing progress in Legends of Idleon"
    />
    {speedFailed ? <MissingData name={SECTION_NAMES[speedFailed]} failed/> : !anvil.length
      ? <Notice tone={'signin'} sx={{ mb: 2 }}>Each character&apos;s anvil shows here once you sign in.</Notice>
      : null}
    {products.length ? <PageSummary>{expTile}{products.map(productTile)}</PageSummary> : null}
    {/* Two or three characters a row from md: a character runs two or three slots, so a full-width Panel was mostly
     empty */}
    {anvil.length ? <CardGrid size={'l'}>{anvil.map(anvilPanel)}</CardGrid> : <>
      <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>Anvil products</Typography>
      <CardGrid size={'s'}>{getAnvilProductCatalog().map(catalogCard)}</CardGrid>
    </>}
  </>;
};

export default Anvil;
