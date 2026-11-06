import { calcCardBonus } from '../../parsers/cards';
import { Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import { CardAndBorder } from '../common/styles';
import { cleanUnderscore, createRange, formatNum } from '@utility/helpers';
import Tabber from '../common/Tabber';
import GameIcon from '../common/GameIcon';
import Panel from '../common/cards/Panel';
import IconTile from '../common/cards/IconTile';

const PRESETS = [0, 1, 2, 3, 4, 5, 6];
const EMPTY_PRESET = createRange(0, 7).fill({});
// A card's art is 56 x 72 and its equipped border draws 64 x 88 around it, starting 3 px above: the cell holds the
// border, so a card's edge sits on the title's and a row never runs into the next.
const CELL_WIDTH = 64;
const CELL_HEIGHT = 88;
const CARDS_SX = { display: 'grid', gridTemplateColumns: `repeat(4, ${CELL_WIDTH}px)`, columnGap: '7px', rowGap: '6px', justifyContent: 'start' };

const CardCell = ({ children }) => <Box sx={{ width: CELL_WIDTH, height: CELL_HEIGHT, pt: '3px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
  <Box sx={{ position: 'relative', width: 56, height: 72 }}>{children}</Box>
</Box>;

const EquippedCards = ({ cards, cardPresets, selectedCardPreset }) => {
  const { equippedCards, cardSet } = cards || {};
  const [selectedTab, setSelectedTab] = useState(selectedCardPreset ?? 0);
  const cardPreset = cardPresets?.[selectedTab] ?? (selectedTab === 0 ? equippedCards : EMPTY_PRESET);

  return <Panel title={'Equipped cards'}>
    <Box sx={{ mb: 1 }}>
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
    </Box>
    {/* The set's name and bonus read with no tap */}
    {cardSet?.rawName ? <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ mb: 1 }}>
      <CardCell><CardAndBorder variant={'cardSet'} {...cardSet}/></CardCell>
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 500 }}>{cleanUnderscore(cardSet?.name ?? '')}</Typography>
        <Typography color={'text.secondary'} component={'div'} sx={{ fontSize: 13, lineHeight: '18px' }}>
          {cleanUnderscore(cardSet?.effect?.replace('{', formatNum(cardSet?.bonus)) ?? '')}
        </Typography>
        <Typography color={'text.muted'} component={'div'} sx={{ fontSize: 13, lineHeight: '18px' }}>Card set</Typography>
      </Stack>
    </Stack> : null}
    <Box sx={CARDS_SX}>
      {cardPreset?.map((card, index) => {
        const { cardName, amount } = card || {};
        return amount > 0
          ? <CardCell key={`${cardName}-${index}`}><CardAndBorder {...{ ...card, bonus: calcCardBonus(card) }}/></CardCell>
          : <Box key={`${cardName}-${index}`} sx={{ display: 'flex', height: CELL_HEIGHT }}><IconTile status={'empty'} alt={'Empty slot'}/></Box>;
      })}
    </Box>
  </Panel>;
};

// The game's active preset glows around the sprite's own shape, so it never fills the pill the way the open one does.
const TabIcon = ({ src, alt, selected }) => <Box component={'span'} sx={{ display: 'inline-flex', filter: selected ? 'drop-shadow(0 0 3px var(--mui-palette-primary-main))' : 'none' }}>
  <GameIcon src={src} size={20} alt={alt}/>
</Box>;

export default EquippedCards;
