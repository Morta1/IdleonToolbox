import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber } from '@utility/helpers';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const CookingMastery = ({ cookingMastery }) => {
  if (!cookingMastery) {
    return <Typography sx={{ mt: 3 }}>Cooking Mastery is unlocked via Rift 61.</Typography>;
  }

  const {
    level,
    exp,
    expReq,
    expRate,
    rank,
    points,
    categories,
    expRateBreakdown
  } = cookingMastery;

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mt={3} mb={1} alignItems={'stretch'}>
      <CardTitleAndValue title={'Mastery level'} value={level}/>
      <CardTitleAndValue title={'EXP'} value={`${notateNumber(exp, 'Big')} / ${notateNumber(expReq, 'Big')}`}/>
      <CardTitleAndValue title={'EXP / hr'}>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <Typography component={'div'}>{notateNumber(expRate, 'Big')} / hr</Typography>
          <Breakdown data={expRateBreakdown}>
            <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue
        title={'Rank'}
        value={rank}
      />
      <CardTitleAndValue
        title={'Purple points'}
        value={`${points?.categorySpent ?? 0} / ${(points?.categorySpent ?? 0) + (points?.categoryLeft ?? 0)}`}
      />
      <CardTitleAndValue
        title={'Yellow points'}
        value={`${points?.nodeSpent ?? 0} / ${(points?.nodeSpent ?? 0) + (points?.nodeLeft ?? 0)}`}
      />
    </Stack>

    <Stack sx={{ mt: 2 }} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'stretch'}>
      {categories?.map((category) => {
        const locked = !category?.unlocked;
        return <Card key={`category-${category?.index}`}
                     sx={{ width: 280, opacity: locked ? .45 : 1, display: 'flex' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
              <Typography fontWeight={'bold'}>
                {cleanUnderscore(category?.name?.toLowerCase?.()?.capitalize?.() ?? category?.name)}
              </Typography>
              <Typography variant={'body2'}>Lv. {category?.points}</Typography>
            </Stack>
            <Typography variant={'caption'} color={'text.secondary'}>
              {locked ? `Unlocks at Cooking Mastery Lv. ${category?.unlockLevel}` : category?.label}
            </Typography>
            {category?.index === 0 ? (
              <Typography variant={'body2'} sx={{ color: 'success.light', fontWeight: 'bold' }}>
                {notateNumber(expRate, 'Big')}/hr total EXP rate
              </Typography>
            ) : null}
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'body2'} sx={{ mb: 1 }}>
              {category?.description}
            </Typography>
            <Stack gap={0.5} sx={{ mt: 'auto' }}>
              <TitleAndValue
                title={category?.isExpBoost ? 'Total bonus' : 'Total chance'}
                value={`+${commaNotation(category?.bonusAmount)}%${category?.isExpBoost ? ' EXP' : ''}`}
              />
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Stack>
  </>;
};

export default CookingMastery;
