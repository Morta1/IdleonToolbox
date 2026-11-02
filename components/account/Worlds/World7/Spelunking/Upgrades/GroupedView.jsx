import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const COLUMN_NAMES = {
  0: 'POW Upgrades', 1: 'Stamina', 2: 'Amber Gain', 3: 'Special Features',
  4: 'Tools/Weapons', 5: 'Tunnel Navigation', 6: 'Amber Bonuses', 7: 'Elixirs',
  8: 'Item Drops', 9: 'Shadow Strike', 10: 'Damage/Combat', 11: 'Elixir Rewards',
  12: 'Nova Blast', 13: 'Advanced Amber', 14: 'Grand Discoveries', 15: 'Etc', 16: 'Amber Red'
};

// Decision 4: each column is its heading (its name and the amber to max it) over one card per upgrade
const GroupedView = ({ grouped, amber, denominator, amberIndex }) => {
  const amberIcon = `data/CaveAmber${amberIndex}.png`;
  // The game's amber line: the amount over the denominator, commas under 1e9 and Big past it
  const amberText = (value) => formatGame((value ?? 0) / denominator, 'Spelunk.AmberDenominator');
  return <Stack gap={3}>
    {Object.entries(grouped).map(([groupKey, upgrades]) => {
      const groupCostToMax = upgrades.reduce((sum, u) => sum + (u?.costToMax ?? 0), 0);
      return <Stack key={groupKey} gap={1}>
        <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
          <Typography variant={'sectionTitle'} component={'h2'}>{COLUMN_NAMES[groupKey]}</Typography>
          {groupCostToMax > 0 ? <Typography variant={'body2'} color={'text.secondary'} component={'span'}
                                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            To max <GameIcon src={amberIcon} size={16} alt={'Amber'}/>{amberText(groupCostToMax)}
          </Typography> : null}
        </Stack>
        <CardGrid size={'m'}>
          {upgrades.map((u) => {
            const level = Math.max(u?.level ?? 0, 0);
            const maxed = level >= u?.x3;
            return <ItemCard key={u?.name} icon={`data/CaveShopUpg${u?.originalIndex}.png`} title={cleanUnderscore(u?.name)}
                             level={{ value: level, max: Number.isFinite(u?.x3) ? u.x3 : null }}
                             status={maxed ? 'maxed' : undefined} dimmed={!(u?.level > 0)}
                             footer={u?.cost !== undefined ? <ItemCard.Cost icon={amberIcon} iconAlt={'Amber'}
                                                                             need={u.cost / denominator} have={amber}
                                                                             game={'Spelunk.AmberDenominator'}/> : null}>
              <ItemCard.Desc text={u?.description}/>
              {u?.costToMax > 0 && !maxed
                ? <ItemCard.Facts rows={[[`To max (${formatNum(u.x3 - level)} levels)`, amberText(u.costToMax)]]}/>
                : null}
            </ItemCard>;
          })}
        </CardGrid>
      </Stack>;
    })}
  </Stack>;
};

export default GroupedView;
