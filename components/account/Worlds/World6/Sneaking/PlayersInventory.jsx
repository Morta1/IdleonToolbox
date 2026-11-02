import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import { formatDetection } from './Detection';

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

// The game's ninja item text: { is the stat in its own Big (Ninja.ItemStat), } the multiplier it makes
const getDescription = ({ description, value = 0, type, subType }) => {
  let desc;
  desc = description?.replace(/{/g, value >= 0
    ? formatGame(value, 'Ninja.ItemStat')
    : 0).replace(/}/g, formatNum(1 + value / 100, 'mult', { bare: true }));
  if (type === 1) {
    if (subType === 1) {
      desc = `${description} Base damage: ${formatGame(value, 'Ninja.ItemStat')}`
    } else {
      desc = `${description} Base rate: ${formatGame(value, 'Ninja.ItemStat')}%`
    }
  }
  return desc;
}

// One slot (Decision 8 default): the item's sprite with its symbol border as the frame, its level as the tile's number,
// its text a tap away; an empty slot is dashed.
const slotTile = ({ rawName, name, level, symbolLevel, description, value, type, subType }, key) => {
  const text = getDescription({ description, value, type, subType });
  const empty = !rawName || rawName === 'Blank' || name === 'Nothing';
  return <IconTile key={key} icon={`data/${rawName}.png`} alt={cleanUnderscore(name ?? rawName ?? '')}
                   frame={symbolLevel > 0 ? `data/NjBorderS${symbolLevel}.png` : undefined}
                   value={level || undefined} kind={'amount'} status={empty ? 'empty' : undefined}
                   details={empty || description === '0' ? undefined : cleanUnderscore(text)}/>;
};

const PlayersInventory = ({ players, characters, account, dropList, inventory, doorsCurrentHp }) => {
  return <Stack gap={3}>
    <CardGrid size={'m'}>
      {players?.map(({ equipment, floor, activityInfo }, playerIndex) => {
        const ninjaDetection = account?.sneaking?.detection?.ninjas?.[playerIndex];
        const weaponType = equipment?.[1]?.rawName !== 'Blank' && equipment?.[1]?.type;
        const doorMaxHps = account?.sneaking?.doorMaxHps;
        const doorHp = (doorMaxHps?.[floor] - doorsCurrentHp?.[floor]);
        const hasDoor = doorHp > 0;
        const activityIcon = getActivityIcon(activityInfo, weaponType, hasDoor);
        return <ItemCard key={'player-' + playerIndex} icon={`etc/${activityIcon}_Ninja.png`}
                         title={characters?.[playerIndex]?.name}
                         level={{ value: characters?.[playerIndex]?.skillsInfo?.sneaking?.level ?? 0 }}
                         meta={`${activityIcon} · Floor ${floor + 1}`}>
          <ItemCard.Facts rows={[
            ninjaDetection ? ['Detection', formatDetection(ninjaDetection.detection)] : null,
            hasDoor ? ['Door HP', `${formatNum(doorHp)} / ${formatNum(doorMaxHps?.[floor])}`] : null
          ]}/>
          <ItemCard.Section label={'Equipped'}>
            {/* One row of slots at every width, as the game draws them */}
            <CardGrid size={'icon'} columns={equipment?.length}>
              {equipment?.map((item, itemIndex) => slotTile(item, `equip-${itemIndex}`))}
            </CardGrid>
          </ItemCard.Section>
          <ItemCard.Section label={'Floor loot'}>
            <Stack direction={'row'} gap={0.5} flexWrap={'wrap'}>
              {dropList?.[floor]?.map(({ rawName, name, description, value, type, subType }, index) => (type !== 0
                ? <NoteTrigger key={`droplist-${rawName}-${index}`}
                               note={cleanUnderscore(getDescription({ description, value, type, subType }))}
                               label={cleanUnderscore(name ?? rawName)}>
                  <GameIcon src={`data/${rawName}.png`} size={24} alt={''}/>
                </NoteTrigger> : null))}
            </Stack>
          </ItemCard.Section>
        </ItemCard>;
      })}
    </CardGrid>
    <Stack gap={1}>
      <Typography variant={'sectionTitle'} component={'h2'}>Inventory</Typography>
      <CardGrid size={'icon'}>{inventory?.map((item, index) => slotTile(item, 'inventory-' + index))}</CardGrid>
    </Stack>
  </Stack>
};

export default PlayersInventory;
