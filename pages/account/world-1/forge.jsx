import { AppContext } from '../../../components/common/context/AppProvider';
import React, { useContext } from 'react';
import { Card, CardContent, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import { getCoinsArray, getTabs, prefix } from '../../../utility/helpers';
import CoinDisplay from '../../../components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Timer from '../../../components/common/Timer';
import Box from '@mui/material/Box';
import { PAGES } from '@components/constants';

const slot = {
  width: 72, alignItems: 'center'
}

const Forge = () => {
  const { state } = useContext(AppContext);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const getCost = (level, costMulti) => {
    if (!costMulti) {
      // this is forge slots, has it's own math.
      return Math.round(200 * Math.pow(5.4, Math.pow(level, 0.83)));
    }
    if (level < 5) {
      return Math.round(50 * Math.pow(2.5, Math.pow(level, 0.51)));
    }
    return Math.round(400 * Math.pow(costMulti, level - 5))
  }

  const getCostToMax = (level, maxLevel, costMulti, totalCost) => {
    let costToMax = 0;
    for (let i = totalCost ? 1 : level; i < maxLevel; i++) {
      costToMax += getCost(i, costMulti);
    }
    return costToMax ?? 0;
  }

  return <>
    <NextSeo
      title="Forge | Idleon Toolbox"
      description="Keep track of your forge production"
    />
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 1'].categories, 'forge')}>
      <Grid container gap={2}>
        {state?.account?.forge?.list?.map(({ ore, barrel, bar, isBrimestone }, index) => {
          const timeTillEmpty = ore?.timeTillEmpty ?? 0;
          const materials = [ore, barrel, bar];
          const empty = materials.every(({ rawName }) => rawName === 'Blank');
          return <Grid item key={`${ore}-${barrel}-${bar}-${index}`}>
            <Card sx={{ position: 'relative', borderColor: isBrimestone ? '#9b689bbf' : 'none' }}
                  variant={'outlined'} key={`${ore}-${barrel}-${bar}-${index}`}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'}>
                  {materials?.map(({ rawName, quantity }, matIndex) => {
                    return <Stack key={`${rawName}-${matIndex}`} sx={slot}>
                      <img style={{ width: !isMd ? 'auto' : 36, opacity: empty ? 0 : 1 }}
                           src={`${prefix}data/${!empty ? rawName : 'CopperBar'}.png`} alt=""/>
                      {quantity > 0 ?
                        <Typography variant={'body1'} component={'span'}>{quantity}</Typography> : <Typography
                          variant={'body1'} component={'span'}>&nbsp;</Typography>}
                    </Stack>
                  })}
                  <Box>
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Time till empty</Typography>
                    <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                           date={new Date().getTime() + timeTillEmpty}/>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        })}
      </Grid>
      <Stack gap={3}>
        {state?.account?.forge?.upgrades?.map(({ level, maxLevel, description, costMulti }, index) => {
          const cost = getCost(level, costMulti);
          const costToMax = getCostToMax(level, maxLevel, costMulti);
          const totalCost = getCostToMax(level, maxLevel, costMulti, true);
          return <Card key={`${level}-${index}`} sx={{ width: 'fit-content' }}>
            <CardContent sx={{
              border: level >= maxLevel ? '1px solid' : '',
              borderColor: level >= maxLevel ? 'success.light' : '',
            }}>
              <Stack direction="row" gap={3} flexWrap={'wrap'}>
                <Column name={'Lv.'} value={`${level} / ${maxLevel}`}/>
                <Column style={{ width: 300 }} name={'Description'} value={description.capitalize()}/>
                <Column style={{ width: 120 }} name={'Cost'}
                        value={level < maxLevel ? <CoinDisplay centered={false} title={''} maxCoins={3}
                                                               money={getCoinsArray(cost)}/> :
                          <Typography color={'success.light'}>Maxed</Typography>}/>


                <Column style={{ minWidth: 120, alignItems: 'flex-start' }}
                        name={level < maxLevel ? 'Cost To Max' : 'Total cost'}
                        value={<CoinDisplay centered={false} title={''} maxCoins={3}
                                            money={getCoinsArray(level < maxLevel ? costToMax : totalCost)}/>}/>


              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>
  </>
};

const Column = ({ style = {}, name, value }) => {
  return <div style={style}>
    <Typography>{name}</Typography>
    <Typography component={'div'}>{value}</Typography>
  </div>
}
export default Forge;
