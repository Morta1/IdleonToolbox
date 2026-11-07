import { cleanUnderscore, formatStarSignBonus } from 'utility/helpers';
import { Typography } from '@mui/material';
import Panel from '@components/common/cards/Panel';

const PlayerStarSigns = ({ signs }) => {
  const sortedSigns = signs?.toSorted((a, b) => a?.starName.localeCompare(b?.starName, 'en'));
  return <Panel title={'Star signs'}>
    {sortedSigns?.map(({ starName, bonuses }, index) => (starName !== 'None' ? <Panel.Row
      key={starName + index}
      name={cleanUnderscore(starName)}
      // Each of the game's lines on its own: a comma between them broke a sentence that runs over two
      sub={<>
        {bonuses?.map(({ rawName, bonus }, lineIndex) => <div key={lineIndex}>{cleanUnderscore(formatStarSignBonus(rawName, bonus))}</div>)}
        {bonuses?.some(({ chipBoost }) => chipBoost > 1) ? <Typography variant={'caption'} component={'div'}>Chip boosted</Typography> : null}
      </>}/> : null))}
  </Panel>;
};

export default PlayerStarSigns;
