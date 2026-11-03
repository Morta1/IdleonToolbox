import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import { TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import styled from '@emotion/styled';
import ItemDisplay from '@components/common/ItemDisplay';
import Panel from '@components/common/cards/Panel';
import { openItemWikiPage } from '@utility/wiki/item-page';

const Nametags = ({ nametagsUsed, bonusRows, allNametags }) => {
  return (
    <>
      {allNametags && allNametags.length > 0 && (
        <Stack my={3}>
          <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 2 }}>All Nametags</Typography>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 2
                }}
              >
                {allNametags.map((nametag, index) => {
                  const nametagMultiplierInfo = nametag.isAcquired && nametag.nametagMultiplier ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <TitleAndValue
                        title={'Level Multiplier'}
                        value={`${notateNumber(nametag.nametagMultiplier, 'MultiplierInfo')}x`}
                      />
                    </>
                  ) : null;

                  const handleClick = () => openItemWikiPage(nametag.rawName);

                  return (
                    <Tooltip
                      key={`all-nametag-${nametag.rawName}-${index}`}
                      title={<ItemDisplay {...nametag} additionalInfo={nametagMultiplierInfo} />}
                    >
                      <Stack
                        alignItems={'center'}
                        gap={1}
                        onClick={handleClick}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          opacity: nametag.isAcquired ? 1 : 0.3,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                          <NametagIcon
                            src={`${prefix}data/${nametag.rawName}.png`}
                            alt={nametag.displayName || nametag.rawName}
                          />
                          {nametag.level && (
                            <Typography>
                              Lv. {nametag.level}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant={'caption'} textAlign={'center'}>
                          {(nametag.displayName || nametag.rawName)?.replace(/_/g, ' ')}
                        </Typography>
                        {!nametag.isAcquired && (
                          <Typography variant={'caption'} color={'text.muted'} textAlign={'center'}>
                            Not Acquired
                          </Typography>
                        )}
                      </Stack>
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* A guest has no bonus: no Panel, no heading */}
      {bonusRows?.length ? <Panel title={'Bonuses'} sx={{ my: 3 }}>
        {bonusRows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
      </Panel> : null}
    </>
  );
};

const NametagIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

export default Nametags;

