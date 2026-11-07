import { formatNum } from 'utility/helpers';
import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { useSheet } from '@components/common/cards/SheetContext';

// The top tier's amount can run past 100 at the last coin; anything else is two digits
const coinAmount = (coin, index) => (index === 0 && coin > 10000 ? formatNum(coin) : coin);

// dense: inline with the text around it, a 16px icon per tier, for one-line rows: tight enough that five tiers sit
// beside a Facts label on a 269 px card. A tier of zero inside the shown ones is not drawn (an amount of 0 stays).
const DenseCoins = ({ money, maxCoins, style }) => (
  <Box component="span" style={style} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.375, verticalAlign: 'bottom' }}>
    {money?.slice(0, maxCoins).filter(([, coin], index, shown) => coin > 0 || shown.length === 1).map(([coinIndex, coin], index) => (
      <Box component="span" key={coinIndex} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.125 }}>
        <GameIcon src={`data/Coins${coinIndex}.png`} size={16} alt={''}/>
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
  // Inside a sheet the tiers draw small, on a row of their own height (the characters board's .coins)
  const small = Boolean(useSheet());
  if (dense) return <DenseCoins money={money} maxCoins={maxCoins} style={style}/>;
  return <div style={style}>
    {title ? <Typography variant={'body2'} style={{ textAlign: centered ? 'center' : 'left' }}>{title}</Typography> : null}
    <Stack flexWrap={'wrap'} justifyContent={small ? 'flex-end' : centered ? 'center' : 'flex-start'} direction={'row'}
           gap={small ? 1 : variant === 'vertical' ? 2.3 : 1} sx={small ? { py: '1px' } : undefined}>
      {money?.slice(0, maxCoins).filter(([, coin], index, shown) => coin > 0 || shown.length === 1).map(([coinIndex, coin], index) => (
        <Stack direction={variant === 'vertical' ? 'column' : 'row'} gap={variant === 'vertical' ? 0 : .5}
               justifyContent={'center'} alignItems={'center'}
               key={coin + '' + coinIndex}>
          {/* A coin's value is beside it */}
          <GameIcon src={`data/Coins${coinIndex}.png`} size={small ? 20 : 24} alt={''}/>
          <Typography variant={'body2'} component={'span'} className={'coin-value'}
                      sx={small ? { fontSize: 12, lineHeight: '14px', fontWeight: 500 } : undefined}>{coinAmount(coin, index)}</Typography>
        </Stack>
      ))}
    </Stack>
  </div>
};

export default CoinDisplay;
