import { mapEnemiesArray, mapNames, monsters } from '@website-data';

export const getFilteredPortals = () => {
  const excludedMaps = ([
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior', 'Emperor\'s_Castle'] as any).toSimpleObject();
  return Object.entries(mapNames).map(([mapIndex, mapName], index) => {
    const rawName = mapEnemiesArray?.[index];
    const { AFKtype } = monsters?.[rawName] || {};
    return {
      mapName,
      mapIndex,
      afkType: AFKtype
    }
  }).filter(({
    mapName,
    afkType
  }) => afkType === 'FIGHTING' &&
  !excludedMaps[mapName]
  && !afkType.includes('Fish') && !afkType.includes('Bug') && !mapName.includes('Colosseum'));
}
