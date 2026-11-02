import { calcCardBonus } from '../../parsers/cards';
import { Grid, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import React, { useEffect, useState } from 'react';
import { CardAndBorder } from '../common/styles';
import { createRange, prefix } from '@utility/helpers';
import Tabber from '../common/Tabber';

const PRESETS = [0, 1, 2, 3, 4, 5, 6];

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
    <Typography mb={2} variant={'sectionTitle'} component={'h2'}>Equipped cards</Typography>
    <Tabber
      level={2}
      disableQuery
      iconsOnly
      label={'Card presets'}
      tabs={PRESETS.map((index) => `Card preset ${index + 1}`)}
      components={PRESETS.map((index) => <TabIcon key={index} selected={selectedCardPreset === index}
                                                  src={`${prefix}etc/Card_Preset_${index}.png`} alt=""/>)}
      activeTab={selectedTab}
      onTabChange={setSelectedTab}
    />
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
  border: 2px solid var(--mui-palette-divider);
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
`

// The game's active preset glows around the sprite's own shape, so it never fills the pill the way the open one
// does. 24 px, so it fits a 32 px pill; the box is set before the sprite loads.
const TabIcon = ({ src, alt, selected }) => <img src={src} alt={alt}
                                                 style={{ height: 24, width: 20, objectFit: 'contain', filter: selected ? 'drop-shadow(0 0 3px cyan)' : 'none' }}/>;

export default EquippedCards;
