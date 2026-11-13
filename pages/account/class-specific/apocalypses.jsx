import React, { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { CLASSES, getApocalypseCount, getBestActiveCharacter, getHighestTalentAcrossCharacters, getLastBloodBerserkerLine, getTalentBonus, getVoidWalkerTalentEnhancements,
  talentPagesMap } from '@parsers/talents';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

// Every Barbarian and Blood Berserker by default, the old first-visit pick. A pick saved before (apocalypseCharacters)
// is not read: it resets once.
const APOCALYPSES_TOOLBAR = { show: 'maniacs', superChow: false };
// The three apocalypses, their kill thresholds (the parser's getBarbarianZowChow) and the rule their Panel names
// talent: the one whose second number caps the count (game CalcTalentMAP[110]/[146]). Super Chow and Wow count only on the
// account's last Blood Berserker-line character (CalcTalentDT1), so the others' Chow stops at its first tier
const APOCALYPSES = [
  { key: 'zow', name: 'Zow', thresholds: [1e5], rule: '100K kills each', talent: 'APOCALYPSE_ZOW' },
  { key: 'chow', name: 'Chow', thresholds: [1e6, 1e8], rule: '1M kills for Chow, 100M for Super Chow', talent: 'APOCALYPSE_CHOW' },
  { key: 'wow', name: 'Wow', thresholds: [1e9], rule: '1B kills each, for the whole account', accountWide: true }
];
const TIER_NAMES = { chow: ['Chow', 'Super Chow'] };

const isManiac = (character) => ['Barbarian', 'Blood_Berserker'].some((name) => talentPagesMap[character?.class]?.includes(CLASSES[name]));

// What the next tier of one monster needs, in words
const nextTier = ({ key, name, thresholds }, kills, done) => {
  const tier = (done ?? []).findIndex((reached) => !reached);
  if (tier < 0) return null;
  return `${formatNum(Math.max(0, thresholds[tier] - kills), 'whole')} more for ${TIER_NAMES[key]?.[tier] ?? name}`;
};

// One apocalypse of one character: its monsters left as tiles, the done count (with the talent's cap) and the rule in the
// meta. countsAccount: the character whose Super Chow and Wow the game counts
const apocalypsePanel = (character, apocalypse, hideSuperChow, countsAccount) => {
  const monsters = character?.[apocalypse.key];
  const finished = monsters?.finished ?? [];
  const tiers = apocalypse.key === 'chow' && !countsAccount ? 1 : apocalypse.thresholds.length;
  const reached = (done) => (done ?? []).slice(0, tiers).every(Boolean);
  const list = monsters?.list ?? [];
  const allDone = monsters ? list.every(({ done }) => reached(done)) : false;
  // A boss map spawns no monsters so it can't be farmed (it still counts once reached); a side map stays off until it
  // has a kill
  const left = list.filter(({ done, kills, sideMap, bossMap }) => !reached(done) && !bossMap
    && !(sideMap && !(kills >= 1))
    && !(hideSuperChow && apocalypse.key === 'chow' && kills > 1e6));
  // game: the talent counts at most its level in monster types, and its screen says "(Capped)" past that
  const cap = apocalypse.talent ? getTalentBonus(character?.flatTalents, apocalypse.talent, true) : 0;
  const capText = cap > 0 && (finished[0] ?? 0) > cap ? ` (capped at ${formatNum(cap)} by the talent level)` : '';
  const doneText = apocalypse.key === 'chow' && countsAccount
    ? `${formatNum(finished[0] ?? 0)} Chow${capText}, ${formatNum(finished[1] ?? 0)} Super Chow done`
    : `${formatNum(finished[0] ?? 0)} done${capText}`;
  const rule = apocalypse.key === 'chow' && !countsAccount ? '1M kills each' : apocalypse.rule;
  return <Panel key={apocalypse.key} title={`${cleanUnderscore(character?.name)}: ${apocalypse.name}`} meta={`${doneText} · ${rule}`}
                aside={allDone ? <StatusText status={'done'}>Done</StatusText> : null}>
    {left.length ? <Box sx={{ p: 2 }}>
      <CardGrid size={'icon'} fill>
        {left.map(({ mapName, name, monsterFace, kills, done }, index) => {
          // A kill counts once it is whole: the tile, its details and the next tier all read the floor
          const shownKills = Math.floor(kills ?? 0);
          const next = nextTier(apocalypse, shownKills, done?.slice(0, tiers));
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
  // game CalcTalentDT1: the last Blood Berserker-line character's kills count Super Chow and Wow for everyone
  const counter = getLastBloodBerserkerLine(characters);
  const superChows = counter?.chow?.finished?.[1] ?? 0;
  const wows = counter?.wow?.finished?.[0] ?? 0;
  const counterName = cleanUnderscore(counter?.name ?? '');
  // Zow and Chow are each character's own; the summary reads the Barbarian whose Super Chow and Wow count. game
  // TalentCalc(110/146): the talent's first number per monster type counted, capped at its level
  const zows = getApocalypseCount(counter, 'zow');
  const chows = getApocalypseCount(counter, 'chow');
  const zowBonus = getTalentBonus(counter?.flatTalents, 'APOCALYPSE_ZOW') * zows;
  const chowBonus = getTalentBonus(counter?.flatTalents, 'APOCALYPSE_CHOW') * chows;
  // game TalENHNC[146]: Super Chow's 1.1x per monster on Chow only once Enhancement Eclipse reaches 125 (0 before)
  const eclipse = getHighestTalentAcrossCharacters(characters, 'ENHANCEMENT_ECLIPSE', getBestActiveCharacter(characters));
  const chowMulti = getVoidWalkerTalentEnhancements(characters, state?.account, eclipse, 146);

  return (
    <>
      <NextSeo
        title="Apocalypses | Idleon Toolbox"
        description="Track each Barbarian and Blood Berserker's Zow, Chow, Super Chow and Wow kills, monster by monster"
      />
      {!characters.length
        ? <Notice tone={'signin'}>Each Barbarian&apos;s Zow, Chow and Wow progress shows here once you sign in.</Notice>
        : <>
          {/* The summary keeps its own space under it, as on every page */}
          {counter ? <PageSummary>
            <StatTile label={'Zow'} icon={'data/UISkillIcon110.png'} value={formatNum(zows)} sub={`+${formatNum(zowBonus)}% damage`}
                      info={`Monster types with 100K kills on ${counterName}, up to the talent's level.`}/>
            <StatTile label={'Chow'} icon={'data/UISkillIcon146.png'} value={formatNum(chows)} sub={`+${formatNum(chowBonus)}% cooking`}
                      info={`Monster types with 1M kills on ${counterName}, up to the talent's level. Its bonus is to cooking EXP and efficiency.`}/>
            <StatTile label={'Super Chow'} icon={'data/UISkillIcon146.png'} value={formatNum(superChows)}
                      sub={chowMulti > 0 ? `Chow bonus ${formatNum(chowMulti, 'mult')}` : 'Needs Enhancement Eclipse 125'}
                      info={`Monsters with 100M kills on ${counterName}, the account's last Blood Berserker. Once Enhancement Eclipse reaches 125, each one makes Chow's bonus 1.1x higher.`}/>
            <StatTile label={'Wow'} icon={'data/UISkillIcon209.png'} value={formatNum(wows)}
                      sub={`Counted on ${counterName}`}
                      info={`Monsters with 1B kills on ${counterName}, the account's last Blood Berserker. Its Gold Food bonus works for every character.`}/>
          </PageSummary> : null}
          <Stack gap={3}>
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
            {APOCALYPSES.filter((apocalypse) => !apocalypse.accountWide || character === counter)
              .map((apocalypse) => apocalypsePanel(character, apocalypse, view?.superChow, character === counter))}
          </Stack>)}
          </Stack>
        </>}
    </>
  );
};

export default Apocalypses;
