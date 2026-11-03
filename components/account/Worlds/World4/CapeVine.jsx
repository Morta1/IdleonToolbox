import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { gameTables } from '@website-data';
import { TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import styled from '@emotion/styled';
import ItemDisplay from '@components/common/ItemDisplay';
import { openItemWikiPage } from '@utility/wiki/item-page';

const BASE_STATS = gameTables.galleryBonusStats;
const GOLD = '#ffc94a';

// Same text as the vine: the total rounded up, base stats as "+12 STR", etc bonuses carry their own "%_" prefix.
// The vine skips a base stat at 0.
const bonusText = ({ name, value }) => cleanUnderscore(`+${commaNotation(Math.ceil(value))}${BASE_STATS.includes(name) ? '_' : ''}${name}`);

const CapeSlot = ({ cape, dimmed, golden, note }) => {
  const multiplierInfo = cape.capeMultiplier ? (
    <>
      <Divider sx={{ my: 1 }}/>
      <TitleAndValue title={golden ? 'Golden Vine Multiplier' : 'Cape Vine Multiplier'}
                     value={`${notateNumber(cape.capeMultiplier, 'MultiplierInfo')}x`}/>
    </>
  ) : null;
  return (
    <Tooltip title={<ItemDisplay {...cape} additionalInfo={multiplierInfo}/>}>
      <Stack
        alignItems={'center'}
        gap={0.5}
        onClick={() => openItemWikiPage(cape.rawName)}
        sx={{
          p: 1,
          borderRadius: 1,
          border: golden ? `1px solid ${GOLD}` : '1px solid transparent',
          opacity: dimmed ? 0.3 : 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
          <CapeIcon src={`${prefix}data/${cape.rawName}.png`} alt={cape.displayName || cape.rawName}/>
        </Box>
        <Typography variant={'caption'} textAlign={'center'}>
          {(cape.displayName || cape.rawName)?.replace(/_/g, ' ')}
        </Typography>
        {note ? <Typography variant={'caption'} color={golden ? GOLD : 'text.disabled'} textAlign={'center'}>{note}</Typography> : null}
      </Stack>
    </Tooltip>
  );
};

const CapeGrid = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
    {children}
  </Box>
);

const CapeVine = ({ capesUsed, capeBonuses, allCapes }) => {
  const shownBonuses = (capeBonuses || []).filter(({ name, value }) => !BASE_STATS.includes(name) || value > 0);
  const columns = [shownBonuses.filter((_, index) => index % 2 === 0), shownBonuses.filter((_, index) => index % 2 === 1)];

  return (
    <>
      {shownBonuses.length > 0 && (
        <Stack my={3}>
          <Stack direction={'row'} gap={1} alignItems={'center'} sx={{ mb: 2 }}>
            <Typography variant={'h5'}>Bonuses</Typography>
            <Tooltip
              title={'Game bug: the base stats (Weapon Power, STR, AGI, WIS, LUK, Defence) are your Hat Rack totals plus only the last cape\'s stats, so the Hat Rack\'s base stats count twice. The other bonuses add up every cape. The numbers here match the game.'}>
              <InfoIcon sx={{ fontSize: 16, opacity: 0.7 }}/>
            </Tooltip>
          </Stack>
          <Card>
            <CardContent>
              <Stack direction={'row'} gap={4} flexWrap={'wrap'}>
                {columns.map((column, columnIndex) => (
                  <Stack key={`column-${columnIndex}`} gap={1} sx={{ flex: 1, minWidth: 300 }}>
                    {column.map((bonus, index) => (
                      <React.Fragment key={bonus.name}>
                        <Typography variant={'body1'}>{bonusText(bonus)}</Typography>
                        {index < column.length - 1 && <Divider/>}
                      </React.Fragment>
                    ))}
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      {capesUsed?.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>On the vine</Typography>
          <Card>
            <CardContent>
              <CapeGrid>
                {capesUsed.map((cape) => (
                  <CapeSlot key={`vine-${cape.slot}`} cape={cape} golden={cape.golden}
                            note={cape.golden ? 'Golden Vine' : null}/>
                ))}
              </CapeGrid>
            </CardContent>
          </Card>
        </Stack>
      )}

      {allCapes?.length > 0 && (
        <Stack my={3}>
          <Typography variant={'h5'} sx={{ mb: 2 }}>All capes</Typography>
          <Card>
            <CardContent>
              <CapeGrid>
                {allCapes.map((cape) => (
                  <CapeSlot key={`cape-${cape.rawName}`} cape={cape} dimmed={!cape.isAcquired}
                            note={cape.isAcquired ? null : 'Not on the vine'}/>
                ))}
              </CapeGrid>
            </CardContent>
          </Card>
        </Stack>
      )}
    </>
  );
};

const CapeIcon = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

export default CapeVine;
