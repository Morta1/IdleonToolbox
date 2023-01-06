import CoinDisplay from "components/common/CoinDisplay";
import { Stack } from "@mui/material";
import { IconWithText } from "components/common/styles";

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
        <IconWithText stat={ColosseumTickets} icon={'TixCol'}/>
        <IconWithText stat={SilverPens} icon={'SilverPen'}/>
        <IconWithText stat={gems} icon={'PremiumGem'}/>
        <IconWithText stat={minigamePlays} img={{ style: { width: 72, height: 72, objectFit: 'contain' } }}
                      icon={'MGp'}/>
        {KeysAll?.map(({ rawName, amount }, index) => {
          return <IconWithText key={`${rawName}-${index}`} stat={amount} icon={rawName}/>
        })}
      </Stack>
    </>
  );
};

export default Currencies;
