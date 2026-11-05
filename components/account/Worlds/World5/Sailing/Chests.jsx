import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { ARTIFACT_TIERS, artifactTierColor } from './sailing.consts';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import Notice from '@components/common/Notice';

const TIERS = [['ancientChance', 2], ['eldritchChance', 3], ['sovereignChance', 4], ['omnipotentChance', 5],
  ['transcendentChance', 6], ['verisimilitudeChance', 7]];

// A possible artifact's details: its name, its form now and its bonus
const artifactDetails = (artifact) => <Stack gap={0.5}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(artifact?.name)}</Typography>
  <Typography variant={'body2'} color={'text.secondary'}>
    {artifact?.acquired ? `${ARTIFACT_TIERS[artifact.acquired - 1]?.full} form` : 'Not acquired'}
  </Typography>
  <ItemCard.Desc text={artifact?.description}/>
</Stack>;

// In a failed section the page's note says why there are none
const Chests = ({ chests, sectionFailed }) => {
  if (!chests?.length) return sectionFailed ? null
    : <Notice tone={'info'}>Chests show here when your boats bring them back from their islands.</Notice>;
  return <CardGrid size={'m'}>
    {chests.map((chest, index) => {
      const { island, artifactChance, rawName, done, possibleArtifacts, islandIndex, treasure } = chest;
      return <ItemCard key={`${rawName}-${index}`} icon={`data/${rawName}.png`} iconAlt={''} title={cleanUnderscore(island?.name)}
                       meta={done ? 'No artifacts left on this island' : undefined}
                       footer={<ItemCard.Facts rows={[[<Stack key={'label'} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
                         <GameIcon src={`data/SailT${2 * islandIndex + 1}.png`} size={24} alt={''}/>Treasure</Stack>,
                         <Num key={'treasure'} value={treasure ?? 0} system={'Sailing'}/>]]}/>}>
        {done ? null : <ItemCard.Facts rows={[
          ['Artifact', formatNum(artifactChance ?? 0, 'pct')],
          ...TIERS.filter(([key]) => chest[key] != null)
            .map(([key, tier]) => [<Box key={key} component={'span'} sx={{ color: artifactTierColor(tier) }}>{ARTIFACT_TIERS[tier - 1].full}</Box>,
              formatNum(chest[key], 'pct')])
        ]}/>}
        {!done && possibleArtifacts?.length ? <CardGrid size={'icon'}>
          {possibleArtifacts.map((artifact) => <IconTile key={artifact?.rawName} icon={`data/${artifact?.rawName}.png`}
                                                         alt={cleanUnderscore(artifact?.name)}
                                                         details={artifactDetails(artifact)}/>)}
        </CardGrid> : null}
      </ItemCard>;
    })}
  </CardGrid>;
};

export default Chests;
