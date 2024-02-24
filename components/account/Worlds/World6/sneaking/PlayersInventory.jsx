import { Badge, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

const PlayersInventory = ({ players, characters, dropList, inventory }) => {
  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ maxWidth: 1200 }}>
      {players.map(({ equipment, floor }, playerIndex) => {
        return <Stack direction={'row'} key={'player-' + playerIndex} gap={1} flexWrap={'wrap'}>
          <Card sx={{ display: 'flex', alignItems: 'center', width: 150 }}>
            <CardContent>
              <Typography>{characters?.[playerIndex]?.name}</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Stack direction={'row'} gap={1}>
                  <img width={24} src={`${prefix}data/ClassIcons58.png`} alt={''}/>
                  <Typography>{characters?.[playerIndex]?.skillsInfo?.sneaking?.level}</Typography>
                </Stack>
                <Divider flexItem orientation={'vertical'}/>
                <Typography variant={'caption'}>Floor {floor}</Typography>
              </Stack>
              <Stack mt={1} gap={1} direction={'row'}>
                {dropList?.[floor - 1]?.map(({ rawName, description, value, type, subType }, index) => type !== 0 ? <Tooltip
                  title={cleanUnderscore(getDescription({ description, value, type, subType }))}
                  key={`droplist-${rawName}-${index}`}>
                  <img width={24} src={`${prefix}data/${rawName}.png`} alt={''}/>
                </Tooltip> : null)}
              </Stack>
            </CardContent>
          </Card>
          {equipment.map(({ name, rawName, level, description, value, type, subType }, itemIndex) => {
            description = getDescription({ description, value, type, subType })
            return <Tooltip title={description === '0' ? '' : cleanUnderscore(description)} key={itemIndex + name}>
              <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100 }}>
                <CardContent>
                  <Badge anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
  desc = description?.replace(/{/g, notateNumber(value, 'Big')).replace(/}/g, notateNumber(1 + value / 100, 'MultiplierInfo'));
  if (type === 1) {
    if (subType === 1) {
      desc = `Base damage: ${notateNumber(value)}`
    }
    else {
      desc = `Base rate: ${notateNumber(value)}`
    }
  }
  return desc;
}
export default PlayersInventory;
