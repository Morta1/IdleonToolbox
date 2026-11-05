import { calcCardBonus } from '../../parsers/cards';
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import { CardAndBorder } from '../common/styles';
import { createRange } from '@utility/helpers';
import Tabber from '../common/Tabber';
import GameIcon from '../common/GameIcon';
import Panel from '../common/cards/Panel';
import CardGrid from '../common/cards/CardGrid';
import IconTile from '../common/cards/IconTile';

const PRESETS = [0, 1, 2, 3, 4, 5, 6];
const EMPTY_PRESET = createRange(0, 7).fill({});

const EquippedCards = ({ cards, cardPresets, selectedCardPreset }) => {
  const { equippedCards, cardSet } = cards || {};
  const [selectedTab, setSelectedTab] = useState(selectedCardPreset ?? 0);
  const cardPreset = cardPresets?.[selectedTab] ?? (selectedTab === 0 ? equippedCards : EMPTY_PRESET);

  return <Panel title={'Equipped cards'}>
    <Stack gap={1}>
      <Tabber
        level={2}
        disableQuery
        iconsOnly
        label={'Card presets'}
        tabs={PRESETS.map((index) => `Card preset ${index + 1}`)}
        components={PRESETS.map((index) => <TabIcon key={index} selected={selectedCardPreset === index} src={`etc/Card_Preset_${index}.png`} alt={''}/>)}
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
      />
      {cardSet?.rawName ? <Box sx={{ position: 'relative', alignSelf: 'flex-start' }}>
        <CardAndBorder variant={'cardSet'} {...cardSet}/>
      </Box> : null}
      <CardGrid size={'icon'} columns={4}>
        {cardPreset?.map((card, index) => {
          const { cardName, amount } = card || {};
          return <Box key={`${cardName}-${index}`} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {amount > 0 ? <CardAndBorder {...{ ...card, bonus: calcCardBonus(card) }}/> : <IconTile status={'empty'} alt={'Empty slot'}/>}
          </Box>;
        })}
      </CardGrid>
    </Stack>
  </Panel>;
};

// The game's active preset glows around the sprite's own shape, so it never fills the pill the way the open one does.
const TabIcon = ({ src, alt, selected }) => <Box component={'span'} sx={{ display: 'inline-flex', filter: selected ? 'drop-shadow(0 0 3px cyan)' : 'none' }}>
  <GameIcon src={src} size={24} alt={alt}/>
</Box>;

export default EquippedCards;
