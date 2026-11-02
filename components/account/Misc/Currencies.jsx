import CoinDisplay from 'components/common/CoinDisplay';
import { Stack, Typography } from '@mui/material';
import { IconWithText, TitleAndValue } from '@components/common/styles';
import HtmlTooltip from '../../Tooltip';
import { commaNotation, numberWithCommas, prefix, secondsToShortDuration } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import React from 'react';

const Currencies = ({
                      money = [],
                      WorldTeleports,
                      ObolFragments,
                      ColosseumTickets,
                      SilverPens,
                      gems,
                      KeysAll,
                      minigamePlays,
                      candies
                    }) => {
  // A candy's hours as a span of days and hours (not time left, so not formatDuration's Ready).
  const asDays = (hours) => secondsToShortDuration(hours * 3600);
  return <Stack>
    <CoinDisplay className={'box'} money={money}/>
    <Typography mt={2} mb={1} textAlign={'center'}>Currencies</Typography>
    <Stack flexWrap={'wrap'} gap={1} justifyContent={'center'} direction={'row'}>
      <IconWithText size={32} title={'World Teleports'} stat={commaNotation(WorldTeleports)} icon={'rtt0'}/>
      <IconWithText size={32} title={'Obol Fragments'} stat={commaNotation(ObolFragments)} icon={'ObolFrag'}/>
      <HtmlTooltip title={<Stack gap={2}>
        {ColosseumTickets?.allTickets?.map(({
                                              rawName,
                                              amount,
                                              totalAmount,
                                              amountPerDay,
                                              daysSincePickup
                                            }, index) => {
          return <Stack key={`${rawName}-${index}`} direction={'row'} gap={1}>
            <Stack>
              <IconWithText size={32} stat={''} icon={rawName}/>
            </Stack>
            <Stack>
              <TitleAndValue title={'Tickets Per Day'} value={amountPerDay}/>
              <TitleAndValue title={'Days Since Pickup'} value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
              <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
            </Stack>
          </Stack>
        })}
      </Stack>}>
        <IconWithText size={32} stat={commaNotation(ColosseumTickets?.totalAmount)} icon={'TixCol'}/>
      </HtmlTooltip>
      <IconWithText size={32} title={'Silver Pens'} stat={commaNotation(SilverPens)} icon={'SilverPen'}/>
      <IconWithText size={32} title={'Gems'} stat={commaNotation(gems)} icon={'PremiumGem'}/>
      <IconWithText size={32} title={'Minigame Plays'} stat={commaNotation(minigamePlays)}
                    icon={'MGp'}/>
      {KeysAll?.map(({ rawName, amount, totalAmount, amountPerDay, daysSincePickup }, index) => {
        return <HtmlTooltip key={`${rawName}-${index}`}
                            title={<Stack>
                              <TitleAndValue title={'Keys Per Day'} value={amountPerDay}/>
                              <TitleAndValue title={'Days Since Pickup'}
                                             value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
                              <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
                            </Stack>}>
          <IconWithText size={32} stat={commaNotation(amount)} icon={rawName}/>
        </HtmlTooltip>
      })}
      <Tooltip maxWidth={350} title={<Stack>
        <Typography variant={'body1'} component={'span'}>Candies</Typography>
        <Typography variant={'body2'}>Guaranteed: {numberWithCommas(candies?.guaranteed)} hrs ({asDays(candies?.guaranteed)})</Typography>
        <Typography variant={'body2'}>Variant: {numberWithCommas(candies?.special?.min)} - {numberWithCommas(candies?.special?.max)} hrs ({asDays(candies?.special?.min)} - {asDays(candies?.special?.max)})</Typography>
      </Stack>}>
        <Stack alignItems={'center'}>
          <img width={32} height={32} src={`${prefix}data/Timecandy1.png`} alt="time-candy-icon"/>
          <Typography variant={'body1'} component={'span'}>{numberWithCommas(candies?.guaranteed)}</Typography>
        </Stack>
      </Tooltip>
    </Stack>
  </Stack>
};

export default Currencies;
