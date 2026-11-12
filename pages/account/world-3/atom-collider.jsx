import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { calcTotals } from '@parsers/world-3/printer';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { atomsInfo } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { Duration } from '@components/common/Num';
import StatusText from '@components/common/StatusText';
import { createBreakdown, flat } from '@parsers/breakdown';

// The game's AtomInfo draw (N.js, the atom panel): every { is the level times its base, rounded; } and > the atom's
// bonus in Big (the parser's bonus is already Fluoride's percent); < the level in Big; atom 11's cap is
// 60 + Minehead's bonus 16 days. The "Total bonus" part sits on its own line.
const atomLines = ({ desc, baseBonus, level, bonus }, index, account) => {
  const days = Math.round(60 + (getMineheadBonusQTY(account, 16) ?? 0));
  const filled = (desc ?? '')
    .replace(/{/g, String(Math.round((baseBonus ?? 0) * (level ?? 0))))
    .replace(/[}>]/g, formatGame(bonus ?? 0, 'Big'))
    .replace(/</g, formatGame(Math.max(0, level ?? 0), 'Big'));
  const text = cleanUnderscore(index === 11 ? filled.replace('60_days', `${days}_days`) : filled);
  const split = text.search(/Total bonus/i);
  return split > 0 ? [text.slice(0, split).trim(), text.slice(split).trim()] : [text];
};

// A failed atoms section has no levels or costs: its catalog at zero, names and sentences only
const catalogAtZero = () => (atomsInfo ?? []).map((info, index) => ({ ...info, rawName: `Atom${index}`, level: 0, bonus: 0 }));

const AtomCollider = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'atoms');
  const printerFailed = isSectionFailed(state?.account, 'printer');
  const { atoms: parsedAtoms = [], particles = 0, stampReducer = 0, totalAtomsAvailable, unlockSources = [], costCut,
    maxLevelBreakdown } = state?.account?.atoms ?? {};
  const atoms = sectionFailed && !parsedAtoms.length ? catalogAtZero() : parsedAtoms;
  const atomsPerHour = calcTotals(state?.account)?.atom?.atoms ?? 0;
  const unlockedText = `${formatNum(totalAtomsAvailable ?? atoms.length)} / ${formatNum(atoms.length)}`;
  const owned = Math.floor(particles);

  return <>
    <NextSeo
      title="Atom Collider | Idleon Toolbox"
      description="Track your Atom Collider upgrade levels, stamp bonuses, and particle costs in Legends of Idleon"
    />
    {sectionFailed ? <MissingData name={'Atom Collider'} failed atZero/> : printerFailed ? <MissingData name={'Printer'} failed/> : null}
    <PageSummary>
      {/* Every atom cost prints in this rule (AtomCollider.AtomCost), so the balance does too */}
      <StatTile label={'Particles'} icon={'etc/Particle.png'}
                value={sectionFailed ? '-' : formatGame(owned, 'AtomCollider.AtomCost', { whole: true })}/>
      {/* The income the "Next level in" times read: the printer's particle-making samples */}
      <StatTile label={'Particles per hour'} icon={'etc/Particle.png'}
                value={printerFailed ? '-' : formatNum(atomsPerHour, 'amount', { precise: true })}
                sub={printerFailed ? undefined : `${formatNum(atomsPerHour * 24, 'amount', { precise: true })} per day`}/>
      <StatTile label={'Stamp reducer'} icon={'data/Atom0.png'} value={sectionFailed ? '-' : formatNum(stampReducer, 'pct')}/>
      {sectionFailed ? null : <>
        {/* A sum like the max level beside it: 11, then one per unlock source */}
        <StatTile label={'Atoms unlocked'} value={unlockedText}
                  breakdown={createBreakdown('Atoms unlocked', unlockedText, [
                    flat('Base', 11),
                    ...unlockSources.map(({ name, unlocked }) => flat(name, unlocked ? 1 : 0, unlocked ? undefined : { note: 'Locked' }))
                  ], { combine: 'sum' })}
                  breakdownTitle={'Atoms unlocked'}/>
        {/* Every atom's price is divided by 1 + these cuts */}
        <StatTile label={'Atom cost cut'} value={formatNum((1 - (costCut?.multi ?? 1)) * 100, 'pct', { signed: false })}
                  breakdown={costCut?.breakdown ? { ...costCut.breakdown, totalValue: `÷${formatNum(1 + (costCut?.sum ?? 0) / 100, 'amount', { precise: true })}` } : undefined}
                  breakdownTitle={'Atom cost cut'}/>
        <StatTile label={'Atom max level'} value={formatNum(maxLevelBreakdown?.totalValue ?? 20)}
                  breakdown={maxLevelBreakdown} breakdownTitle={'Atom max level'}/>
      </>}
    </PageSummary>
    <CardGrid size={'m'}>
      {atoms.map((atom, index) => {
        const { name, rawName, level = 0, maxLevel, cost, nextLeveCost, costToMax, locked } = atom;
        // An atom past the account's unlocked count can't be levelled: no price
        const priced = !locked && maxLevel != null && level < maxLevel && cost != null;
        return <ItemCard key={rawName} icon={`data/${rawName}.png`} title={cleanUnderscore(name)}
                         level={{ value: level, max: maxLevel }}
                         dimmed={locked}
                         titleState={locked ? <StatusText status={'info'}>Locked</StatusText> : undefined}
                         status={!locked && maxLevel != null && level >= maxLevel ? 'maxed' : undefined}
                         footer={priced ? <ItemCard.Cost icon={'etc/Particle.png'} iconAlt={'Particles'} need={cost}
                                                         have={owned} game={'AtomCollider.AtomCost'}/> : null}>
          <ItemCard.Desc text={atomLines(atom, index, state?.account)}/>
          {priced ? <ItemCard.Facts rows={[
            ['Level after next', formatGame(nextLeveCost, 'AtomCollider.AtomCost', { whole: true })],
            ['Cost to max', formatGame(costToMax, 'AtomCollider.AtomCost', { whole: true })],
            // The printer makes the atoms: a failed printer section leaves the wait unknown
            cost > particles && (printerFailed || atomsPerHour > 0)
              ? ['Next level in', printerFailed ? '-' : <Duration key={'next'} seconds={(cost - particles) / atomsPerHour * 3600}/>]
              : null
          ]}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default AtomCollider;
