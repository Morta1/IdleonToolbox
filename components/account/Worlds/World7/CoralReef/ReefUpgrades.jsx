import Tooltip from '@components/Tooltip';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { IconCircleCheckFilled, IconCircleXFilled, IconInfoCircleFilled } from '@tabler/icons-react';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';


const reefImageMap = ['z', 'A', 'B', 'C', 'D', 'E'];

const ReefUpgrades = ({ reefUpgrades }) => {
  const renderExtraDataTooltip = (items) => (
    <Stack spacing={0.75}>
      {items?.map((item, idx) => {
        const unlocked = item?.unlocked;
        const name = cleanUnderscore(item?.name || item?.description || `Entry ${idx + 1}`);
        const bonus = item?.description?.includes('{')
          ? item?.value ?? (item?.level * item?.modifier)
          : notateNumber(1 + (item?.value ?? (item?.level * item?.modifier)) / 100, 'MultiplierInfo')

        return (
          <Stack key={`${name}-${idx}`}>
            <Stack direction="row" spacing={1} alignItems="center">
              {unlocked ? <IconCircleCheckFilled size={16} color="#16a34a" /> : <IconCircleXFilled size={16} color="#9ca3af" />}
              <Typography variant="body2" color={unlocked ? 'text.primary' : 'text.disabled'}>
                {name}
              </Typography>
            </Stack>

            <Typography variant="body2" color={'text.secondary'}>
              {cleanUnderscore(item?.description?.replace(/}|{/g, bonus))}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );

  if (!reefUpgrades || reefUpgrades.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Reef Upgrades</Typography>
        <Typography variant="body2" color="text.secondary">No reef upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {reefUpgrades.map((reef, index) => {
          const imageName = reefImageMap[index] || 'A';
          const hasExtraData = Array.isArray(reef?.extraData) && reef.extraData.length > 0;
          return (
            <Card key={index} variant={'outlined'} sx={{ opacity: reef.level > 0 ? 1 : 0.6, height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
                    <img
                      src={`${prefix}data/Reef${imageName}1.png`}
                      alt={cleanUnderscore(reef.name)}
                      style={{ width: 40, height: 40 }}
                    />
                    <Stack flex={1} minWidth={0}>
                      <Typography variant="subtitle1" >
                        {cleanUnderscore(reef.description)}
                      </Typography>
                    </Stack>
                    {hasExtraData && (
                      <Tooltip  title={renderExtraDataTooltip(reef.extraData)}>
                        <span>
                          <IconInfoCircleFilled size={18} />
                        </span>
                      </Tooltip>
                    )}
                  </Stack>

                  <Divider sx={{ my: 0.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Level:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                      >
                        {reef.level || 0} / {reef.x1 || 0}
                      </Typography>
                    </Stack>
                  </Stack>

                  {reef.cost !== undefined && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <Stack spacing={0.75}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Cost:
                          </Typography>
                          {reef?.level < reef?.x1 ? <Typography variant="body2" component="span">
                            {notateNumber(reef.cost, "Big")}
                          </Typography> : <Typography variant="body2" component="span">
                            Maxed
                          </Typography>}
                        </Stack>
                      </Stack>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReefUpgrades;

