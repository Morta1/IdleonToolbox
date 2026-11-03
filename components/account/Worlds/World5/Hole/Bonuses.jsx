import { Divider, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';

import React, { Fragment } from 'react';
import { villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const majiksName = ['Hole', 'Village', 'Idleon'];

const Bonuses = ({ hole }) => {
  const bonuses = hole?.villagers?.[2];

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>{villagerTiles(bonuses)}</Stack>
    <Divider sx={{ my: 2 }}/>
    {hole?.majiks?.map((majik, majikIndex) => {
      const letter = majikIndex === 0 ? 'A' : majikIndex === 1 ? 'B' : majikIndex === 2 ? 'C' : '';

      return <Fragment key={`majik-${majikIndex}`}>
        <Stack sx={{ mb: 2 }} direction={'row'} alignItems={'center'} gap={2}>
          <Typography variant={'sectionTitle'} component={'h2'}>{majiksName[majikIndex]} majik</Typography>
          <img style={{ width: 30 }} src={`${prefix}data/HoleUIcosmoUpg${letter}1.png`} alt={`majik`}/>
        </Stack>
        <CardGrid size={'m'}>
          {majik.map(({ description, bonus, level, hasDoot, godsLinks, maxLevel }, bonusIndex) => {
            let desc = description.replace('}', Math.round(100 * (1 + bonus / 100)) / 100)
              .replace('{', bonus)
              .replace('|', Math.round(bonus * hole?.cosmoSchematics))
              .replace('\$', Math.round(Math.floor((hole?.leastOpalInvestedVillager ?? 0) / 5) * bonus));
            if (hasDoot){
              desc = desc.replace('@_Y', '').replace('@_Z', '');
            }
            else if (majikIndex === 2 && bonusIndex === 0 && godsLinks?.length > 0 && !hasDoot){
              desc = desc.replace('@_Y', `${godsLinks?.[0]?.name},`);
              desc = desc.replace('@_Z', godsLinks?.[1]?.name);
            }
            // Any other @ is the game's line break: ItemCard.Desc splits on it
            return <ItemCard key={`majik-bonus-${bonusIndex}`}
                             dimmed={level === 0}
                             footer={<ItemCard.Facts rows={[['Points invested', `${level} / ${maxLevel}`]]}/>}>
              <ItemCard.Desc text={desc}/>
              {majikIndex === 2 && bonusIndex === 0 && hasDoot && level > 0
                ? <Typography variant={'body2'} color={'text.success'}>+{15 * bonus}% All stats</Typography>
                : null}
            </ItemCard>
          })}
        </CardGrid>
        <Divider orientation={'horizontal'} sx={{ my: 2 }}/>
      </Fragment>
    })}
  </>;
};

export default Bonuses;
