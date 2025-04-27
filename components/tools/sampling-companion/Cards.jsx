import { calcCardBonus, getCardSets } from '../../../parsers/cards';
import { Grid, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import { CardAndBorder } from '../../common/styles';

const Cards = ({ cards, cardSet, account, character }) => {
  const accountCardSets = useMemo(() => getCardSets(account), [account]);
  const currentCardSet = accountCardSets[cardSet?.name];

  return <Stack>
    <Typography mb={2} variant={'h5'}>Cards</Typography>
    <Stack>
      {cardSet?.rawName ? <Stack mb={3} justifyContent={'center'} direction="row">
        <Box sx={{ position: 'relative' }}>
          <CardAndBorder variant={'cardSet'} {...(currentCardSet ? currentCardSet : cardSet)}
                         forceDisable={character?.cards?.cardSet?.name !== cardSet?.name}/>
        </Box>
      </Stack> : null}
      <Grid container rowGap={3}>
        {cards?.map((card, index) => {
          const { displayName } = card || {};
          const realCard = account?.cards?.[displayName];
          const bonus = calcCardBonus(realCard);
          const isEquipped = character?.cards?.equippedCards?.filter(({ cardName }) => cardName === displayName)?.length > 0;
          return <Grid display={'flex'} sx={{ position: 'relative' }} justifyContent={'center'}
                       key={`${displayName}-${index}`} xs={3} item>
            <CardAndBorder {...{ ...(realCard || card), bonus }} forceDisable={!isEquipped}/>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

export default Cards;
