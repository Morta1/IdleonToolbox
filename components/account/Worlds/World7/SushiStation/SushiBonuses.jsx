import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import GameIcon from '@components/common/GameIcon';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';

// A sushi on one line, its level muted after its name and a Perfecto its star, as the old page listed them: a second line for
// the level made every row twice as tall, and "Perfecto" in words broke most lines.
const ROW_SX = { py: 0.75 };

// Each knowledge category is a titled list of the sushi that feed it. A save with no sushi discovered (a guest) lists
// every category's sushi from the catalog at zero, rather than empty panels.
const SushiBonuses = ({ knowledgeSummary, knowledge }) => {
  const anyDiscovered = knowledge?.some(({ discovered }) => discovered);
  const catalogOf = (category) => knowledge?.flatMap(({ name, category: of }, index) => (of === category
    ? [{ index, name, bonus: 0, level: 0, perfecto: false }] : []));
  return <CardGrid size={'m'} sx={{ alignItems: 'start' }}>
    {knowledgeSummary?.map(({ label, category, sources }) => <Panel key={category} title={label}>
      {(anyDiscovered ? sources : catalogOf(category))?.map(({ index, name, bonus, level, perfecto }) => <Panel.Row
        key={index} sx={ROW_SX} icon={<GameIcon src={`data/Sushi${index}.png`} size={24} alt={''}/>}
        name={<>{name}{' '}<Typography component={'span'} variant={'body2'} color={'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
          Lv {formatNum(level ?? 0)}
          {perfecto ? <Box component={'span'} sx={{ ml: 0.5, display: 'inline-flex', verticalAlign: 'text-bottom' }}>
            <GameIcon src={'etc/SushiPerfectoStar.png'} size={16} alt={'Perfecto'}/>
          </Box> : null}
        </Typography></>}
        value={`+${formatGame(bonus ?? 0, 'SushiStuff.KnowledgeBonusSpecific')}`}/>)}
    </Panel>)}
  </CardGrid>;
};

export default SushiBonuses;
