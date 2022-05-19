import { calcCardBonus } from "../../parsers/cards";
import { Grid, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import React from "react";
import { CardAndBorder } from "../common/styles";

const EquippedCards = ({ cards }) => {
  const { equippedCards, cardSet } = cards;

  return <Stack>
    <Typography mb={2} variant={'h5'}>Equipped cards</Typography>
    <Stack>
      {cardSet?.rawName ? <Stack mb={3} justifyContent={'center'} direction='row'>
        <Box sx={{ position: 'relative' }}>
          <CardAndBorder variant={'cardSet'} {...cardSet}/>
        </Box>
      </Stack> : null}
      <Grid container rowGap={3}>
        {equippedCards?.map((card, index) => {
          const { cardName, amount } = card;
          const bonus = calcCardBonus(card);
          return <Grid display={'flex'} justifyContent={'center'} key={`${cardName}-${index}`} position={'relative'}
                       xs={3}
                       item>
            {amount > 0 ? <CardAndBorder {...{ ...card, bonus }}/> :
              <StyledEmptyCard><Typography variant={'subtitle2'}>EMPTY</Typography></StyledEmptyCard>}
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

const StyledEmptyCard = styled.div`
  width: 56px;
  height: 72px;
  border: 2px solid #5d5d5d;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export default EquippedCards;
