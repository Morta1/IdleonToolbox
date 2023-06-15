import { prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { Stack, Typography } from '@mui/material';

const CoinDisplay = ({ centered = true, style = {}, money, title = 'Total Money', maxCoins = 5 }) => {
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

export default CoinDisplay;
