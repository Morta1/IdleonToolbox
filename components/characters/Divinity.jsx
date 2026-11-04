import React from 'react';
import { Typography } from '@mui/material';
import { cleanUnderscore, gameLines } from 'utility/helpers';
import { minorBonusText } from '@utility/gameNotation';
import { GOD_SLOT } from '@parsers/world-5/divinity';
import { isSectionFailed } from '@components/common/styles';
import Panel from '@components/common/cards/Panel';

const MUTED_ROW = { px: 2, py: 1.25 };

const Divinity = ({ character, account }) => {
  const { linkedDeity, deityMinorBonus = 0, secondLinkedDeityIndex, secondDeityMinorBonus = 0, divStyle } = character;
  const deities = account?.divinity?.deities;
  const links = [
    { slot: linkedDeity, bonus: deityMinorBonus },
    { slot: secondLinkedDeityIndex, bonus: secondDeityMinorBonus }
  ].filter(({ slot }) => slot != null && slot >= 0 && deities?.[slot]);
  const hasStyle = divStyle?.name != null;
  const failed = isSectionFailed(account, 'divinity');

  return <Panel title={'Divinity'}>
    {failed ? <Panel.KV label={'Linked god'} value={'-'}/> : null}
    {!failed && !links.length ? <Typography variant={'body2'} color={'text.secondary'} sx={MUTED_ROW}>No god linked</Typography> : null}
    {links.map(({ slot, bonus }) => {
      const { name, minorBonus } = deities[slot];
      return <Panel.Row key={slot} icon={`data/DivGod${slot}.png`} name={cleanUnderscore(name)}
                        sub={cleanUnderscore(minorBonus?.replace(/{/g, minorBonusText(bonus, slot === GOD_SLOT.Arctis)))}/>;
    })}
    {hasStyle ? <Panel.Row icon={`etc/Div_Style_${divStyle?.index}.png`} name={cleanUnderscore(divStyle?.name)}
                           sub={gameLines(divStyle?.description ?? '').map((line) => <div key={line}>{line}</div>)}/>
      : failed ? <Panel.KV label={'Style'} value={'-'}/>
        : <Typography variant={'body2'} color={'text.secondary'} sx={MUTED_ROW}>No style selected</Typography>}
  </Panel>;
};

export default Divinity;
