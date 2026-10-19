import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const Upgrades = ({ upgrades, account }) => {
  const doublersOwned = account?.menagerie?.doublers?.minehead?.owned ?? 0;
  if (!upgrades || upgrades.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {upgrades.map((upgrade) => {
        const { index, name, level, maxLevel, isMaxed, researchLvReq, isLocked, cost, canAfford, description, doubled, doublerEligible, doubledDescription } = upgrade;

        return (
          <Card
            key={index}
            variant={'outlined'}
            sx={{ opacity: isLocked ? 0.5 : 1 }}
          >
            <CardContent>
              <Stack gap={1.5}>
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <img
                    src={`${prefix}data/MineUpg${index}.png`}
                    alt={name}
                    style={{ width: 48, height: 48 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Stack flex={1}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {cleanUnderscore(name)}
                      </Typography>
                    </Stack>
                    <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                      <Typography variant="body2" color="text.secondary">
                        {isMaxed ? 'MAX LV' : `Lv. ${level} / ${maxLevel}`}
                      </Typography>
                      <DoublerTag kind={'minehead'} doubled={doubled} eligible={doublerEligible} owned={doublersOwned}/>
                    </Stack>
                    {isLocked && (
                      <Typography variant="caption" color="text.secondary">
                        Research Lv. {researchLvReq} required
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                {description && (
                  <Typography variant="body2">
                    {description}
                  </Typography>
                )}
                <DoubledPreview description={description} doubledDescription={doubledDescription} owned={doublersOwned}/>

                {!isMaxed && (
                  <Typography variant="body2" color={canAfford ? 'text.primary' : 'error'}>
                    Cost: {notateNumber(cost, 'Big')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Upgrades;
