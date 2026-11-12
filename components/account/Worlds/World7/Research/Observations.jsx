import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// Game order: research[6] = ["Magnifying_Glass", "Optical_Monocle", "Kaleidoscope"]
const LENSES = {
  0: { src: 'data/ResMagni0.png', name: 'Magnifying Glass' },
  1: { src: 'data/ResMagni1.png', name: 'Optical Monocle' },
  2: { src: 'data/ResMagni2.png', name: 'Kaleidoscope' }
};

// Game indexes color list by insight level (level 1 → index 1, level 6 → index 6 = red); a level past the list keeps its last
const observationLevelColor = (level) => (theme) => {
  const colors = (theme.vars || theme).palette.identity.insightLevels;
  return colors[Math.min(level, colors.length - 1)];
};

const OBSERVATIONS_TOOLBAR = { show: 'all' };
// An observation is active while a lens sits on it
const isActive = (obs) => Boolean(obs?.found) && (obs?.lensTypes ?? []).some((type) => LENSES[type]);

// A rate under 10 keeps Precise's three decimals, so a real rate under 0.5/hr never reads 0
const insightRate = (value) => formatNum(value ?? 0, 'amount', { precise: (value ?? 0) < 10 });

const observationCard = (obs) => {
  const name = cleanUnderscore(obs?.name ?? `Observation ${(obs?.index ?? 0) + 1}`);
  // Decision 8: the insight colors stay the game's own list on the name, the level beside it in words
  const level = obs?.insightLevel ?? 0;
  const lenses = (obs?.lensTypes ?? []).map((type) => LENSES[type]).filter(Boolean);
  // The rates are 0 until a lens sits on the observation, so they show only on the observed ones
  const observed = isActive(obs);
  const showMob = obs?.mapMob && obs.mapMob !== '_' && obs?.mapMobFace !== 0;
  return <ItemCard key={obs?.index} icon={`data/ResObj${obs?.index}.png`}
                   title={level >= 1 ? <Box component={'span'} sx={{ color: observationLevelColor(level) }}>{name}</Box> : name}
                   status={observed ? 'active' : obs?.found ? 'done' : undefined} statusLabel={observed ? 'Active' : 'Found'} dimmed={!obs?.unlocked}>
    {obs?.description ? <ItemCard.Desc text={obs.description}/> : null}
    <ItemCard.Facts rows={[
      ['Research LV needed', formatNum(obs?.researchLvReq ?? 0)],
      ['Insight LV', formatNum(obs?.insightLevel ?? 0)],
      obs?.found ? ['Insight EXP', `${formatGame(obs.insightExp ?? 0, 'Save.ObservationExp')} / ${formatNum(obs.insightExpREQ ?? 0, 'whole')}`] : null,
      observed ? [<React.Fragment key={'displayed'}>
        Displayed insight per hour <InfoButton label={'Displayed insight per hour'}>Insight EXP per hour as the
        game shows it: the insight rate times the Research EXP multi. Insight levels slower than this.</InfoButton>
      </React.Fragment>, insightRate(obs.insightExpRate)] : null,
      observed ? [<React.Fragment key={'real'}>
        Real insight per hour <InfoButton label={'Real insight per hour'}>The Insight EXP you gain per hour: the
        displayed rate over the Research EXP multi. This is how fast Insight levels.</InfoButton>
      </React.Fragment>, insightRate(obs.realInsightExpRate)] : null,
      // The same stat as the Summary's Research EXP rate, so the same rule
      observed ? ['Research EXP rate', `${formatGame(obs.researchEXPrate ?? 0, 'ResearchStuff.ResearchEXPrateTOT')}/hr`] : null,
      lenses.length ? ['Lenses', <Stack key={'lenses'} component={'span'} direction={'row'} gap={1} flexWrap={'wrap'}
                                        justifyContent={'flex-end'}>
        {lenses.map((lens) => <Stack key={lens.src} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
          <GameIcon src={lens.src} size={16} alt={''}/>{lens.name}
        </Stack>)}
      </Stack>] : null,
      obs?.mapName ? ['Map', cleanUnderscore(obs.mapName)] : null,
      showMob ? ['Mob', <Stack key={'mob'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}
                               justifyContent={'flex-end'}>
        {cleanUnderscore(obs.mapMob)}
        {obs?.mapMobFace != null ? <GameIcon src={`data/Mface${obs.mapMobFace}.png`} size={24} alt={''}/> : null}
      </Stack>] : null
    ]}/>
  </ItemCard>;
};

const Observations = ({ observations }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('research-observations', OBSERVATIONS_TOOLBAR);
  const list = observations ?? [];
  const active = list.filter(isActive);
  const notFound = list.filter((obs) => !obs?.found);
  const visible = toolbar?.show === 'active' ? active : toolbar?.show === 'notFound' ? notFound : list;
  return <Box>
    <Toolbar state={toolbar} defaults={OBSERVATIONS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={list.length} shown={visible.length} noun={'observations'}>
      <Toolbar.Show options={[['all', 'All', list.length], ['active', 'Active', active.length], ['notFound', 'Not found', notFound.length]]}/>
    </Toolbar>
    <CardGrid size={'m'}>{visible.map(observationCard)}</CardGrid>
  </Box>;
};

export default Observations;
