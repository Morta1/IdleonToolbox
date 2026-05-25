import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { ninjaExtraInfo } from '@website-data';

const doorMaxHps = ninjaExtraInfo?.[3];
const getActivityIcon = (activityInfo, weaponType, hasDoor) => {
  if (activityInfo < 0) {
    return 'KO'
  } else if (activityInfo !== 0) {
    if (weaponType === 1 && hasDoor) {
      return 'Breaching'
    } else if (weaponType === 0) {
      return 'Untying'
    } else {
      return 'Sneaking';
    }
  }
  return 'Tied';
}
const PlayersInventory = ({ players, characters, account, dropList, inventory, doorsCurrentHp }) => {
  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ maxWidth: 1280 }}>
      {players?.map(({ equipment, floor, activityInfo }, playerIndex) => {
        // const jade = getJadeRate(characters[playerIndex], account);
        const weaponType = equipment?.[1]?.rawName !== 'Blank' && equipment?.[1]?.type;
        const doorHp = (doorMaxHps?.[floor] - doorsCurrentHp?.[floor]);
        const hasDoor = doorHp > 0;
        const activityIcon = getActivityIcon(activityInfo, weaponType, hasDoor);
        return <Stack direction={'row'} key={'player-' + playerIndex} gap={1} flexWrap={'wrap'}>
          <Card sx={{ width: 200 }}>
            <CardContent sx={{ '&:last-child': { pb: 2 } }}>
              <Stack gap={1}>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                  <Typography variant={'body2'} fontWeight={600} noWrap>
                    {characters?.[playerIndex]?.name}
                  </Typography>
                  <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                    <img width={20} src={`${prefix}data/ClassIcons58.png`} alt={''} />
                    <Typography variant={'body2'}>{characters?.[playerIndex]?.skillsInfo?.sneaking?.level}</Typography>
                  </Stack>
                </Stack>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <Tooltip title={activityIcon}>
                    <img style={{ objectFit: 'contain' }} width={28} height={28}
                      src={`${prefix}etc/${activityIcon}_Ninja.png`} alt={''} />
                  </Tooltip>
                  <Stack>
                    <Typography variant={'caption'} sx={{ lineHeight: 1.1 }}>Floor {floor + 1}</Typography>
                    <Typography variant={'caption'} color={'text.secondary'} sx={{ lineHeight: 1.1 }}>
                      {activityIcon}
                    </Typography>
                  </Stack>
                </Stack>
                {hasDoor ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <img width={20} src={`${prefix}data/NjD${floor}.png`} alt={''} />
                  <Typography variant={'caption'}>
                    {notateNumber(doorHp, 'Big')} / {notateNumber(doorMaxHps?.[floor], 'Big')}
                  </Typography>
                </Stack> : null}
                <Stack direction={'row'} gap={0.5} flexWrap={'wrap'}>
                  {dropList?.[floor - 1]?.map(({ rawName, description, value, type, subType }, index) => type !== 0 ?
                    <Tooltip
                      title={cleanUnderscore(getDescription({ description, value, type, subType }))}
                      key={`droplist-${rawName}-${index}`}>
                      <img width={22} src={`${prefix}data/${rawName}.png`} alt={''} />
                    </Tooltip> : null)}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          {equipment?.map((item, itemIndex) => {
            const { description, value, type, subType, name, symbolLevel } = item;
            const updatedDescription = getDescription({ description, value, type, subType });
            return <Card key={itemIndex + name}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100, position: 'relative' }}>
              <CardContent>
                {symbolLevel > 0 ? <img style={{ position: 'absolute', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 70, height: 80 }} src={`${prefix}data/NjBorderS${symbolLevel}.png`} alt={''} /> : null}
                <Item {...item} description={updatedDescription} />
              </CardContent>
            </Card>

          })}
        </Stack>
      })}
    </Stack>
    <h4>Inventory</h4>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} sx={{ maxWidth: (70 * 13) + (8 * 13) }}>
      {inventory?.map((item, index) => {
        const { rawName, description, value, type, subType, symbolLevel } = item;
        const updatedDescription = getDescription({ description, value, type, subType });
        return <Card key={'inventory-' + rawName + index} sx={{ width: 70, height: 80, position: 'relative' }}>
          <CardContent>
            {symbolLevel > 0 ? <img style={{ position: 'absolute', zIndex: 1, top: 0, left: 0, width: 70, height: 80, }} src={`${prefix}data/NjBorderS${symbolLevel}.png`} alt={''} /> : null}
            <Item {...item} description={updatedDescription} />
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const Item = ({ level, description, name, rawName }) => {
  return <Stack alignItems={'center'} sx={{ position: 'relative' }}>
    {level
      ? <Typography textAlign={'center'} sx={{ minWidth: 40, zIndex: 2 }}
        variant={'caption'}>{numberWithCommas(level)}</Typography>
      : null}
    <Tooltip title={description === '0' || name === 'Nothing' ? '' : cleanUnderscore(description)}>
      <img width={32} style={{ zIndex: 2 }} src={`${prefix}data/${rawName}.png`} alt={''} />
    </Tooltip>
  </Stack>
}

const getDescription = ({ description, value = 0, type, subType }) => {
  let desc;
  desc = description?.replace(/{/g, value >= 0
    ? notateNumber(value, 'Big')
    : 0).replace(/}/g, notateNumber(1 + value / 100, 'MultiplierInfo'));
  if (type === 1) {
    if (subType === 1) {
      desc = `${description} Base damage: ${notateNumber(value)}`
    } else {
      desc = `${description} Base rate: ${notateNumber(value)}%`
    }
  }
  return desc;
}
export default PlayersInventory;
