import { Badge, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { ninjaExtraInfo } from '../../../../../data/website-data';

const doorMaxHps = ninjaExtraInfo?.[3].split(' ');
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
          <Card sx={{ display: 'flex', alignItems: 'center', width: 200 }}>
            <CardContent>
              <Typography>{characters?.[playerIndex]?.name}</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Stack direction={'row'} gap={1}>
                  <img width={24} src={`${prefix}data/ClassIcons58.png`} alt={''}/>
                  <Typography>{characters?.[playerIndex]?.skillsInfo?.sneaking?.level}</Typography>
                </Stack>
                <Divider flexItem orientation={'vertical'}/>
                <Stack>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Tooltip title={''}>
                      <img style={{ objectFit: 'contain' }} width={24} height={24}
                           src={`${prefix}etc/${activityIcon}_Ninja.png`}
                           alt={''}/>
                    </Tooltip>
                    <Typography variant={'caption'}>Floor {floor + 1}</Typography>
                  </Stack>
                  {hasDoor ? <Stack direction={'row'} alignItems={'center'}>
                    <img width={24} src={`${prefix}data/NjD${floor}.png`} alt={''}/>
                    <Typography
                      sx={{ flexBasis: '100%' }}
                      variant={'caption'}>{notateNumber(doorHp, 'Big')} / {notateNumber(doorMaxHps?.[floor], 'Big')}</Typography>
                  </Stack> : null}
                </Stack>
              </Stack>
              <Stack mt={1} gap={1} direction={'row'}>
                {dropList?.[floor - 1]?.map(({ rawName, description, value, type, subType }, index) => type !== 0 ?
                  <Tooltip
                    title={cleanUnderscore(getDescription({ description, value, type, subType }))}
                    key={`droplist-${rawName}-${index}`}>
                    <img width={24} src={`${prefix}data/${rawName}.png`} alt={''}/>
                  </Tooltip> : null)}
              </Stack>
            </CardContent>
          </Card>
          {equipment?.map(({ name, rawName, level, description, value, type, subType }, itemIndex) => {
            description = getDescription({ description, value, type, subType })
            return <Tooltip title={description === '0' ? '' : cleanUnderscore(description)} key={itemIndex + name}>
              <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100 }}>
                <CardContent>
                  <Badge anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                         max={99999}
                         badgeContent={level ?? ' '}
                         color="primary"
                         key={itemIndex + name}>
                    <img width={32} src={`${prefix}data/${rawName}.png`} alt={''}/>
                  </Badge>
                </CardContent>
              </Card>
            </Tooltip>
          })}
        </Stack>
      })}
    </Stack>
    <h4>Inventory</h4>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} sx={{ maxWidth: (64 * 13) + (8 * 13) }}>
      {inventory?.map(({ rawName, level, description, value, type, subType }, index) => {
        description = getDescription({ description, value, type, subType });
        return <Tooltip title={description === '0' ? '' : cleanUnderscore(description)}
                        key={'inventory-' + rawName + index}>
          <Card>
            <CardContent>
              <Badge
                max={99999}
                size={'small'}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={level ?? ' '}
                color="primary">
                <img width={32} src={`${prefix}data/${rawName}.png`} alt={''}/>
              </Badge>
            </CardContent>
          </Card>
        </Tooltip>
      })}
    </Stack>
  </>
};

const getDescription = ({ description, value = 0, type, subType }) => {
  let desc;
  desc = description?.replace(/{/g, value >= 0
    ? notateNumber(value, 'Big')
    : 0).replace(/}/g, notateNumber(1 + value / 100, 'MultiplierInfo'));
  if (type === 1) {
    if (subType === 1) {
      desc = `Base damage: ${notateNumber(value)}`
    } else {
      desc = `Base rate: ${notateNumber(value)}`
    }
  }
  return desc;
}
export default PlayersInventory;
