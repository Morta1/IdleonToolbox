import { prefix } from "utility/helpers";
import styled from "@emotion/styled";
import { Stack, Typography } from "@mui/material";

const CoinDisplay = ({ style = {}, money, title = 'Total Money', maxCoins = 5, noShadow }) => {
  return <div style={style}>
    {title ? <Typography style={{ textAlign: 'center' }}>{title}</Typography> : null}
    <Stack flexWrap={'wrap'} justifyContent={'center'} direction={'row'} gap={2.3}>
      {money?.map(([coinIndex, coin], index) => {
        return index < maxCoins && Number(coin) > 0 ? <Coin noShadow={noShadow} key={coin + '' + coinIndex}>
          <img className={'coin-icon'} src={`${prefix}data/Coins${coinIndex}.png`} alt=""/>
          <Typography variant={'body1'} component={'span'} className={'coin-value'}>{Number(coin)}</Typography>
        </Coin> : null
      })}
    </Stack>
  </div>
};

const Coin = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .coin-icon {
    width: 23px;
    height: 27px;
    object-fit: contain;
  }

  .coin-value {
    position: absolute;
    text-shadow: ${({ noShadow }) => noShadow ? 'unset' : '2px 2px 0 black'};
    bottom: -22px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

export default CoinDisplay;
