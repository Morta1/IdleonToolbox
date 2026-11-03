import { Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';

import React from 'react';
import { villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const MAJIK_NAMES = ['Hole', 'Village', 'Idleon'];
const MAJIK_LETTERS = ['A', 'B', 'C'];

// A majik's line as the game fills it: } its multiplier to two decimals, { the bonus, | per cosmo schematic, $ per 5
// opals of the least-invested villager; @_Y and @_Z name the linked gods and go with Doot. Any other @ is the game's
// line break, which ItemCard.Desc splits on. The parser lists a link with no god for a save that has none (a guest),
// so only named gods fill the line.
const majikText = ({ description, bonus, hasDoot, godsLinks }, hole, linksGods) => {
  const filled = (description ?? '').replace('}', Math.round(100 * (1 + bonus / 100)) / 100).replace('{', bonus)
    .replace('|', Math.round(bonus * (hole?.cosmoSchematics ?? 0)))
    .replace('$', Math.round(Math.floor((hole?.leastOpalInvestedVillager ?? 0) / 5) * bonus));
  if (!linksGods) return filled;
  const gods = hasDoot ? [] : (godsLinks ?? []).map((link) => link?.name).filter(Boolean);
  return filled.replace('@_Y', gods.join(', ')).replace('@_Z', '');
};

const Bonuses = ({ hole }) => {
  const bonuses = hole?.villagers?.[2];

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>{villagerTiles(bonuses)}</Stack>
    <Stack gap={3}>
      {(hole?.majiks ?? []).map((majik, majikIndex) => <Stack key={`majik-${majikIndex}`} gap={1}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <GameIcon src={`data/HoleUIcosmoUpg${MAJIK_LETTERS[majikIndex]}1.png`} size={32} alt={''}/>
          <Typography variant={'sectionTitle'} component={'h2'}>{MAJIK_NAMES[majikIndex]} majik</Typography>
        </Stack>
        <CardGrid size={'m'}>
          {(majik ?? []).map((entry, bonusIndex) => {
            const linksGods = majikIndex === 2 && bonusIndex === 0;
            return <ItemCard key={`majik-bonus-${bonusIndex}`} dimmed={!(entry?.level > 0)}
                             footer={<ItemCard.Facts rows={[
                               linksGods && entry?.hasDoot && entry?.level > 0
                                 ? ['All stats (Doot)', formatNum(15 * (entry?.bonus ?? 0), 'pct', { signed: true })] : null,
                               ['Points invested', `${formatNum(entry?.level ?? 0)} / ${formatNum(entry?.maxLevel ?? 0)}`]
                             ]}/>}>
              <ItemCard.Desc text={majikText(entry, hole, linksGods)}/>
            </ItemCard>;
          })}
        </CardGrid>
      </Stack>)}
    </Stack>
  </>;
};

export default Bonuses;
