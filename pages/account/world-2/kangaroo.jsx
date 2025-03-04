import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, getTabs, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World2/Kangaroo/Upgrades';
import Tooltip from '@components/Tooltip';
import { PAGES } from '@components/constants';

const Kangaroo = () => {
  const { state } = useContext(AppContext);
  const { kangaroo } = state?.account || {};
  const notation = (val) => val < 9999999 ? commaNotation(Math.ceil(val)) : notateNumber(val, 'Big')

  return <>
    <NextSeo
      title="Poppy The Kangaroo | Idleon Toolbox"
      description="Keep track of your kangaroo upgrades and progress"
    />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue cardSx={{ my: 1, height: 'fit-content' }}
                         stackProps={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
        <Section title={'Fish'} value={notation(kangaroo?.fish)} icon={'etc/KFish.png'}/>
        <Section title={'Fish/m'} value={notation(kangaroo?.bonuses?.[0]?.bonus)} icon={'etc/KFish.png'}/>
        <Section title={'Fish/h'} value={notation(kangaroo?.bonuses?.[0]?.bonus * 60)}
                 icon={'etc/KFish.png'}/>
        <Section title={'Next upg.'} value={kangaroo?.nextLvReq > 0
          ? `${notateNumber(kangaroo?.progress)}/${notateNumber(kangaroo?.nextLvReq)}`
          : 'Done'} icon={'etc/KFish.png'}/>
      </CardTitleAndValue>
      <CardTitleAndValue cardSx={{ my: 1, height: 'fit-content' }}
                         stackProps={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
        <Section title={'Tars'} value={notation(kangaroo?.tarFishOwned)} icon={'etc/KTar.png'}/>
        <Section title={'Tar/h'} value={notation(3600 / kangaroo?.tarFishRate)} icon={'etc/KTar.png'}/>
      </CardTitleAndValue>
      <CardTitleAndValue cardSx={{ my: 1, height: 'fit-content' }}
                         stackProps={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
        <Section title={'Progress'} value={`${notation(kangaroo?.shinyProgress)}%`} icon={'etc/KShiny.png'}/>
        <Section title={'Shiny/m'} value={`${notation(kangaroo?.shinyRatePercent)}%`} icon={'etc/KShiny.png'}/>
      </CardTitleAndValue>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {kangaroo?.bonuses.map(({ name, bonus, percentage }, index) => {
          if (index === 0) return;
          bonus = Math.round(10 * bonus) / 10;
          return <CardTitleAndValue cardSx={{ my: 1 }} key={name} title={name}
                                    value={`${!percentage ? '+' : ''}${bonus}${percentage ? '%' : ''}`}
                                    icon={`etc/Kangaroob_${index}.png`}/>
        })}
      </Stack>
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'kangaroo')}>
      <Upgrades upgrades={kangaroo?.upgrades}/>
      <Upgrades upgrades={kangaroo?.tarUpgrades} isTar/>
      <Stack gap={5}>
        <Stack>
          <Typography variant={'h5'} mb={1}>Multi</Typography>
          <CardTitleAndValue cardSx={{ my: 1, height: 'fit-content' }}
                             stackProps={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
            <Section title={'Total multi'} value={`${kangaroo?.totalMulti.replace('.00', '')}x`}/>
            {kangaroo?.allMultipliers?.map(({ multi, amount }, multiIndex) => <Section key={'multi' + multiIndex}
                                                                                       title={amount}
                                                                                       icon={`data/RooFishS${multiIndex}.png`}
                                                                                       value={multi !== '1'
                                                                                         ? `${multi}x`
                                                                                         : ''}/>)}
          </CardTitleAndValue>
        </Stack>
        <Stack>
          <Typography variant={'h5'} mb={1}>Reset bonuses</Typography>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            {kangaroo?.resetBonuses.map(({ desc, level }, index) => {
              return <ResetCard key={'reset' + index}
                                level={level}
                                desc={cleanUnderscore(desc)}
                                icon={`data/RooReset${index}.png`}/>
            })}
          </Stack>
        </Stack>
        <Stack>
          <Typography variant={'h5'} mb={1}>Mega fish</Typography>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            {kangaroo?.megaFish?.map(({ description, unlocked, amount, totalBonus }, index) => {
              return <CardTitleAndValue cardSx={{ my: 1 }} value={amount > 0 ? amount : ''}
                                        tooltipTitle={cleanUnderscore(description.replace('{', totalBonus))}
                                        key={'mega' + index} icon={`data/RooMG${index}.png`}
                                        imgStyle={{ width: 32, opacity: unlocked ? 1 : .5 }} imgOnly/>
            })}
          </Stack>
        </Stack>
      </Stack>
    </Tabber>
  </>
};

const Section = ({ title, value, icon, sx, iconStyle, fontSize }) => {
  return <div style={{ ...sx }}>
    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
    <Stack direction="row" gap={1}>
      {icon ? <img style={{ objectFit: 'contain', ...iconStyle }} src={`${prefix}${icon}`} alt=""/> : null}
      <Typography sx={{ fontSize }}>{value}</Typography>
    </Stack>
  </div>
}

const ResetCard = ({ level, desc, icon }) => {
  return <Tooltip title={desc}>
    <Card>
      <CardContent>
        <Stack direction={'row'} gap={1}>
          <img style={{ objectFit: 'contain', width: 26, height: 26 }} src={`${prefix}${icon}`} alt=""/>
          <Typography>Lv. {level}</Typography>
        </Stack>
      </CardContent>
    </Card>
  </Tooltip>
}

export default Kangaroo;
