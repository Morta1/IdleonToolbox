import CoinDisplay from "components/common/CoinDisplay";
import { Stack } from "@mui/material";
import { IconWithText, TitleAndValue } from "components/common/styles";
import HtmlTooltip from "../../Tooltip";

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
  return (
    <>
      <CoinDisplay className={'box'} money={money}/>
      <Stack mt={2} flexWrap={'wrap'} gap={1} justifyContent={'center'} direction={'row'}>
        <IconWithText stat={WorldTeleports} icon={'rtt0'}/>
        <IconWithText stat={ObolFragments} icon={'ObolFrag'}/>
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
                <IconWithText stat={''} icon={rawName}
                              img={{ style: { width: 72, height: 72, objectFit: 'contain' } }}/>
              </Stack>
              <Stack>
                <TitleAndValue title={'Tickets per day'} value={amountPerDay}/>
                <TitleAndValue title={'Days since pickup'} value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
                <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
              </Stack>
            </Stack>
          })}
        </Stack>}>
          <IconWithText stat={ColosseumTickets.totalAmount} icon={'TixCol'}/>
        </HtmlTooltip>
        <IconWithText stat={SilverPens} icon={'SilverPen'}/>
        <IconWithText stat={gems} icon={'PremiumGem'}/>
        <IconWithText stat={minigamePlays} img={{ style: { width: 72, height: 72, objectFit: 'contain' } }}
                      icon={'MGp'}/>
        {KeysAll?.map(({ rawName, amount, totalAmount, amountPerDay, daysSincePickup }, index) => {
          return <HtmlTooltip key={`${rawName}-${index}`}
                              title={<Stack>
                                <TitleAndValue title={'Keys per day'} value={amountPerDay}/>
                                <TitleAndValue title={'Days since pickup'}
                                               value={isNaN(daysSincePickup) ? 0 : daysSincePickup}/>
                                <TitleAndValue title={'Total Keys'} value={isNaN(totalAmount) ? 0 : totalAmount}/>
                              </Stack>}>
            <IconWithText stat={amount} icon={rawName}/>
          </HtmlTooltip>
        })}
      </Stack>
    </>
  );
};

export default Currencies;
