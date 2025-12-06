import React, { useMemo } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import { TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import styled from '@emotion/styled';
import ItemDisplay from '@components/common/ItemDisplay';

const HatRack = ({ hatsUsed, hatBonuses, totalHats, bonusMulti, allPremiumHelmets }) => {
  const formattedHatBonuses = useMemo(() => {
    const leftColumn = [];
    const rightColumn = [];

    (hatBonuses || []).forEach(({ name, value }, index) => {
      const formattedValue = notateNumber(value, 'MultiplierInfo');

      const bonusName = name.replace(/_/g, ' ');
      const isPercentage = bonusName && (
        bonusName.toLowerCase().includes('multi') ||
        bonusName.toLowerCase().includes('chance') ||
        bonusName.toLowerCase().includes('gain') ||
        bonusName.toLowerCase().includes('exp') ||
        bonusName.toLowerCase().includes('money')
      );

      const displayValue = isPercentage ? `${formattedValue}%` : formattedValue;
      const bonusText = `+${displayValue} ${bonusName}`;

      if (index % 2 === 0) {
        leftColumn.push({ bonusText, key: `bonus-${index}` });
      } else {
        rightColumn.push({ bonusText, key: `bonus-${index}` });
      }
    });

    return { leftColumn, rightColumn };
  }, [hatBonuses]);

  return (
    <>
      {allPremiumHelmets && allPremiumHelmets.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Premium Helmets</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2
                }}
              >
                {allPremiumHelmets.map((hat, index) => {
                  const hatMultiplierInfo = hat.isAcquired && hat.hatMultiplier ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <TitleAndValue
                        title={'Hat Rack Multiplier'}
                        value={`${notateNumber(hat.hatMultiplier, 'MultiplierInfo')}x`}
                      />
                    </>
                  ) : null;

                  const handleClick = () => {
                    let itemName = (hat.displayName || hat.rawName || '').replace(/ /g, '_');
                    if (itemName === 'Snowman' && hat.Type) {
                      itemName += `_(${String(hat.Type).toLowerCase().capitalizeAll()})`;
                    }
                    window.open(`https://idleon.wiki/wiki/${itemName}`, '_blank');
                  };

                  const hatSlot = (
                    <Stack
                      alignItems={'center'}
                      gap={0.5}
                      onClick={handleClick}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        opacity: hat.isAcquired ? 1 : 0.3,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
                        <HatIcon
                          src={`${prefix}data/${hat.rawName}.png`}
                          alt={hat.displayName || hat.rawName}
                        />
                      </Box>
                      <Typography variant={'caption'} textAlign={'center'}>
                        {(hat.displayName || hat.rawName)?.replace(/_/g, ' ')}
                      </Typography>
                      {!hat.isAcquired && (
                        <Typography variant={'caption'} color={'text.disabled'} textAlign={'center'}>
                          Not Acquired
                        </Typography>
                      )}
                    </Stack>
                  );

                  return (
                    <Tooltip
                      key={`hat-${hat.rawName}-${index}`}
                      title={<ItemDisplay {...hat} additionalInfo={hatMultiplierInfo} />}
                    >
                      {hatSlot}
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {hatBonuses && hatBonuses.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Bonuses</Typography>
          <Card>
            <CardContent>
              <Stack direction={'row'} gap={4} flexWrap={'wrap'}>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedHatBonuses.leftColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedHatBonuses.leftColumn.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Stack>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedHatBonuses.rightColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedHatBonuses.rightColumn.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </>
  );
};

const HatIcon = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

export default HatRack;

