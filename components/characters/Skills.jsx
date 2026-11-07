import { capitalize, Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import gameNotation from '../../data/website-data/gameNotation.json';
import { getSkillExpMulti } from '@parsers/character';
import { getSkillEfficiency } from '@parsers/efficiency';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { getMaxDamage } from '@parsers/damage';
import { isGlobalSkill } from '@utility/consts';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';

// The game's SkillStats blocks spell two skills differently from the save
const SKILL_STAT_NAMES = { chopping: 'Choppin' };
const skillStatKey = (skillName, stat) => `SkillStats.${SKILL_STAT_NAMES[skillName] ?? capitalize(skillName)}${stat}`;
// The game's own rule where it prints this skill's number; the parser's text where it doesn't
const skillNumber = (value, key, fallback) => (gameNotation[key] ? formatGame(value, key) : fallback);

// The picked skill's numbers; its two breakdowns open from their values, each headed as its value reads
const SkillDetails = ({ skillName, skill, character, characters, account }) => {
  const { exp, expReq, level, rank } = skill;
  const playerInfo = getMaxDamage(character, characters, account);
  const expMulti = getSkillExpMulti(skillName, character, characters, account, playerInfo);
  const efficiency = getSkillEfficiency(skillName, character, characters, account, playerInfo);
  const multiText = expMulti ? `${skillNumber(expMulti.value, skillStatKey(skillName, 'EXPmulti'), expMulti.formattedValue)}x` : null;
  const efficiencyText = efficiency ? skillNumber(efficiency.value, skillStatKey(skillName, 'Efficiency'), efficiency.formattedValue) : null;
  return <Box sx={{ mt: 1 }}>
    <Panel.KV label={capitalize(skillName)} value={formatNum(level, 'level')}/>
    {!isGlobalSkill(skillName) && rank != null
      ? <Panel.KV label={'Account rank'} value={`${formatNum(rank)} of ${formatNum(characters?.length)}`}/> : null}
    <Box sx={{ py: 0.75 }}>
      <ItemCard.Progress label={'EXP'} value={formatGame(exp, 'Big', { whole: true })} max={formatGame(expReq, 'Big', { whole: true })} percent={Math.min(100, (exp / expReq * 100) || 0)}/>
    </Box>
    {expMulti ? <Panel.KV label={'EXP multi'} value={expMulti.breakdown
      ? <Breakdown asValue title={'EXP multi'} data={{ ...expMulti.breakdown, totalValue: multiText }}>{multiText}</Breakdown> : multiText}/> : null}
    {efficiency ? <Panel.KV label={'Efficiency'} value={efficiency.breakdown
      ? <Breakdown asValue title={'Efficiency'} data={{ ...efficiency.breakdown, totalValue: efficiencyText }}>{efficiencyText}</Breakdown> : efficiencyText}/> : null}
  </Box>;
};

// The parser lists the skills in the game's order, three to a world (World 7 has two so far)
const SKILLS_PER_WORLD = 3;
// Two worlds to a row, a wider gap between them than between their tiles, so each world reads as its own group with no
// label. A world is 3 tiles of 57 px 6 px apart: two and the gap fill the character column's 390 px. Under the width two
// need with tiles at the sheet's 44 px floor, one world to a row.
const WORLD_WIDTH = 183;
const WORLD_GAP = 24;
const TWO_WORLDS_MIN = 2 * (3 * 44 + 2 * 6) + WORLD_GAP;
const WORLDS_SX = {
  display: 'grid', justifyContent: 'center', columnGap: `${WORLD_GAP}px`, rowGap: '6px',
  gridTemplateColumns: `repeat(2, minmax(0, ${WORLD_WIDTH}px))`,
  [`@container (max-width: ${TWO_WORLDS_MIN - 0.05}px)`]: { gridTemplateColumns: `minmax(0, ${WORLD_WIDTH}px)` }
};

// A tile per skill, its level on it and a rank 1 to 3 as its badge, grouped by world; one details block under the grid for
// the picked one, so a tap opens one thing.
const Skills = ({ skills, account, characters, character, showSkillsRankOneOnly }) => {
  const [picked, setPicked] = useState(null);
  const names = Object.keys(skills || {}).filter((skillName) => skillName !== 'character');
  const isShown = (skillName) => !showSkillsRankOneOnly || skills[skillName]?.rank === 1;
  const shown = names.filter(isShown);
  if (showSkillsRankOneOnly && !shown.length) return <Panel title={'Skills'}><Notice>No skill at rank 1 on this character.</Notice></Panel>;
  const pickedName = shown.includes(picked) ? picked : null;
  // Worlds from the full list, so Rank 1 only keeps each skill in its own world
  const worlds = Array.from({ length: Math.ceil(names.length / SKILLS_PER_WORLD) },
    (_, world) => names.slice(world * SKILLS_PER_WORLD, (world + 1) * SKILLS_PER_WORLD).filter(isShown))
    .filter((world) => world.length);

  return <Panel title={'Skills'} meta={showSkillsRankOneOnly ? 'Rank 1 only' : undefined}>
    <Box sx={{ containerType: 'inline-size' }}>
      <Box sx={WORLDS_SX}>
        {worlds.map((world) => <CardGrid key={world[0]} size={'icon'} columns={SKILLS_PER_WORLD} sheetTile={57}>
          {world.map((skillName) => {
            const { level, rank, icon } = skills[skillName];
            // Every rank, as the old page had them: only the top 3 left the rest unread. A skill every character shares
            // has no rank.
            return <IconTile key={skillName} icon={`data/${icon}.png`} alt={capitalize(skillName)} value={formatNum(level, 'whole')}
                             iconSize={40} badge={!isGlobalSkill(skillName) && rank > 0 ? rank : undefined}
                             onSelect={() => setPicked(skillName)} selected={pickedName === skillName}/>;
          })}
        </CardGrid>)}
      </Box>
    </Box>
    {pickedName
      ? <SkillDetails skillName={pickedName} skill={skills[pickedName]} character={character} characters={characters} account={account}/>
      : <Typography color={'text.secondary'} sx={{ mt: 1, fontSize: 13, lineHeight: '18px' }}>Pick a skill to see its EXP and efficiency.</Typography>}
  </Panel>;
};

export default Skills;
