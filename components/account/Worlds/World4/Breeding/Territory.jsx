import { Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import { monsters } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';

const TEAM_SLOTS = 4;

// The save names a monster by its raw key; the game shows its name
const monsterName = (rawName, realName) => cleanUnderscore(realName ?? monsters?.[rawName]?.Name ?? rawName);

// A territory's four team slots: the pet, its power, its gene as the mark and by name in the details
const teamSlots = (team) => Array.from({ length: TEAM_SLOTS }, (_, slot) => team?.[slot]).map((member, slot) => {
  if (!member?.name || member.name === 'none') return <IconTile key={slot} status={'empty'}/>;
  const name = monsterName(member.name, member?.realName);
  const gene = cleanUnderscore(member?.gene?.name);
  return <IconTile key={slot} icon={monsterSprite(member.name)} alt={name}
                   value={formatGame(member?.power ?? 0, 'PetStuff.TotalTrekkingFightPOW')}
                   mark={member?.gene ? `data/GeneOver${member.gene.index}.png` : undefined} markAlt={gene}
                   details={gene ? `${name}: ${gene} gene` : name}/>;
});

const Territory = ({ territories, spices }) => {
  return <CardGrid size={'l'}>
    {territories?.map(({
                         territoryName,
                         battleName,
                         background,
                         team,
                         enemies,
                         reqProgress,
                         currentProgress,
                         forageSpeed
                       }, index) => {
      if (battleName === 'Filler_Filler') return null;
      // The spice list keeps owned spices only, so a spent one shifts the rest: find this territory's by its name
      const spice = spices?.available?.find(({ rawName }) => rawName === `CookingSpice${index}`);
      const toClaim = spices?.toClaim?.[index]?.amount ?? 0;
      const realEnemies = enemies?.filter(({ health }) => health);
      const progressNow = currentProgress ?? 0;
      // The game data names no territory past Dharma Mesa yet: its battle names it
      return <ItemCard key={battleName} icon={`data/${background}`} iconAlt={''}
                       title={territoryName ?? cleanUnderscore(battleName)}
                       meta={territoryName ? cleanUnderscore(battleName) : undefined}>
        <ItemCard.Progress label={'Progress'}
                           percent={reqProgress > 0 ? Math.min(100, 100 * progressNow / reqProgress) : 0}
                           value={formatGame(progressNow, 'PetStuff.TotalTrekkingREQ')}
                           max={formatGame(reqProgress ?? 0, 'PetStuff.TotalTrekkingREQ')}/>
        <ItemCard.Facts rows={[
          ['Forage speed', `${formatGame(forageSpeed ?? 0, 'PetStuff.TotalTrekkingHR')}/hr`],
          [<Stack key={'spice'} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
            <GameIcon src={`data/CookingSpice${index}.png`} size={24} alt={''}/>Spice</Stack>,
            `${formatGame(toClaim, 'CookingR.CookingUpgSpiceCostQty')} to claim · ${formatGame(spice?.amount ?? 0, 'CookingR.CookingUpgSpiceCostQty')} owned`]
        ]}/>
        <ItemCard.Section label={'Team'}>
          <CardGrid size={'icon'} columns={TEAM_SLOTS}>{teamSlots(team)}</CardGrid>
        </ItemCard.Section>
        {realEnemies?.length ? <ItemCard.Section label={'Enemies'}>
          <CardGrid size={'icon'} columns={5}>
            {realEnemies.map(({ name }, enemyIndex) => <IconTile key={enemyIndex} icon={monsterSprite(name)}
                                                                 alt={monsterName(name)} details={monsterName(name)}/>)}
          </CardGrid>
        </ItemCard.Section> : null}
      </ItemCard>
    })}
  </CardGrid>;
};

export default Territory;
