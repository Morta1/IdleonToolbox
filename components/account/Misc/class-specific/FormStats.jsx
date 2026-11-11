import BonusStrip from '@components/common/cards/BonusStrip';
import StatTile from '@components/common/cards/StatTile';

// A Masterclass form's stats (Wraith, Tempest, Arcanist) as tiles in a row under the form's name, as Owl's and Bubba's
// bonuses: in a full-width Panel of three columns each name sat about 500 px from its value. meta names the character
// the stats are read from. shown false: no character (or a failed section), every tile a dash.
const FormStats = ({ title, meta, rows, shown }) => <BonusStrip title={title} meta={meta} sx={{ mb: 3 }}>
  {rows.map(([label, value]) => <StatTile key={label} label={label} value={shown ? value : '-'}/>)}
</BonusStrip>;

export default FormStats;
