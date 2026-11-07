import { calcCardBonus, getCardSets } from '../../../parsers/cards';
import { Box, Stack } from '@mui/material';
import React from 'react';
import { CardAndBorder } from '../../common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';

// The card art keeps its own 56x72 box (5a Decision 1); the star border hangs off this box
const CARD_CELL_SX = { position: 'relative', width: 'fit-content' };

const Cards = ({ cards, cardSet, account, character }) => {
  const accountCardSets = getCardSets(account);
  const currentCardSet = accountCardSets[cardSet?.name];

  return <Panel title={'Cards'}>
    <Stack gap={2} sx={{ p: 2 }}>
      {cardSet?.rawName ? <Box sx={CARD_CELL_SX}>
        <CardAndBorder variant={'cardSet'} {...(currentCardSet ? currentCardSet : cardSet)}
                       forceDisable={character?.cards?.cardSet?.name !== cardSet?.name}/>
      </Box> : null}
      <CardGrid size={'icon'} columns={4} sx={{ rowGap: 2 }}>
        {cards?.map((card, index) => {
          const { displayName } = card || {};
          const realCard = account?.cards?.[displayName];
          // A failed cards section has no stars to price: the catalog's own bonus
          const bonus = realCard ? calcCardBonus(realCard) : card?.bonus;
          const isEquipped = character?.cards?.equippedCards?.filter(({ cardName }) => cardName === displayName)?.length > 0;
          return <Box key={`${displayName}-${index}`} sx={CARD_CELL_SX}>
            <CardAndBorder {...{ ...(realCard || card), bonus }} forceDisable={!isEquipped}/>
          </Box>;
        })}
      </CardGrid>
    </Stack>
  </Panel>;
};

export default Cards;
