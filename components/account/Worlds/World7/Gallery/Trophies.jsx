import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import { TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import styled from '@emotion/styled';
import ItemDisplay from '@components/common/ItemDisplay';


const podiumIconMap = {
  1: 'GalleryPod0.png',
  2: 'GalleryPod1.png',
  3: 'GalleryPod2.png',
  4: 'GalleryPod3.png'
};

const Trophies = ({ trophiesUsed, trophyBonuses, formattedTrophyBonuses, inventoryTrophies, allTrophies }) => {
  return (
    <>
      {inventoryTrophies && inventoryTrophies.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Inventory Trophies</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2
                }}
              >
                {inventoryTrophies.map((trophy, index) => {
                  const inventoryMultiplierInfo = trophy.inventoryMultiplier ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <TitleAndValue
                        title={'Inventory Multiplier'}
                        value={`${notateNumber(trophy.inventoryMultiplier, 'MultiplierInfo')}x`}
                      />
                    </>
                  ) : null;

                  const trophySlot = (
                    <Stack
                      alignItems={'center'}
                      gap={0.5}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
                        <TrophyIcon
                          src={`${prefix}data/${trophy.rawName}.png`}
                          alt={trophy.displayName || trophy.rawName}
                        />
                      </Box>
                      <Typography variant={'caption'} textAlign={'center'}>
                        {(trophy.displayName || trophy.rawName)?.replace(/_/g, ' ')}
                      </Typography>
                    </Stack>
                  );

                  return (
                    <Tooltip
                      key={`inventory-trophy-${trophy.rawName}-${trophy.inventoryIndex}-${index}`}
                      title={<ItemDisplay {...trophy} additionalInfo={inventoryMultiplierInfo} />}
                    >
                      {trophySlot}
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {trophiesUsed && trophiesUsed.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Podium Trophies</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2
                }}
              >
                {trophiesUsed.map((trophy, index) => {
                  const podiumIcon = podiumIconMap[trophy.podiumLevel];
                  const podiumMultiplierInfo = trophy.podiumMultiplier ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <TitleAndValue
                        title={'Podium Multiplier'}
                        value={`${notateNumber(trophy.podiumMultiplier, 'MultiplierInfo')}x`}
                      />
                    </>
                  ) : null;

                  const trophySlot = (
                    <Stack
                      alignItems={'center'}
                      gap={0.5}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {podiumIcon && (
                          <Box
                            component="img"
                            src={`${prefix}data/${podiumIcon}`}
                            alt={trophy.isEmpty ? `Empty Podium Level ${trophy.podiumLevel}` : `Podium Level ${trophy.podiumLevel}`}
                            sx={{
                              width: 48,
                              height: 48,
                              ...(trophy.isEmpty ? {} : { position: 'absolute', bottom: 0, zIndex: 0 })
                            }}
                          />
                        )}
                        {!trophy.isEmpty && (
                          <Box sx={{ position: 'relative', zIndex: 1, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrophyIcon
                              src={`${prefix}data/${trophy.rawName}.png`}
                              alt={trophy.displayName || trophy.rawName}
                            />
                          </Box>
                        )}
                      </Box>
                      <Typography variant={'caption'} textAlign={'center'} {...(trophy.isEmpty ? { color: 'text.secondary' } : {})}>
                        {trophy.isEmpty ? 'Empty' : (trophy.displayName || trophy.rawName)?.replace(/_/g, ' ')}
                      </Typography>
                    </Stack>
                  );

                  return trophy.isEmpty ? (
                    <React.Fragment key={`empty-trophy-${trophy.trophyIndex}-${index}`}>
                      {trophySlot}
                    </React.Fragment>
                  ) : (
                    <Tooltip
                      key={`trophy-${trophy.rawName}-${index}`}
                      title={<ItemDisplay {...trophy} additionalInfo={podiumMultiplierInfo} />}
                    >
                      {trophySlot}
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

{allTrophies && allTrophies.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>All Trophies</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2
                }}
              >
                {allTrophies.map((trophy, index) => {
                  const multiplierInfo = trophy.isAcquired ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      {trophy.podiumMultiplier ? (
                        <TitleAndValue
                          title={'Podium Multiplier'}
                          value={`${notateNumber(trophy.podiumMultiplier, 'MultiplierInfo')}x`}
                        />
                      ) : trophy.inventoryMultiplier ? (
                        <TitleAndValue
                          title={'Inventory Multiplier'}
                          value={`${notateNumber(trophy.inventoryMultiplier, 'MultiplierInfo')}x`}
                        />
                      ) : null}
                    </>
                  ) : null;

                  const handleClick = () => {
                    let itemName = (trophy.displayName || trophy.rawName || '').replace(/ /g, '_');
                    window.open(`https://idleon.wiki/wiki/${itemName}`, '_blank');
                  };

                  const trophySlot = (
                    <Stack
                      alignItems={'center'}
                      gap={0.5}
                      onClick={handleClick}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        opacity: trophy.isAcquired ? 1 : 0.3,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
                        <TrophyIcon
                          src={`${prefix}data/${trophy.rawName}.png`}
                          alt={trophy.displayName || trophy.rawName}
                        />
                      </Box>
                      <Typography variant={'caption'} textAlign={'center'}>
                        {(trophy.displayName || trophy.rawName)?.replace(/_/g, ' ')}
                      </Typography>
                      {!trophy.isAcquired && (
                        <Typography variant={'caption'} color={'text.disabled'} textAlign={'center'}>
                          Not Acquired
                        </Typography>
                      )}
                    </Stack>
                  );

                  return (
                    <Tooltip
                      key={`all-trophy-${trophy.rawName}-${index}`}
                      title={<ItemDisplay {...trophy} additionalInfo={multiplierInfo} />}
                    >
                      {trophySlot}
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}


      {trophyBonuses && trophyBonuses.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>Bonuses</Typography>
          <Card>
            <CardContent>
              <Stack direction={'row'} gap={4} flexWrap={'wrap'}>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedTrophyBonuses.leftColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedTrophyBonuses.leftColumn.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Stack>
                <Stack gap={1} sx={{ flex: 1, minWidth: 300 }}>
                  {formattedTrophyBonuses.rightColumn.map(({ bonusText, key }, index) => (
                    <React.Fragment key={key}>
                      <Typography variant={'body1'}>
                        {bonusText}
                      </Typography>
                      {index < formattedTrophyBonuses.rightColumn.length - 1 && <Divider />}
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

const TrophyIcon = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

export default Trophies;

