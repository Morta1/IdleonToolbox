import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import { TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import styled from '@emotion/styled';
import ItemDisplay from '@components/common/ItemDisplay';

const Nametags = ({ nametagsUsed, nametagBonuses, formattedNametagBonuses }) => {
  return (
    <>
      {nametagsUsed && nametagsUsed.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Nametags</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2
                }}
              >
                {nametagsUsed.map((nametag, index) => {
                  const nametagMultiplierInfo = nametag.nametagMultiplier ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <TitleAndValue
                        title={'Level Multiplier'}
                        value={`${notateNumber(nametag.nametagMultiplier, 'MultiplierInfo')}x`}
                      />
                    </>
                  ) : null;

                  return (
                    <Tooltip
                      key={`nametag-${nametag.rawName}-${index}`}
                      title={<ItemDisplay {...nametag} additionalInfo={nametagMultiplierInfo} />}
                    >
                      <Stack
                        alignItems={'center'}
                        gap={1}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                          <NametagIcon
                            src={`${prefix}data/${nametag.rawName}.png`}
                            alt={nametag.displayName || nametag.rawName}
                          />
                          {nametag.level && (
                            <Typography >
                              Lv. {nametag.level}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant={'caption'} textAlign={'center'}>
                          {(nametag.displayName || nametag.rawName)?.replace(/_/g, ' ')}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {nametagBonuses && nametagBonuses.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Bonuses</Typography>
          <Card>
            <CardContent>
              <Stack direction={'row'} gap={4} flexWrap={'wrap'}>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedNametagBonuses.leftColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedNametagBonuses.leftColumn.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Stack>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedNametagBonuses.rightColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedNametagBonuses.rightColumn.length - 1 && <Divider />}
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

const NametagIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

export default Nametags;

