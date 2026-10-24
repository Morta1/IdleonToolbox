import { notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { Box, Stack, Typography } from '@mui/material';

// The top tier's amount can run past 100 at the last coin; anything else is two digits
const coinAmount = (coin, index) => (index === 0 && coin > 10000 ? notateNumber(coin) : coin);

// dense: inline with the text around it, a 16px icon per tier, for one-line rows
const DenseCoins = ({ money, maxCoins, style }) => (
  <Box component="span" style={style} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, verticalAlign: 'bottom' }}>
    {money?.slice(0, maxCoins).map(([coinIndex, coin], index) => (
      <Box component="span" key={coinIndex} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
        <Box component="img" src={`${prefix}data/Coins${coinIndex}.png`} alt=""
             sx={{ width: 14, height: 16, objectFit: 'contain', flexShrink: 0 }}/>
        <span className={'coin-value'}>{coinAmount(coin, index)}</span>
      </Box>
    ))}
  </Box>
);

const CoinDisplay = ({
                       variant = 'vertical',
                       centered = true,
                       style = {},
                       money,
                       title = 'Total Money',
                       maxCoins = 5,
                       dense = false
                     }) => {
  if (dense) return <DenseCoins money={money} maxCoins={maxCoins} style={style}/>;
  return <div style={style}>
    {title ? <Typography style={{ textAlign: centered ? 'center' : 'left' }}>{title}</Typography> : null}
    <Stack flexWrap={'wrap'} justifyContent={centered ? 'center' : 'flex-start'} direction={'row'}
           gap={variant === 'vertical' ? 2.3 : 1}>
      {money?.map(([coinIndex, coin], index) => {
        return index < maxCoins ?
          <Stack direction={variant === 'vertical' ? 'column' : 'row'} gap={variant === 'vertical' ? 0 : .5}
                 justifyContent={'center'} alignItems={'center'}
                 key={coin + '' + coinIndex}>
            <CoinIcon src={`${prefix}data/Coins${coinIndex}.png`} alt="coin-icon"/>
            <Typography variant={'body1'} component={'span'} className={'coin-value'}>{coinAmount(coin, index)}</Typography>
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
