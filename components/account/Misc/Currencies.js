import CoinDisplay from 'components/common/CoinDisplay';
import { Stack, Typography } from '@mui/material';
import { IconWithText, TitleAndValue } from '@components/common/styles';
import HtmlTooltip from '../../Tooltip';
import { numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import React from 'react';

const imgStyle = { style: { width: 32, height: 32, objectFit: 'contain' } };
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
  const minDays = (candies?.special?.min / 24).toFixed(2).replace('.00', '');
  const maxDays = (candies?.special?.max / 24).toFixed(2).replace('.00', '');
  return <Stack>
    <CoinDisplay className={'box'} money={money}/>
    <Typography mt={2} mb={1} textAlign={'center'}>Currencies</Typography>
    <Stack flexWrap={'wrap'} gap={1} justifyContent={'center'} direction={'row'}>
      <IconWithText title={'World Teleports'} stat={WorldTeleports} icon={'rtt0'} img={imgStyle}/>
      <IconWithText title={'Obol Fragments'} stat={ObolFragments} icon={'ObolFrag'} img={imgStyle}/>
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
              <IconWithText stat={''} icon={rawName} img={imgStyle}/>
            </Stack>
            <Stack>
              <TitleAndValue title={'Tickets Per Day'} value={amountPerDay}/>
              <TitleAndValue title={'Days Since Pickup'} value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
              <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
            </Stack>
          </Stack>
        })}
      </Stack>}>
        <IconWithText stat={ColosseumTickets?.totalAmount} icon={'TixCol'} img={imgStyle}/>
      </HtmlTooltip>
      <IconWithText title={'Silver Pens'} stat={SilverPens} icon={'SilverPen'} img={imgStyle}/>
      <IconWithText title={'Gems'} stat={gems} icon={'PremiumGem'} img={imgStyle}/>
      <IconWithText title={'Minigame Plays'} stat={minigamePlays} img={imgStyle}
                    icon={'MGp'}/>
      {KeysAll?.map(({ rawName, amount, totalAmount, amountPerDay, daysSincePickup }, index) => {
        return <HtmlTooltip key={`${rawName}-${index}`}
                            title={<Stack>
                              <TitleAndValue title={'Keys Per Day'} value={amountPerDay}/>
                              <TitleAndValue title={'Days Since Pickup'}
                                             value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
                              <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
                            </Stack>}>
          <IconWithText stat={amount} icon={rawName} img={imgStyle}/>
        </HtmlTooltip>
      })}
      <Tooltip maxWidth={350} title={<Stack>
        <Typography variant={'body1'} component={'span'}>Candies</Typography>
        <Typography variant={'body2'}>Guaranteed: {numberWithCommas(candies?.guaranteed)} hrs ({(candies?.guaranteed / 24).toFixed(2)} days)</Typography>
        <Typography variant={'body2'}>Variant: {numberWithCommas(candies?.special?.min)} - {numberWithCommas(candies?.special?.max)} hrs ({numberWithCommas(minDays)} - {numberWithCommas(maxDays)} days)</Typography>
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
