import { Card, CardContent, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React, { useContext } from 'react';

const formatStickerDescription = (desc, bonus) => {
  if (!desc) return '';
  const bonusRounded = Math.round(bonus * 10) / 10;
  const multStr = notateNumber(1 + bonus / 100, 'MultiplierInfo').replace(/#/g, '');
  return cleanUnderscore(
    desc
      .split('{').join(commaNotation(bonusRounded))
      .split('}').join(multStr)
  );
};

const formatOdds = (odds) => {
  if (!odds || odds <= 0) return 'N/A';
  const oneIn = 1 / odds;
  return oneIn < 1e7
    ? '1 in ' + commaNotation(Math.round(oneIn))
    : '1 in ' + notateNumber(oneIn, 'Big');
};

const Stickers = () => {
  const { state } = useContext(AppContext);
  const { stickers = [], totalStickers = 0, dmgMulti = 1, stickersUnlocked } = state?.account?.farming || {};

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
      <CardTitleAndValue title={'Total Stickers'} value={totalStickers}/>
      {dmgMulti > 1
        ? <CardTitleAndValue title={'DMG Multi'}
                             value={`${notateNumber(dmgMulti, 'MultiplierInfo').replace(/#/g, '')}x`}/>
        : null}
    </Stack>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {stickers.map(({ name, description, count, bonus, odds }, index) => (
        <Card key={name} sx={{ width: 280, opacity: count > 0 ? 1 : 0.5 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2} mb={1}>
              <img src={`${prefix}data/FarmStickerB${index}.png`} width={48} alt={''}/>
              <Stack>
                <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
                <Typography variant={'body2'}>Found: {count}</Typography>
              </Stack>
            </Stack>
            <Typography variant={'body2'} mb={1}>{formatStickerDescription(description, bonus)}</Typography>
            <Typography variant={'body2'}>Chance: {formatOdds(odds)}</Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  </>;
};

export default Stickers;
