import { prefix } from "utility/helpers";
import styled from "@emotion/styled";
import { Stack, Typography } from "@mui/material";

const CoinDisplay = ({ centered = true, style = {}, money, title = 'Total Money', maxCoins = 5, noShadow }) => {
  return <div style={style}>
    {title ? <Typography style={{ textAlign: 'center' }}>{title}</Typography> : null}
    <Stack flexWrap={'wrap'} justifyContent={centered ? 'center' : 'flex-start'} direction={'row'} gap={2.3}>
      {money?.map(([coinIndex, coin], index) => {
        return index < maxCoins && Number(coin) > 0 ?
          <Stack justifyContent={'center'} alignItems={'center'} key={coin + '' + coinIndex}>
            <CoinIcon src={`${prefix}data/Coins${coinIndex}.png`} alt=""/>
            <Typography variant={'body1'} component={'span'} className={'coin-value'}>{Number(coin)}</Typography>
          </Stack> : null
      })}
    </Stack>
  </div>
};

const CoinIcon = styled.img`
  width: 23px;
  height: 27px;
  object-fit: contain;
`

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

  // .coin-value {
  //   position: absolute;
    //   text-shadow: ${({ noShadow }) => noShadow ? 'unset' : '2px 2px 0 black'};
  //   bottom: -22px;
  //   left: 50%;
  //   transform: translateX(-50%);
  // }
`;

export default CoinDisplay;
