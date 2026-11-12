import { Box, Stack, Typography } from '@mui/material';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { formatNum, gameFill, getCoinsArray } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, PlayersList, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import CoinDisplay from '@components/common/CoinDisplay';
import InfoButton from '@components/common/InfoButton';
import { Duration } from '@components/common/Num';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import {
  CAULDRON_INFO,
  CAULDRONS_MAX_LEVELS,
  LIQUID_INFO,
  getAlchemy,
  getBaseNewBubbleChance,
  getMaxCauldron
} from '@parsers/world-2/alchemy';
import { NUMBERED_GROUP, createBreakdown, flat, info, listGroup, multiplier, productGroup } from '@parsers/breakdown';

// The sections the page reads, in the order the note names the first that failed: the alchemy section and the two
// parts the parser adds to it on their own (safeSection 'alchemy.cauldrons': the brew speeds and new bubble chances;
// 'alchemy.liquidCauldrons': the liquid caps)
const SECTION_NAMES = { alchemy: 'Cauldrons', 'alchemy.cauldrons': 'Brewing', 'alchemy.liquidCauldrons': 'Liquids' };

// Each boost's effect in the game's own words (the cauldron panel's "Speed (Lv.{) - Brew Rate increased by }%")
const BOOSTS = [
  ['speed', 'Speed', (bonus) => `+${formatNum(bonus)}% brew rate`],
  ['luck', 'Luck', (bonus) => `${formatNum(bonus)}x new bubble chance`],
  ['cost', 'Cost', (bonus) => `-${formatNum(bonus)}% bubble costs`],
  ['extra', 'Extra', (bonus) => `${formatNum(bonus)}% double level chance`]
];
const DECANT_EFFECT = { Cap: (bonus) => `+${formatNum(bonus)} capacity`, Rate: (bonus) => `+${formatNum(bonus)}% regen` };
const NEXT_BUBBLES_SHOWN = 10;
const HEADING_SX = { mt: 4, mb: 1.5 };

// The game rounds this to 0.01%, which hides everything past the first few worlds.
const formatChance = (chance) => formatNum(Math.min(chance, 100), 'pct', { precise: true });
// The game draws a brew boost's and a liquid's Cap and Rate pair in Big on both sides (CauldronStats.CauldronLvsBrewREQ)
const brewReq = (value) => formatGame(value, 'CauldronStats.CauldronLvsBrewREQ', { whole: true });
// The game draws the liquid in its jar in Small beside the cap in Big: NotateNumber(CauldronInfo[6][i], "Small"), a
// save field with no gameNotation key, so the mode is named here. A balance a bubble's cost spends, so it stays as the game prints it
const liquidAmount = (value) => gameFill(value, 'Small', { whole: true });

// Time to full needs a cap and a rate above zero; a full jar reads Ready
const hasRateAndCap = (maxLiquid, rate) => Number.isFinite(maxLiquid) && rate?.value > 0;

// A level against its max, with the Maxed word once it is there
const levelValue = (level = 0, max) => (level >= max
  ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    {formatNum(level, 'level', { max })}<StatusText status={'maxed'}/>
  </Box>
  : formatNum(level, 'level', { max }));

// One pay 2 win upgrade: its level and, while under its own max, what the next level and the rest cost. A failed
// section's catalog and a liquid not found yet have no cost.
const upgradeSection = (label, { level = 0, cost, costToMax } = {}, max, failed) => <ItemCard.Section key={label}
                                                                                                    label={label}>
  <ItemCard.Facts rows={[
    ['Level', failed ? '-' : levelValue(level, max)],
    !failed && cost !== null && level < max ? ['Next cost', <CoinDisplay key={'next'} dense money={getCoinsArray(cost ?? 0)}/>] : null,
    !failed && cost !== null && level < max
      ? ['Cost to max', <CoinDisplay key={'max'} dense money={getCoinsArray(costToMax ?? 0)}/>]
      : null
  ]}/>
</ItemCard.Section>;

const getNewBubbleBreakdown = (displayName, cauldron) => {
  const { newBubble, unlockedBubbles = 0 } = cauldron;
  const nextBubbles = Array.from({ length: NEXT_BUBBLES_SHOWN }, (_, offset) => {
    const unlocked = unlockedBubbles + offset;
    const bubble = unlocked + 1;
    const chance = getBaseNewBubbleChance(unlocked) * newBubble.multi;
    const brew = formatGame(getMaxCauldron(unlocked), 'CauldronStats.MaxCauldronQTY', { whole: true });
    return info(`#${bubble} (World ${Math.ceil(bubble / 5)}): ${brew} per attempt`, chance,
      { formatted: formatChance(chance) });
  });
  const factors = newBubble.breakdown ?? [];
  const base = factors.find(({ name }) => name === 'Base')?.value ?? 0;
  return createBreakdown(`${displayName} new bubble chance`, formatChance(newBubble.chance), [
    flat('Base', base, { formatted: formatChance(base) }),
    productGroup(NUMBERED_GROUP, factors.filter(({ name }) => name !== 'Base')
      .map(({ name, value }) => multiplier(name, value))),
    listGroup('Next bubbles', nextBubbles)
  ]);
};

// A brew boost: its level and the brew toward the next one (the game floors it first), Maxed at the cap. A failed
// section's catalog has no brew: the pair reads "-" with no bar
const boostRow = ([statName, label], { level = 0, progress = 0, req = 0 } = {}, failed) => {
  if (failed) return <ItemCard.Facts key={statName} rows={[[label, '-']]}/>;
  const name = `${label} · ${formatNum(level, 'level', { max: CAULDRONS_MAX_LEVELS.brewing })}`;
  return level >= CAULDRONS_MAX_LEVELS.brewing
    ? <ItemCard.Facts key={statName} rows={[[name, <StatusText key={'maxed'} status={'maxed'}/>]]}/>
    : <ItemCard.Progress key={statName} label={name} value={brewReq(Math.floor(progress))} max={brewReq(req)}
                         percent={req > 0 ? Math.min(100, progress / req * 100) : 0}/>;
};

// A brewing cauldron. The brew speed and new bubble chance come from the parser's own step (alchemy.cauldrons): a
// failed step, or a failed section's catalog, has neither, so they read "-". A failed section's catalog has no brew
// either: its pairs and counts read "-" with no bar.
const brewingCard = ({ name, displayName }, index, cauldron = {}, characters, failed) => {
  const { newBubble, brewSpeed, attempts = 0, progress = 0, req = 0, players = [], boosts = {} } = cauldron;
  const towardNext = req > 0 ? progress - attempts * req : 0;
  // The game draws the pair in Small while the cauldron's max is under 10, Big from there (CauldronStats.MaxCauldronQTY)
  const brew = (value) => formatGame(value, 'CauldronStats.MaxCauldronQTY', { ruleValue: req, whole: true });
  const speedText = formatNum(brewSpeed?.value ?? 0, 'rate');
  const chanceText = formatChance(newBubble?.chance ?? 0);
  const expected = newBubble ? ` (about ${formatNum(newBubble.expectedBubbles ?? 0)} bubbles)` : '';
  return <ItemCard key={name} icon={`data/aJarB${index}.png`} title={displayName}
                   aside={players.length ? <PlayersList players={players} characters={characters}/> : null}>
    {failed ? null : <ItemCard.Progress label={'Next attempt'} value={brew(towardNext)} max={brew(req)}
                                        percent={req > 0 ? Math.min(100, towardNext / req * 100) : 0}/>}
    <ItemCard.Facts rows={[
      failed ? ['Next attempt', '-'] : null,
      ['Brew speed', brewSpeed
        ? <Breakdown key={'speed'} asValue title={`${displayName} brew speed`}
                     data={{ ...brewSpeed.breakdown, totalValue: speedText }}>{speedText}</Breakdown>
        : '-'],
      ['New bubble chance', newBubble
        ? <Breakdown key={'chance'} asValue title={`${displayName} new bubble chance`}
                     data={getNewBubbleBreakdown(displayName, cauldron)}>{chanceText}</Breakdown>
        : '-'],
      newBubble?.chance > 0 && newBubble.chance < 50 ? ['Odds', formatNum(newBubble.chance / 100, 'odds')] : null,
      ['Attempts ready', failed ? '-' : attempts > 0 ? `${formatNum(attempts)}${expected}` : '0']
    ]}/>
    <ItemCard.Section label={failed ? 'Boosts' : <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      Boosts
      {/* What each boost gives: one note, since at the same levels every cauldron repeats the same four lines */}
      <InfoButton label={`${displayName} boosts`}>
        <ItemCard.Facts rows={BOOSTS.map(([statName, label, effect]) => [label, effect(boosts?.[statName]?.bonus ?? 0)])}/>
      </InfoButton>
    </Box>}>
      {BOOSTS.map((boost) => boostRow(boost, boosts?.[boost[0]], failed))}
    </ItemCard.Section>
  </ItemCard>;
};

// A liquid's jar. Its cap and its Cap and Rate levels come from the parser's own step (alchemy.liquidCauldrons): with
// that step or the section failed they read "-", and the liquid shows no bar and no half a pair.
const liquidCard = ({ displayName }, index, { upgrades = {}, jar, amount, characters, failed }) => {
  const { regen, capacity, players = [] } = upgrades;
  const { maxLiquid, decantCap, decantRate, isDragonic, maxLiquidBreakdown, rate } = jar ?? {};
  const hasCap = Number.isFinite(maxLiquid);
  const rateText = rate ? `${formatNum(rate.value)}/hr` : null;
  // Under one unit short reads full: the jar's amount and cap differ only past the decimal
  const toFull = hasRateAndCap(maxLiquid, rate) ? Math.max(0, maxLiquid - amount) / rate.value * 3600 : null;
  const isFull = hasCap && maxLiquid - amount < 1;
  const capText = hasCap ? formatGame(maxLiquid, 'CauldronStats.LiquidCap', { whole: true }) : '-';
  const cap = hasCap && maxLiquidBreakdown
    ? <Breakdown key={'cap'} asValue title={`${displayName} capacity`}
                 data={{ ...maxLiquidBreakdown, totalValue: capText }}>{capText}</Breakdown>
    : capText;
  const decant = (label, { level = 0, progress = 0, req = 0, bonus = 0 } = {}) => (jar
    ? [`${label} · ${formatNum(level, 'level')} · ${DECANT_EFFECT[label](bonus)}`, `${brewReq(progress)} / ${brewReq(req)}`]
    : [label, '-']);
  return <ItemCard key={displayName} icon={`data/aJarL${index}.png`} title={displayName}
                   meta={isDragonic ? 'Dragonic' : undefined}
                   aside={isDragonic || players.length ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                     {isDragonic ? <GameIcon src={'data/GemP18.png'} size={24} alt={'Dragonic'}/> : null}
                     {players.length ? <PlayersList players={players} characters={characters}/> : null}
                   </Stack> : null}>
    {hasCap ? <ItemCard.Progress label={'Liquid'} value={liquidAmount(amount)} max={cap}
                                 percent={maxLiquid > 0 ? Math.min(100, amount / maxLiquid * 100) : 0}/> : null}
    <ItemCard.Facts rows={[
      hasCap ? null : ['Liquid', '-'],
      ['Per hour', rate
        ? <Breakdown key={'rate'} asValue title={`${displayName} per hour`}
                     data={{ ...rate.breakdown, totalValue: rateText }}>{rateText}</Breakdown>
        : '-'],
      isFull ? null
        : toFull !== null ? ['Full in', <Duration key={'full'} seconds={toFull}/>] : null,
      decant('Cap', decantCap),
      decant('Rate', decantRate)
    ]}/>
    {upgradeSection('Regen', regen, CAULDRONS_MAX_LEVELS.liquidsRegen, failed)}
    {upgradeSection('Capacity', capacity, CAULDRONS_MAX_LEVELS.liquidsCapacity, failed)}
  </ItemCard>;
};

const Cauldrons = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const characters = state?.characters;
  const failedSection = Object.keys(SECTION_NAMES).find((section) => isSectionFailed(account, section));
  const alchemyFailed = isSectionFailed(account, 'alchemy');
  // The caps are worked out from the alchemy section, so they count as failed with it too
  const liquidsFailed = alchemyFailed || isSectionFailed(account, 'alchemy.liquidCauldrons');
  // A failed section's {} default: the catalog at zero, the parser's own with no save, with no cost, rate or player
  const alchemy = alchemyFailed ? getAlchemy({}, [], {}) : account?.alchemy;
  const { player, vials } = alchemy?.p2w ?? {};

  return (
    <>
      <NextSeo
        title="Cauldrons | Idleon Toolbox"
        description="Track your alchemy cauldron levels, brewing speed, and liquid capacity in Legends of Idleon"
      />
      {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed atZero={alchemyFailed}/> : null}
      <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>Brewing</Typography>
      <CardGrid size={'l'}>
        {CAULDRON_INFO.map((cauldron, index) => brewingCard(cauldron, index, alchemy?.cauldrons?.[cauldron.name],
          characters, alchemyFailed))}
      </CardGrid>

      <Typography variant={'sectionTitle'} component={'h2'} sx={HEADING_SX}>Pay 2 Win</Typography>
      <Typography variant={'sectionTitle'} component={'h3'} sx={{ mb: 1.5 }}>Liquids</Typography>
      <CardGrid size={'m'}>
        {LIQUID_INFO.map((liquid, index) => {
          const amount = Number(alchemy?.liquids?.[index] ?? 0);
          return liquidCard(liquid, index, {
            upgrades: alchemy?.p2w?.liquids?.[index],
            jar: liquidsFailed ? undefined : alchemy?.liquidCauldrons?.[index],
            amount: Number.isFinite(amount) ? amount : 0,
            characters,
            failed: alchemyFailed
          });
        })}
      </CardGrid>

      <Typography variant={'sectionTitle'} component={'h3'} sx={HEADING_SX}>Cauldrons</Typography>
      <CardGrid size={'m'}>
        {CAULDRON_INFO.map(({ name, displayName }, index) => {
          const { speed, newBubble, boostReq } = alchemy?.p2w?.cauldrons?.[index] ?? {};
          return <ItemCard key={name} icon={`data/aJarB${index}.png`} title={displayName}>
            {upgradeSection('Speed', speed, CAULDRONS_MAX_LEVELS.cauldronsSpeed, alchemyFailed)}
            {upgradeSection('New bubble chance', newBubble, CAULDRONS_MAX_LEVELS.cauldronsNewBubble, alchemyFailed)}
            {upgradeSection('Boost req', boostReq, CAULDRONS_MAX_LEVELS.cauldronsBoostReq, alchemyFailed)}
          </ItemCard>;
        })}
      </CardGrid>

      {/* The account-wide Pay 2 Win levels, beside the cauldron and liquid ones */}
      <Typography variant={'sectionTitle'} component={'h3'} sx={HEADING_SX}>Player and vials</Typography>
      <CardGrid size={'m'}>
        <ItemCard title={'Player'}>
          <ItemCard.Facts rows={[
            ['Alchemy speed', alchemyFailed ? '-' : formatNum(player?.speedLv ?? 0, 'level')],
            ['Extra EXP', alchemyFailed ? '-' : formatNum(player?.extraExpLv ?? 0, 'level')]
          ]}/>
        </ItemCard>
        <ItemCard title={'Vials'}>
          <ItemCard.Facts rows={[
            ['Attempts', alchemyFailed ? '-' : levelValue(vials?.attempts ?? 0, CAULDRONS_MAX_LEVELS.vialsAttempts)],
            ['RNG', alchemyFailed ? '-' : levelValue(vials?.rng ?? 0, CAULDRONS_MAX_LEVELS.vialsRng)]
          ]}/>
        </ItemCard>
      </CardGrid>
    </>
  );
};

export default Cauldrons;
