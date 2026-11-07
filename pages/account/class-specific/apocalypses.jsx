import React, { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { CLASSES, talentPagesMap } from '@parsers/talents';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// Every Barbarian and Blood Berserker by default, the old first-visit pick. A pick saved before (apocalypseCharacters)
// is not read: it resets once.
const APOCALYPSES_TOOLBAR = { show: 'maniacs', superChow: false };
// The three apocalypses, their kill thresholds (the parser's getBarbarianZowChow) and the rule their Panel names
const APOCALYPSES = [
  { key: 'zow', name: 'Zow', thresholds: [1e5], rule: '100K kills each' },
  { key: 'chow', name: 'Chow', thresholds: [1e6, 1e8], rule: '1M kills for Chow, 100M for Super Chow' },
  { key: 'wow', name: 'Wow', thresholds: [1e9], rule: '1B kills each' }
];
const TIER_NAMES = { chow: ['Chow', 'Super Chow'] };

const isManiac = (character) => ['Barbarian', 'Blood_Berserker'].some((name) => talentPagesMap[character?.class]?.includes(CLASSES[name]));

// What the next tier of one monster needs, in words
const nextTier = ({ key, name, thresholds }, kills, done) => {
  const tier = (done ?? []).findIndex((reached) => !reached);
  if (tier < 0) return null;
  return `${formatNum(Math.max(0, thresholds[tier] - kills), 'whole')} more for ${TIER_NAMES[key]?.[tier] ?? name}`;
};

// One apocalypse of one character: its monsters left as tiles, the done count and the rule in the meta
const apocalypsePanel = (character, apocalypse, hideSuperChow) => {
  const monsters = character?.[apocalypse.key];
  const finished = monsters?.finished ?? [];
  const list = monsters?.list ?? [];
  const allDone = monsters ? list.every(({ done }) => done?.every(Boolean)) : false;
  const left = list.filter(({ done, kills }) => !done?.every(Boolean) && !(hideSuperChow && apocalypse.key === 'chow' && kills > 1e6));
  const doneText = apocalypse.key === 'chow'
    ? `${formatNum(finished[0] ?? 0)} Chow, ${formatNum(finished[1] ?? 0)} Super Chow done`
    : `${formatNum(finished[0] ?? 0)} done`;
  return <Panel key={apocalypse.key} title={`${cleanUnderscore(character?.name)}: ${apocalypse.name}`} meta={`${doneText} · ${apocalypse.rule}`}
                aside={allDone ? <StatusText status={'done'}>Done</StatusText> : null}>
    {!monsters ? <Box sx={{ p: 2 }}>
      <Notice tone={'locked'}>{`${apocalypse.name} is still locked for ${cleanUnderscore(character?.name)}.`}</Notice>
    </Box> : left.length ? <Box sx={{ p: 2 }}>
      <CardGrid size={'icon'} fill>
        {left.map(({ mapName, name, monsterFace, kills, done }, index) => {
          // A kill counts once it is whole: the tile, its details and the next tier all read the floor
          const shownKills = Math.floor(kills ?? 0);
          const next = nextTier(apocalypse, shownKills, done);
          return <IconTile
            key={`${name}-${index}`} icon={`data/Mface${monsterFace}.png`} alt={cleanUnderscore(name ?? '')} value={formatNum(shownKills, 'whole')}
            details={<Stack gap={0.5}>
              <Typography variant={'body2'}>{`${cleanUnderscore(name ?? '')}, ${cleanUnderscore(mapName ?? '')}`}</Typography>
              <Typography variant={'body2'}>{`${formatNum(shownKills, 'exact')} kills`}</Typography>
              {next ? <Typography variant={'body2'}>{next}</Typography> : null}
            </Stack>}/>;
        })}
      </CardGrid>
    </Box> : null}
  </Panel>;
};

const Apocalypses = () => {
  const { state } = useContext(AppContext);
  const [view, setView, resetView] = useToolbarState('apocalypses', APOCALYPSES_TOOLBAR);
  const characters = state?.characters ?? [];
  const maniacs = characters.filter(isManiac);
  const shownCharacters = view?.show === 'all' ? characters : view?.show === 'maniacs' ? maniacs
    : characters.filter((character) => `${character?.playerId}` === view?.show);

  return (
    <>
      <NextSeo
        title="Apocalypses | Idleon Toolbox"
        description="Dedicated to the barbarian/blood berserker class to keep track of Zow and Chow talents"
      />
      {!characters.length
        ? <Notice tone={'signin'}>Each Barbarian&apos;s Zow, Chow and Wow progress shows here once you sign in.</Notice>
        : <Stack gap={3}>
          <Toolbar state={view} defaults={APOCALYPSES_TOOLBAR} onChange={setView} onReset={resetView}
                   total={characters.length} shown={shownCharacters.length} noun={'characters'}>
            <Toolbar.Show options={[['maniacs', 'Barbarians', maniacs.length], ['all', 'All characters', characters.length],
              ...characters.map((character) => [`${character?.playerId}`, cleanUnderscore(character?.name)])]}/>
            <Toolbar.Filter name={'superChow'} label={'Hide super chow'}/>
          </Toolbar>
          <Typography variant={'body2'} color={'text.secondary'}>
            Each apocalypse lists the monsters a character still has to kill for it, with the kills so far.
          </Typography>
          {view?.show === 'maniacs' && !maniacs.length
            ? <Notice>No Barbarian or Blood Berserker on this account: pick a character in Show.</Notice>
            : null}
          {shownCharacters.map((character) => <Stack key={character?.playerId} gap={2}>
            {APOCALYPSES.map((apocalypse) => apocalypsePanel(character, apocalypse, view?.superChow))}
          </Stack>)}
        </Stack>}
    </>
  );
};

export default Apocalypses;
