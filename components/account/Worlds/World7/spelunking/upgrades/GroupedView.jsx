import React, { Fragment } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import { cleanUnderscore, prefix, notateNumber, commaNotation } from '@utility/helpers';

const columnNames = {
  0: 'POW Upgrades', 1: 'Stamina', 2: 'Amber Gain', 3: 'Special Features',
  4: 'Tools/Weapons', 5: 'Tunnel Navigation', 6: 'Amber Bonuses', 7: 'Elixirs',
  8: 'Item Drops', 9: 'Shadow Strike', 10: 'Damage/Combat', 11: 'Elixir Rewards',
  12: 'Nova Blast', 13: 'Advanced Amber', 14: 'Grand Discoveries', 15: 'Etc', 16: 'Amber Red'
};

const GroupedView = ({ grouped, currentAmber, denominator, amberIndex, searchTerm = '' }) => {
  const isMatching = (upgrade) => {
    if (!searchTerm.trim()) return false;
    const lowerSearch = searchTerm.toLowerCase();
    return cleanUnderscore(upgrade.name).toLowerCase().includes(lowerSearch) ||
           cleanUnderscore(upgrade.description).toLowerCase().includes(lowerSearch);
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      {Object.entries(grouped).map(([groupKey, upgrades]) => (
        <Stack key={groupKey}>
          <Typography variant="h6" mb={1}>{columnNames[groupKey]}</Typography>
          <Card variant={'outlined'} sx={{ height: '100%' }}>
            <CardContent>
              {upgrades.map((u, idx) => {
                const costValue = u.cost < 1e9 ? commaNotation(u.cost / denominator) : notateNumber(u.cost / denominator, "Big");
                const matches = isMatching(u);

                return (
                  <Fragment key={u.name}>
                    <Box
                      sx={{
                        border: matches ? '2px solid' : 'none',
                        borderColor: matches ? 'primary.main' : 'transparent',
                        borderRadius: matches ? 1 : 0,
                        bgcolor: matches ? 'primary.light' : 'transparent',
                        p: matches ? 1 : 0,
                        mb: matches ? 1 : 0,
                        transition: 'all 0.2s'
                      }}
                    >
                      <Stack direction={'row'} gap={1} alignItems={'center'} sx={{ opacity: u.level > 0 ? 1 : 0.5 }}>
                        <img src={`${prefix}data/CaveShopUpg${u.originalIndex}.png`} />
                        <Stack mb={1} >
                          <Typography variant="subtitle1">{cleanUnderscore(u.name)}</Typography>
                          <Typography variant="subtitle2">Lv. {Math.max(u.level, 0)} / {u.x3}</Typography>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {cleanUnderscore(u.description)}
                      </Typography>
                      {u.cost !== undefined && u.level < u.x3 && (
                        <Stack direction={'row'} alignItems={'center'} gap={0.5} mt={.5}>
                          <img
                            src={`${prefix}data/CaveAmber${amberIndex}.png`}
                            alt=""
                            style={{ width: 16, height: 16 }}
                          />
                          <Typography variant="body2">
                            Cost: {currentAmber} / {costValue}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    {idx < upgrades.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Fragment>
                )
              })}
            </CardContent>
          </Card>
        </Stack>
      ))}
    </Box>
  )
}

export default GroupedView;

