import { Stack, Typography } from '@mui/material';
import { formatDuration, formatNum, getBitIndex, getCoinsArray, notateNumber } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import React from 'react';
import CoinDisplay from '@components/common/CoinDisplay';
import StatTile from '@components/common/cards/StatTile';
import StatusText from '@components/common/StatusText';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

// A method's cost: its sprite and the name a screen reader hears (the parser's wellSediment 3, 14 and 25, named as
// holeResourceName names them)
const BELL_COSTS = {
  sediments: ['data/HoleWellFill4.png', 'Sediment 4'],
  notes: ['data/HoleHarpNote4.png', 'Harp note 5'],
  particles: ['etc/Particle.png', 'Particles'],
  rupie: ['data/HoleJarR5.png', 'Rupie tier 6']
};

const BellMethodCost = ({ costType, cost, owned }) => {
  if (costType === 'money') return <CoinDisplay title={''} noShadow money={getCoinsArray(cost)}/>;
  if (costType === 'bits') {
    // The game's bits notation (phase 6: one NotateNumber)
    return <ItemCard.Cost icon={`etc/Bits_${getBitIndex(cost)}.png`} iconAlt={'Bits'} need={cost} have={owned}
                          format={(value) => notateNumber(value, 'bits')}/>;
  }
  const [icon, name] = BELL_COSTS[costType] ?? ['afk_targets/Nothing.png', ''];
  return <ItemCard.Cost icon={icon} iconAlt={name} need={cost ?? 0} have={owned}/>;
};

const TheBell = ({ hole }) => {
  const theBell = hole?.caverns?.theBell;
  const bells = theBell?.bells ?? [];
  const methods = theBell?.improvementMethods ?? [];
  const ringBonuses = theBell?.bellBonuses ?? [];
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'New method chance'} value={(theBell?.newMethodChance ?? 0) * 100} kind={'pct'}/>
      <StatTile label={'Rings'} value={theBell?.rings ?? 0} kind={'amount'}
                info={'The 20th-ring bonus from its study triggers on rings 19, 39, 59 and 79, then every 20 rings.'}/>
      {opalsFoundTile(hole, 4)}
    </Stack>
    <Stack gap={3}>
      {bells.length ? <Stack gap={1}>
        <Typography variant={'sectionTitle'} component={'h2'}>Bells</Typography>
        <CardGrid size={'m'}>
          {bells.map(({ name, expRate, expReq, exp, readyUses }, index) => {
            const rate = expRate?.value ?? 0;
            const title = `${name?.charAt(0)?.toUpperCase() ?? ''}${name?.slice(1) ?? ''}`;
            // The game's "N/hr" (Holes.BellExpPerHR), the drawer named and headed the same
            const rateText = `${formatGame(rate, 'Holes.BellExpPerHR')}/hr`;
            const secondsToFull = rate > 0 ? ((expReq ?? 0) - (exp ?? 0)) / rate * 3600 : null;
            // Decision 5 (b): the bell's word art stays beside its name in words
            return <ItemCard key={`bell-${index}`} title={title}
                             icon={<GameIcon src={`data/HoleBellAction${index}.png`} size={56} alt={''}/>}>
              <ItemCard.Facts rows={[
                ['EXP rate', expRate?.breakdown
                  ? <Breakdown key={'rate'} asValue data={{ ...expRate.breakdown, totalValue: rateText }}
                               title={`${title} EXP rate`}>{rateText}</Breakdown>
                  : rateText],
                ['EXP', `${formatGame(exp ?? 0, 'Holes.BellEXPreq')} / ${formatGame(expReq ?? 0, 'Holes.BellEXPreq')}`],
                ['Time to full', secondsToFull === null ? '-' : secondsToFull > 0 ? formatDuration(secondsToFull)
                  : <StatusText key={'ready'} status={'ready'}>{readyUses > 1 ? `Ready (x${formatNum(readyUses)})` : 'Ready'}</StatusText>]
              ]}/>
            </ItemCard>;
          })}
        </CardGrid>
      </Stack> : null}
      {methods.length ? <Stack gap={1}>
        <Typography variant={'sectionTitle'} component={'h2'}>Improvement methods</Typography>
        <CardGrid size={'m'}>
          {methods.map(({ description, level, bonus, cost, costType, owned }, index) => {
            const found = index < (theBell?.bellMethodsOwned ?? 0);
            return <ItemCard key={`method-${index}`} level={{ value: level ?? 0 }} status={found ? undefined : 'locked'}
                             footer={found ? <BellMethodCost costType={costType} cost={cost} owned={owned}/> : null}>
              <ItemCard.Desc text={(description ?? '').replace('{', formatGame(bonus ?? 0, 'Holes.BellMethodsQTY'))}/>
            </ItemCard>;
          })}
        </CardGrid>
      </Stack> : null}
      {ringBonuses.length ? <Stack gap={1}>
        <Typography variant={'sectionTitle'} component={'h2'}>Ring bonuses</Typography>
        <CardGrid size={'m'}>
          {ringBonuses.map(({ description, bonus, level }, index) =>
            <ItemCard key={`bell-bonus-${index}`} dimmed={!(level > 0)} level={{ value: level ?? 0 }}>
              <ItemCard.Desc text={(description ?? '').replace('{', formatGame(bonus ?? 0, 'Holes.BellBonuss')).replace('|', ' ')}/>
            </ItemCard>)}
        </CardGrid>
      </Stack> : null}
    </Stack>
  </>;
};

export default TheBell;
