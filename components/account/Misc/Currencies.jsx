import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CoinDisplay from 'components/common/CoinDisplay';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore, formatNum, secondsToShortDuration } from '@utility/helpers';
import { keysMap } from '@parsers/parseMaps';

// A count read from the save; a days count the game has not started yet reads 0
const count = (value) => formatNum(Number.isFinite(Number(value)) ? Number(value) : 0, 'whole');

// What an NPC hands out once a day: its rate, the days since the last pickup and what waits (up to 3 days' worth)
const pickupFacts = (entry, name) => <Stack key={name} gap={0.5}>
  <Stack direction={'row'} alignItems={'center'} gap={1}>
    <GameIcon src={`data/${entry?.rawName}.png`} size={24} alt={''}/>
    <Typography variant={'cardTitle'} component={'div'}>{name}</Typography>
  </Stack>
  <ItemCard.Facts rows={[
    ['Per day', count(entry?.amountPerDay)],
    ['Days since pickup', count(entry?.daysSincePickup)],
    ['Waiting to collect', count(entry?.totalAmount)]
  ]}/>
</Stack>;

// A candy's hours as a span of days and hours (not time left, so not formatDuration's Ready)
const asDays = (hours) => secondsToShortDuration((hours ?? 0) * 3600);
const candyFacts = (candies) => <Stack gap={0.5}>
  <Typography variant={'cardTitle'} component={'div'}>Candies</Typography>
  <ItemCard.Facts rows={[
    ['Guaranteed', `${formatNum(candies?.guaranteed ?? 0)} hours (${asDays(candies?.guaranteed)})`],
    ['Variant', `${formatNum(candies?.special?.min ?? 0)} to ${formatNum(candies?.special?.max ?? 0)} hours `
    + `(${asDays(candies?.special?.min)} to ${asDays(candies?.special?.max)})`]
  ]}/>
</Stack>;

// keysFailed and ticketsFailed: their sub-sections failed, so their tiles read "-" with nothing to open
const Currencies = ({
                      money = [],
                      WorldTeleports,
                      ObolFragments,
                      ColosseumTickets,
                      SilverPens,
                      gems,
                      KeysAll,
                      minigamePlays,
                      candies,
                      keysFailed,
                      ticketsFailed
                    }) => {
  const keys = keysFailed ? Object.values(keysMap) : KeysAll ?? [];
  return <Panel title={'Currencies'}>
    <Panel.Row name={'Total money'} value={<CoinDisplay dense money={money}/>}/>
    <Panel.Row icon={'data/PremiumGem.png'} name={'Gems'} value={Number(gems) || 0} kind={{ game: 'Save.Gems', whole: true }}/>
    <Box sx={{ p: 1.5 }}>
      <CardGrid size={'icon'} fill>
        <IconTile icon={'data/rtt0.png'} alt={'World Teleports'} value={count(WorldTeleports)} details={'World Teleports'}/>
        <IconTile icon={'data/ObolFrag.png'} alt={'Obol Fragments'} value={count(ObolFragments)} details={'Obol Fragments'}/>
        <IconTile icon={'data/TixCol.png'} alt={'Colosseum Tickets'}
                  value={ticketsFailed ? '-' : count(ColosseumTickets?.totalAmount)}
                  details={ticketsFailed ? undefined : <Stack gap={1.5}>
                    {(ColosseumTickets?.allTickets ?? []).map((ticket, index) => pickupFacts(ticket, `Ticket ${index + 1}`))}
                  </Stack>}/>
        <IconTile icon={'data/SilverPen.png'} alt={'Silver Pens'} value={count(SilverPens)} details={'Silver Pens'}/>
        <IconTile icon={'data/MGp.png'} alt={'Minigame Plays'} value={count(minigamePlays)} details={'Minigame Plays'}/>
        {keys.map((key) => <IconTile key={key?.rawName} icon={`data/${key?.rawName}.png`} alt={cleanUnderscore(key?.name)}
                                     value={keysFailed ? '-' : count(key?.amount)}
                                     details={keysFailed ? undefined : pickupFacts(key, cleanUnderscore(key?.name))}/>)}
        <IconTile icon={'data/Timecandy1.png'} alt={'Candies'} value={count(candies?.guaranteed)} details={candyFacts(candies)}/>
      </CardGrid>
    </Box>
  </Panel>;
};

export default Currencies;
