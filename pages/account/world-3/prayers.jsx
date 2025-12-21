import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, round } from 'utility/helpers';
import styled from '@emotion/styled';
import { NextSeo } from 'next-seo';
import { calcPrayerCost } from '../../../parsers/prayers';
import Tooltip from 'components/Tooltip';

const Prayers = () => {
  const { state } = useContext(AppContext);
  const { prayers } = state?.account;
  const { characters } = state;

  const calcCostToMax = (prayer) => {
    let costToMax = 0;
    for (let i = prayer?.level; i < prayer?.maxLevel; i++) {
      costToMax += calcPrayerCost({ ...prayer, level: i });
    }
    return costToMax ?? 0;
  }

  return (
    <div>
      <NextSeo
        title="Prayers | Idleon Toolbox"
        description="Prayers information"
      />
      <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
        {prayers?.map((prayer, index) => {
          const {
            name,
            x1,
            x2,
            level,
            prayerIndex,
            effect,
            curse,
            soul,
            maxLevel,
            totalAmount,
            unlockWave,
            unlockZone
          } = prayer
          const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
          const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
          const cost = calcPrayerCost(prayer);
          const charactersWithPrayer = characters?.filter((character) =>
            character?.activePrayers?.some((prayer) => prayer?.prayerIndex === prayerIndex)
          ) || [];
          return <Card key={name + index} sx={{ width: 300, display: 'flex', opacity: level === 0 ? .5 : 1,
            outline: level >= maxLevel ? '1px solid' : '',
            outlineColor: (theme) => level >= maxLevel
              ? theme.palette.success.light
              : ''
          }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <Stack direction={'row'} alignItems={'center'} gap={2} mb={2}>
                <Stack alignItems={'center'}>
                  <PrayerIcon src={`${prefix}data/Prayer${prayerIndex}.png`} alt="prayer-icon"/>
                  <Typography fontWeight={'bold'}>Lv.{level}</Typography>
                </Stack>
                <Typography variant={'h6'}>{cleanUnderscore(name)}</Typography>
              </Stack>
              <Stack>
                <div><Typography
                  sx={{ color: 'success.light' }}>Bonus:</Typography> {cleanUnderscore(effect).replace('{', calculatedBonus)}
                </div>
                <div><Typography
                  sx={{ color: 'error.light' }}>Curse:</Typography> {cleanUnderscore(curse).replace('{', calculatedCurse)}
                </div>
              </Stack>
              <Typography mt={1}>Unlock: lv. {unlockWave} at {unlockZone}</Typography>
              <Stack mt={3} direction={'row'} alignItems={'center'} gap={2}>
                <ItemIcon src={`${prefix}data/${soul}.png`} alt="soul-icon"/>
                {maxLevel === level ? <Typography sx={{ color: 'success.main' }}>Maxed</Typography> : <div>
                  <div>Cost: <Typography component={'span'}
                                         sx={{ color: level === 0 ? '' : cost <= totalAmount ? 'success.light' : 'error.light' }}>
                    {notateNumber(round(cost), 2)}</Typography> ({notateNumber(totalAmount, 2)})
                  </div>
                  <div>Cost To Max: {notateNumber(round(calcCostToMax(prayer)))}</div>
                </div>}
              </Stack>
              {charactersWithPrayer?.length > 0 ? (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                    {charactersWithPrayer.map((character) => (
                      <Tooltip
                        key={character.name}
                        title={
                          <CharacterPrayerDetails
                            name={character.name}
                            activePrayers={character.activePrayers}
                          />
                        }
                      >
                        <CharacterIcon
                          src={`${prefix}data/ClassIcons${character.classIndex}.png`}
                          alt={character.name}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                </>
              ) : null}
            </CardContent>
          </Card>
        })}
      </Stack>
    </div>
  );
};

const PrayerIcon = styled.img`
  width: 36px;
  height: 36px;
`

const ItemIcon = styled.img`
  width: 36px;
  height: 36px;
`

const CharacterIcon = styled.img`
  width: 32px;
  height: 32px;
  cursor: pointer;
  &:hover {
    transform: scale(1.1);
  }
`

const CharacterPrayerDetails = ({ name, activePrayers }) => {
  return (
    <>
      <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Equipped Prayers:</Typography>
      {activePrayers?.map((prayer) => (
        <Typography key={prayer?.name} variant="body2">
          • {cleanUnderscore(prayer?.name)} (Lv. {prayer?.level})
        </Typography>
      ))}
    </>
  );
}

export default Prayers;
