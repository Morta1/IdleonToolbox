import { notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { Stack, Typography } from '@mui/material';

const CoinDisplay = ({
                       variant = 'vertical',
                       centered = true,
                       style = {},
                       money,
                       title = 'Total Money',
                       maxCoins = 5
                     }) => {
  return <div style={style}>
    {title ? <Typography style={{ textAlign: centered ? 'center' : 'left' }}>{title}</Typography> : null}
    <Stack flexWrap={'wrap'} justifyContent={centered ? 'center' : 'flex-start'} direction={'row'}
           gap={variant === 'vertical' ? 2.3 : 1}>
      {money?.map(([coinIndex, coin], index) => {
        if (coinIndex === 15 && coin > 10000) {
          coin = notateNumber(coin)
        }
        return index < maxCoins ?
          <Stack direction={variant === 'vertical' ? 'column' : 'row'} gap={variant === 'vertical' ? 0 : .5}
                 justifyContent={'center'} alignItems={'center'}
                 key={coin + '' + coinIndex}>
            <CoinIcon src={`${prefix}data/Coins${coinIndex}.png`} alt="coin-icon"/>
            <Typography variant={'body1'} component={'span'} className={'coin-value'}>{coin}</Typography>
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
