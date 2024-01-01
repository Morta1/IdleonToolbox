import CoinDisplay from 'components/common/CoinDisplay';
import { Stack, Typography } from '@mui/material';
import { IconWithText, TitleAndValue } from 'components/common/styles';
import HtmlTooltip from '../../Tooltip';

const imgStyle = { style: { width: 32, height: 32, objectFit: 'contain' } };
const Currencies = ({
                      money = [],
                      WorldTeleports,
                      ObolFragments,
                      ColosseumTickets,
                      SilverPens,
                      gems,
                      KeysAll,
                      minigamePlays
                    }) => {
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
    </Stack>
  </Stack>
};

export default Currencies;
