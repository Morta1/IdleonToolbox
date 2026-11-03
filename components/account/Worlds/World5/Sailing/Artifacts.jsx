import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { ARTIFACT_TIERS as TIERS, artifactTierColor } from './sailing.consts';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { gameTables } from '@website-data';

const getTierDescription = (artifact, tier) => {
  switch (tier) {
    case 1: return artifact.description;
    case 2: return artifact.ancientFormDescription;
    case 3: return artifact.eldritchFormDescription;
    case 4: return artifact.sovereignFormDescription;
    case 5: return artifact.omnipotentFormDescription;
    case 6: return artifact.transcendentFormDescription;
    case 7: return artifact.verisimilitudeFormDescription ?? '';
    default: return '';
  }
};

// The game tints a tier 7 (Verisimilitude) artifact with createHueFilter(160) (_customEvent_Sailing)
const artifactIcon = (rawName, tier) => tier === 7
  ? <Box component={'span'} sx={{ display: 'inline-flex', filter: 'hue-rotate(160deg)' }}>
    <GameIcon src={`data/${rawName}.png`} size={40} alt={''}/>
  </Box>
  : `data/${rawName}.png`;

// The parser drops the game's line break before the total (sailing.ts), so the card puts it back
const withTotalLine = (text) => cleanUnderscore(text ?? '').replace(/\s*(Total bonus)/i, ' @ $1');
// The game fills Deathskull's $ with its form's line (gameTables.artifactFormText); the parser leaves it for an artifact
// with no form yet (an empty save), so the card fills it the game's way
const FORM_TEXT = gameTables?.artifactFormText;
const filledDescription = ({ description, rawName }, tier) => (rawName === `Arti${FORM_TEXT?.artifact}` && description?.includes('$')
  ? description.replace('$', FORM_TEXT?.forms?.[Math.round(tier)] ?? '')
  : description);

const tierName = (tier) => <Box component={'span'} sx={{ color: artifactTierColor(tier) }}>{TIERS[tier - 1]?.full}</Box>;

// Info 5: Crystal Steak's and Socrates' per-character tables, a list in a hover note before
const PER_CHARACTER = {
  Crystal_Steak: ['Total damage per character', ({ bonus }) => ({ value: bonus, formatted: formatNum(bonus ?? 0, 'pct') })],
  Socrates: ['All stats per character', ({ strength, agility, wisdom, luck }) => ({
    value: strength,
    formatted: [strength, agility, wisdom, luck].map((stat) => formatNum(stat ?? 0)).join(' / ')
  })]
};

const perCharacter = (name, additionalData, tier) => {
  const [title, line] = PER_CHARACTER[name] ?? [];
  if (!title || !tier || !Array.isArray(additionalData) || !additionalData.length) return null;
  const count = `${formatNum(additionalData.length)} ${additionalData.length === 1 ? 'character' : 'characters'}`;
  const data = createBreakdown(title, count, flatLines(additionalData.map((row) => ({ name: row?.name, ...line(row) }))),
    { combine: 'list' });
  return [title, <Breakdown key={'per-character'} asValue data={data} countNoun={'characters'}>{count}</Breakdown>];
};

// The seven forms as the game's track: a picture, its meaning in the card's meta line
const TierTrack = ({ currentTier }) => <Stack direction={'row'} gap={0.5} aria-hidden={'true'}>
  {TIERS.map(({ level }) => {
    const reached = currentTier >= level;
    return <Box key={level} sx={{
      flex: 1,
      height: 6,
      borderRadius: 0.5,
      bgcolor: reached ? artifactTierColor(level) : 'action.hover',
      opacity: reached && currentTier !== level ? 0.55 : 1
    }}/>;
  })}
</Stack>;

const Artifacts = ({ artifacts }) => <CardGrid size={'m'}>
  {artifacts?.map((artifact, index) => {
    const { name, rawName, acquired, additionalData } = artifact;
    const tier = acquired ?? 0;
    const current = tier >= 2 ? getTierDescription(artifact, tier) : '';
    const next = tier >= 1 && tier < TIERS.length ? getTierDescription(artifact, tier + 1) : '';
    return <ItemCard key={`${name}-${index}`} icon={artifactIcon(rawName, tier)} title={cleanUnderscore(name)} dimmed={!tier}
                     meta={tier ? `Tier ${tier} of ${TIERS.length} · ${TIERS[tier - 1]?.full}` : 'Not acquired'}>
      <TierTrack currentTier={tier}/>
      <ItemCard.Desc text={withTotalLine(filledDescription(artifact, tier))}/>
      <ItemCard.Facts rows={[
        current ? [tierName(tier), cleanUnderscore(current)] : null,
        next ? [<React.Fragment key={'next'}>Next: {tierName(tier + 1)}</React.Fragment>, cleanUnderscore(next)] : null,
        perCharacter(name, additionalData, tier)
      ]}/>
    </ItemCard>;
  })}
</CardGrid>;

export default Artifacts;
