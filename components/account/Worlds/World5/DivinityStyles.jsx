import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { divStyles } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// A character's level, and the Divinity PTS it earns per hour when it earns any
const usedByValue = (level, rate) => rate > 0 ? `${formatNum(level, 'level')} · ${formatNum(rate, 'rate')}` : formatNum(level, 'level');

const DivinityStyles = ({ characters, pointsPerHour }) => <CardGrid size={'m'}>
  {divStyles?.map(({ name, description }, styleIndex) => {
    const equippedBy = characters?.filter(({ divStyle }) => divStyle?.index === styleIndex) ?? [];
    return <ItemCard key={name} icon={`etc/Div_Style_${styleIndex}.png`} title={name}>
      {/* The game's @ is a line break: the style's second line */}
      <ItemCard.Desc text={description}/>
      {equippedBy.length > 0 ? <ItemCard.Section label={'Used by'}>
        <ItemCard.Facts rows={equippedBy.map(({ name: charName, classIndex, playerId, skillsInfo }) => [
          <Stack key={`${charName}-${playerId}`} component={'span'} direction={'row'} alignItems={'center'} gap={1}>
            <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>{cleanUnderscore(charName)}
          </Stack>,
          usedByValue(skillsInfo?.divinity?.level ?? 0, pointsPerHour?.find((entry) => entry.playerId === playerId)?.value)
        ])}/>
      </ItemCard.Section> : null}
    </ItemCard>;
  })}
</CardGrid>;

export default DivinityStyles;
