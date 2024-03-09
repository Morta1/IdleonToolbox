import { calcCardBonus } from '../../parsers/cards';
import { Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { CardAndBorder } from '../common/styles';
import { createRange, prefix } from '@utility/helpers';

const EquippedCards = ({ cards, cardPresets, selectedCardPreset }) => {
  const { equippedCards, cardSet } = cards || {};
  const [cardPreset, setCardPreset] = useState();
  const [selectedTab, setSelectedTab] = useState(selectedCardPreset ?? 0);

  useEffect(() => {
    let preset = cardPresets?.[selectedTab];
    if (!preset) {
      if (selectedTab === 0) {
        preset = equippedCards
      } else {
        preset = createRange(0, 7).fill({});
      }
    }
    setCardPreset(preset);
  }, [selectedTab, cards])

  return <Stack>
    <Typography mb={2} variant={'h5'}>Equipped cards</Typography>
    <Tabs centered
          sx={{mb:1}}
          value={selectedTab} onChange={(e, selected) => setSelectedTab(selected)}>
      {[0, 1, 2, 3, 4, 5, 6]?.map((tabIndex) => {
        return <Tab sx={{ minWidth: { xs: 'unset', sm: 'inherit' }, p:1 }}
                    icon={<TabIcon src={`${prefix}etc/Card_Preset_${tabIndex}.png`} alt={tabIndex}/>}
                    key={`${tabIndex}-card-tab`}
                    aria-label={`${tabIndex}-card-tab`}/>
      })}
    </Tabs>
    <Stack>
      {cardSet?.rawName ? <Stack mb={3} justifyContent={'center'} direction="row">
        <Box sx={{ position: 'relative' }}>
          <CardAndBorder variant={'cardSet'} {...cardSet}/>
        </Box>
      </Stack> : null}
      <Grid container rowGap={3}>
        {cardPreset?.map((card, index) => {
          const { cardName, amount } = card || {};
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

const TabIcon = ({ src }) => {
  return <Box sx={{ width: { xs: 28 }, '> img': { width: { xs: 28 } } }}>
    <img src={src} alt=""/>
  </Box>
}

export default EquippedCards;
