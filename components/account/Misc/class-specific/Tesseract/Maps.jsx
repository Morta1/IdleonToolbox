import {
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Select,
  MenuItem
} from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React, { useMemo, useState } from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { tachyonNames } from '@parsers/tesseract';
import {
  getMaps,
  getRingBaseStats,
  getWeaponBaseStats
} from '@parsers/tesseract';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Portals = ({ character, account, characters }) => {
  const [CheckboxEl, hideUnlockedMaps] = useCheckbox('Hide unlocked maps');
  const [selectedTachyon, setSelectedTachyon] = useState('all');

  const maps = useMemo(() => getMaps(account, characters, character), [account, character]);

  const {
    weaponDropChance,
    ringDropChance,
    weaponQuality,
    ringQuality
  } = account?.tesseract || {};

  return (
    <>
      {/* Header controls */}
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue
          title="Tachyon Type"
          value={
            <Select
              size="small"
              value={selectedTachyon}
              onChange={(e) => setSelectedTachyon(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All</MenuItem>
              {Object.entries(tachyonNames).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <img
                      style={{ width: 24, height: 24, objectPosition: '0 -6px' }}
                      src={`${prefix}data/Tach${value}_x1.png`}
                    />
                    {label}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          }
        />
        <CardTitleAndValue title="" value={<CheckboxEl />} />       

        <CardTitleAndValue
          title="Weapon Drop Chance"
          value={`1 in ${Math.floor(1 / weaponDropChance)}`}
          icon="data/EquipmentWandsArc0.png"
          imgStyle={{ width: 24, height: 24 }}
        />

        <ItemBase
          weapon
          title="Weapon Quality"
          quality={weaponQuality}
          stats={getWeaponBaseStats(weaponQuality)}
          icon="data/EquipmentWandsArc0"
        />

        <CardTitleAndValue
          title="Ring Drop Chance"
          value={`1 in ${Math.floor(1 / ringDropChance)}`}
          icon="data/EquipmentRingsArc0.png"
          imgStyle={{ width: 24, height: 24 }}
        />

        <ItemBase
          title="Ring Quality"
          quality={ringQuality}
          stats={getRingBaseStats(ringQuality)}
          icon="data/EquipmentRingsArc0"
        />
      </Stack>

      {/* Maps */}
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {maps?.map((map, index) => {
          const {
            mapName,
            reqKills,
            monster,
            unlocked,
            tachyonQuantity,
            tachyonType,
            mapBonuses,
            timeLeft
          } = map;

          if (hideUnlockedMaps && unlocked) return null;
          if (selectedTachyon !== 'all' && tachyonType !== parseInt(selectedTachyon)) return null;

          return (
            <Card key={mapName + index}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 350,
                  opacity: unlocked ? 1 : 0.5
                }}
              >
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ position: 'relative' }}
                >
                  <img
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain',
                      marginTop: -8,
                      marginRight: 4
                    }}
                    src={`${prefix}data/Mface${monster.MonsterFace}.png`}
                    alt=""
                  />

                  <Typography>{cleanUnderscore(mapName)}</Typography>

                  <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
                    <Typography variant="body1">
                      {numberWithCommas(Math.floor(tachyonQuantity))}
                    </Typography>
                    <img
                      style={{ width: 32, height: 32, marginTop: -8 }}
                      src={`${prefix}data/Tach${tachyonType}_x1.png`}
                      alt=""
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" gap={1} justifyContent="space-between">
                  <Stack>
                    <Typography>Charge kill req: {reqKills}</Typography>
                    <Typography>Time left: {timeLeft}s</Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" gap={2}>
                    {mapBonuses.map(({ value, killsToNext, type }, i) => (
                      <Stack key={mapName + 'portal' + i} alignItems="center">
                        <Tooltip
                          title={
                            killsToNext
                              ? `Increases in ${killsToNext} kills`
                              : ''
                          }
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              borderBottom: '1px dotted',
                              lineHeight: 1,
                              mb: 0.5
                            }}
                          >
                            {type}
                          </Typography>
                        </Tooltip>

                        <Stack alignItems="center">
                          <img src={`${prefix}data/StatusArc${i}.png`} alt="" />
                          <Typography variant="body2">
                            {Math.floor(1000 * (1 + value / 100)) / 1000}
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};

const ItemBase = ({ title, icon, quality, stats }) => {
  return (
    <CardTitleAndValue title={title}>
      <Stack direction="row" alignItems="center" gap={1}>
        <img style={{ width: 24, height: 24 }} src={`${prefix}${icon}.png`} alt="" />
        <Typography>{quality}</Typography>

        <Tooltip
          title={
            <Stack>
              {stats?.map(({ title, name, min, max }, index) =>
                title ? (
                  <Stack key={`${title}-${index}`}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
                    <Divider sx={{ my: 1 }} />
                  </Stack>
                ) : (
                  <TitleAndValue
                    key={`${name}-${index}`}
                    title={name}
                    titleStyle={{ width: 150 }}
                    value={`${min
                      .toFixed(2)
                      .replace('.00', '')} - ${max
                      .toFixed(2)
                      .replace('.00', '')}`}
                  />
                )
              )}
            </Stack>
          }
        >
          <IconInfoCircleFilled size={18} />
        </Tooltip>
      </Stack>
    </CardTitleAndValue>
  );
};

export default Portals;
