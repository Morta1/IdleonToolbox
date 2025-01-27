import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const Market = ({ market, crop }) => {
  return (
    (<Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {market?.map(({
                      name,
                      level,
                      maxLvl,
                      bonus,
                      value,
                      baseValue,
                      costToMax,
                      type,
                      cost,
                      nextUpgrades
                    }, marketIndex) => {
        return (
          (<Card sx={{ width: 250 }}
                       key={'upgrade' + marketIndex}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack direction={'row'} gap={2} alignItems={'center'}>
                <Typography>{cleanUnderscore(name.toLowerCase().capitalizeAll())}</Typography>
                <Typography variant={'caption'}>{level} / {maxLvl}</Typography>
              </Stack>
              <Typography variant={'caption'}
                          color={marketIndex < 8 ? 'warning.light' : 'secondary.main'}>{marketIndex < 8
                ? 'Day market'
                : 'Night Market'}</Typography>
              <Typography mt={2}>{cleanUnderscore(bonus.replace(/{/, marketIndex < 8
                ? value
                : baseValue)).replace(/}/, marketIndex < 8
                ? value
                : Math.round(100 * baseValue) / 100)}</Typography>
              {level < maxLvl ? <>
                <Stack mt={1}>
                  <Typography variant={'caption'}>Next requirement</Typography>
                  <UpgradeReq icon={marketIndex < 8 ? `FarmCrop${type}` : 'FarmCropBean'}
                              owned={crop[marketIndex < 8 ? type : 'beans']} cost={cost}/>
                  <Divider sx={{ mt: 2 }}/>
                </Stack>
                <Stack mt={2}>
                  <Typography variant={'caption'}>Future requirements</Typography>
                  {nextUpgrades.map(({ type: nextType, cost: nextCost }, index) => {
                    if (nextType === type && nextCost === cost) return null;
                    if (marketIndex > 8 && index > 0) return null;
                    nextType = marketIndex < 8 ? nextType : 'beans';
                    const icon = marketIndex < 8 ? `FarmCrop${nextType}` : 'FarmCropBean';
                    return <UpgradeReq key={'extra' + index} icon={icon} owned={crop[nextType]} cost={nextCost}/>
                  })}
                </Stack>
              </> : <Typography color={'success.light'}>Maxed out</Typography>}
              {costToMax > 0
                ? <Typography sx={{ mt: 'auto' }} variant={'caption'}>Cost to
                  max: {notateNumber(costToMax, 'Big')}</Typography>
                : null}
            </CardContent>
          </Card>)
        );
      })}
    </Stack>)
  );
};

const UpgradeReq = ({ icon, owned, cost }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1}>
    <img src={`${prefix}data/${icon}.png`} alt={''}/>
    <Typography>{owned > 0
      ? notateNumber(owned)
      : 0} / {notateNumber(Math.floor(cost))}</Typography>
  </Stack>
}

export default Market;
