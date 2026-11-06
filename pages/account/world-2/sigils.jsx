import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, formatNum, titleCaseName } from 'utility/helpers';
import { gameBonusText } from '@utility/gameNotation';
import { MissingData, PlayersList, isParseFailed, isSectionFailed } from '@components/common/styles';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { calcSigilsLevels, getAlchemy, getSigilNextCost, getSigilTierUnlocks } from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { sigils as sigilsCatalog } from '@website-data';
import { NextSeo } from 'next-seo';
import Timer from '../../../components/common/Timer';
import { OPT } from '@parsers/accountOptions';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';

// The sections the page reads, in the order the note names the first that failed: the sigils, the parser's own step
// that adds their speed, next costs and charge rates (safeSection 'alchemy.sigilProgression'), the green sigils' TRUE
// DMG (research), what names a sigil's boost (Chilled Yarn, the meritocracy bonus) and the Prisma multi's sources
const SECTION_NAMES = {
  alchemy: 'Sigils', 'alchemy.sigilProgression': 'Sigil charging', research: 'Research', sailing: 'Sailing',
  voteBallot: 'the Vote Ballot', tesseract: 'the Tesseract', arcade: 'the Arcade', sushiStation: 'Sushi Station',
  jellyOperator: 'Jelly Operator', looty: 'the Slab', gaming: 'Gaming', farming: 'Farming',
  legendTalents: 'Legend Talents', companions: 'Companions', sneaking: 'Sneaking', spelunking: 'Spelunking'
};
const PRISMA_SECTIONS = ['alchemy', 'tesseract', 'arcade', 'sushiStation', 'jellyOperator', 'looty', 'gaming', 'farming',
  'legendTalents', 'companions'];
const BOOST_SECTIONS = ['sailing', 'voteBallot'];
// getSigilTierUnlocks: Jade, Ethereal and Eclectic. With one unknown, a sigil at that gate can't be called maxed.
const TIER_GATE_SECTIONS = ['sneaking', 'spelunking', 'research'];
const UNDISCOVERED = -1;
// The game caps the Prisma multi at x5 (PrismaBonusMult's Math.min(5, ...), the parser's MAX_PRISMA_MULTI)
const PRISMA_CAP = 5;

// The game tints a sigil's art by its tier (createHueFilter on the sigil screen); undiscovered is dimmed
const TIER_HUES = { 1: 202, 2: 150, 3: 80, 4: 260 };
const TIER_WORDS = { [UNDISCOVERED]: 'Undiscovered', 0: 'Unlocked', 1: 'Boosted', 2: 'Jade', 3: 'Ethereal', 4: 'Eclectic' };
// The catalog's bonus for each tier, before Chilled Yarn and the meritocracy bonus
const TIER_BONUS = { 0: 'unlockBonus', 1: 'boostBonus', 2: 'jadeBonus', 3: 'etherealBonus', 4: 'eclecticBonus' };

// The game draws the progress in CommaNotation, an undiscovered sigil's under 10 to two decimals (floored). No
// gameNotation key holds it, so the fill is copied.
const sigilProgress = (progress, unlocked) => (unlocked === UNDISCOVERED && progress < 10
  ? String(Math.floor(100 * progress) / 100)
  : commaNotation(progress));

const ready = <StatusText status={'ready'}>Ready to level up</StatusText>;

// A sigil: its tier in words beside the game's tint, its bonus, and the progress toward its next tier. timeLeft counts
// from the save, so the countdown ends at the save's time plus it, and a time that ran out since then shows Ready, not a
// countdown that would be false (one label for both). A failed section's catalog has the name and art only. A failed
// charging step (alchemy.sigilProgression) loses only the charge rate: the next tier's cost is the catalog's, read with
// the parser's own tier gates, so Maxed, Ready and the progress pair stay, and the countdown reads "-"
const sigilCard = (sigil, { failed, progressionFailed, tierGatesFailed, tierUnlocks, characters, lastUpdated, boostSources }) => {
  const { name, index, progress = 0, effect, unlocked = UNDISCOVERED, chargeRate, bonus = 0 } = sigil;
  const icon = <Box component={'span'}
                    sx={{ display: 'inline-flex', filter: failed || !TIER_HUES[unlocked] ? undefined : `hue-rotate(${TIER_HUES[unlocked]}deg)` }}>
    <GameIcon src={`data/aSiga${index}.png`} size={40} alt={''}/>
  </Box>;
  if (failed) return <ItemCard key={name} icon={icon} title={titleCaseName(cleanUnderscore(name))}/>;
  const nextCost = progressionFailed ? getSigilNextCost(sigil, tierUnlocks) : sigil?.nextCost;
  const charging = sigil?.characters ?? [];
  const gateUnknown = tierGatesFailed && nextCost == null;
  const maxed = nextCost == null && !gateUnknown;
  const isReady = !maxed && progress >= nextCost;
  const timeLeft = (nextCost - progress) / chargeRate * 3600 * 1000;
  const base = sigilsCatalog?.[index]?.[TIER_BONUS[unlocked]];
  const boost = base > 0 ? bonus / base : 1;
  const nextRow = isReady ? ['Next tier', ready]
    : progressionFailed ? ['Next tier', '-']
    : Number.isFinite(timeLeft) && Number.isFinite(lastUpdated)
      ? ['Next tier', <Timer key={'timer'} type={'countdown'} component={'span'} date={lastUpdated + timeLeft}
                                placeholder={ready}/>]
      : null;
  return <ItemCard key={name} icon={icon} title={titleCaseName(cleanUnderscore(name))} meta={TIER_WORDS[unlocked]}
                   dimmed={unlocked === UNDISCOVERED} status={maxed ? 'maxed' : charging.length ? 'active' : undefined}
                   statusLabel={maxed ? undefined : 'Charging'}
                   footer={maxed ? null : gateUnknown ? <ItemCard.Facts rows={[['Next tier', '-']]}/> : <ItemCard.Facts rows={[
                     ['Progress', `${sigilProgress(progress, unlocked)} / ${commaNotation(nextCost)}`],
                     nextRow
                   ]}/>}>
    <ItemCard.Desc text={unlocked === UNDISCOVERED ? 'Discover it to see its bonus.'
      : cleanUnderscore((effect ?? '').replace(/{/g, gameBonusText(bonus)))}/>
    {unlocked !== UNDISCOVERED && boost > 1 ? <Typography variant={'body2'} color={'text.secondary'}>
      {`${formatNum(boost, 'mult')} from ${boostSources}`}</Typography> : null}
    {/* In the body, not beside the title: four class icons and the status left the title a word a line. A maxed
        sigil keeps them, since the characters still sit there. */}
    {charging.length ? <ItemCard.Facts rows={[
      ['Characters', <PlayersList key={'players'} players={charging} characters={characters}/>]
    ]}/> : null}
  </ItemCard>;
};

const Sigils = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const failedIn = (sections) => sections.find((section) => isSectionFailed(account, section));
  const failedSection = failedIn(Object.keys(SECTION_NAMES));
  const alchemyFailed = isSectionFailed(account, 'alchemy');
  const progressionFailed = alchemyFailed || isSectionFailed(account, 'alchemy.sigilProgression');
  const researchFailed = isSectionFailed(account, 'research');
  const prismaFailed = Boolean(failedIn(PRISMA_SECTIONS));
  // A failed section's {} default: the sigils by name, the parser's own catalog with no save
  const sigils = (alchemyFailed ? getAlchemy({}, [], {})?.p2w?.sigils : account?.alchemy?.p2w?.sigils) ?? [];
  const { sigilSpeed, totalEtherealSigils: etherealSigils = 0, totalEclecticSigils: eclecticSigils = 0 } = account?.alchemy?.p2w ?? {};
  const prismaCapped = !prismaFailed && (getPrismaMulti(account)?.value ?? 0) >= PRISMA_CAP;
  const research = account?.research;
  const speedText = progressionFailed ? '-' : sigilSpeed?.display ?? '-';
  // The boost's sources by name: both when one of them could not be read
  const yarn = Boolean(isArtifactAcquired(account?.sailing?.artifacts, 'Chilled_Yarn'));
  const merit = getMeritocracyBonus(account, 21) > 0;
  const boostSources = !failedIn(BOOST_SECTIONS) && yarn !== merit
    ? yarn ? 'Chilled Yarn' : 'the meritocracy bonus'
    : 'Chilled Yarn and the meritocracy bonus';
  const cardContext = {
    failed: alchemyFailed, progressionFailed, tierGatesFailed: Boolean(failedIn(TIER_GATE_SECTIONS)), characters: state?.characters, lastUpdated: state?.lastUpdated,
    boostSources, tierUnlocks: progressionFailed && !alchemyFailed ? getSigilTierUnlocks(account) : null
  };

  return <>
    <NextSeo
      title="Sigils | Idleon Toolbox"
      description="View your sigil levels, unlock progress, and bonus effects for alchemy in Legends of Idleon"
    />
    {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed atZero={alchemyFailed}/> : null}
    <PageSummary>
      <StatTile label={'Sigil speed'} value={speedText}
                breakdown={!progressionFailed && sigilSpeed?.breakdown ? { ...sigilSpeed.breakdown, totalValue: speedText } : undefined}
                breakdownTitle={'Sigil speed'}/>
      <StatTile label={'Sigil syrup'} icon={'data/SigilSyrup.png'}
                value={formatNum(account?.accountOptions?.[OPT.sigilSyrup] ?? 0)} failed={isParseFailed(account)}/>
      <StatTile label={'Total sigil levels'} value={alchemyFailed ? '-' : formatNum(calcSigilsLevels(sigils))}/>
      <StatTile label={'Prisma from sigils'}
                value={alchemyFailed ? '-' : formatNum(0.2 * etherealSigils, 'pct', { signed: true })}
                sub={alchemyFailed ? undefined : `${formatNum(etherealSigils)} ethereal sigils`}
                info={prismaCapped ? 'Your Prisma multi is already at its x5 cap, so this adds nothing now.' : undefined}/>
      {research?.greenSigilsUnlocked || researchFailed
        ? <StatTile label={'TRUE DMG multi'}
                    value={researchFailed || alchemyFailed ? '-' : formatNum(research?.greenSigilTrueDMG ?? 1, 'mult')}
                    sub={researchFailed || alchemyFailed ? undefined : `${formatNum(eclecticSigils)} eclectic sigils`}
                    info={'The game never reads this bonus in its damage formula: a game bug.'}/>
        : null}
    </PageSummary>
    <CardGrid size={'m'}>
      {sigils.map((sigil) => sigilCard(sigil, cardContext))}
    </CardGrid>
  </>;
};

export default Sigils;
