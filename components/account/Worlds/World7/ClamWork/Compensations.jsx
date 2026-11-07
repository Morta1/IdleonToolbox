import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';

// A titled list of bonus sentences and their state
const Compensations = ({ compensations }) => <Panel title={'Compensations'}>
  {compensations?.map((compensation, index) => <Panel.Row key={index} name={cleanUnderscore(compensation?.name)}
                                                          value={compensation?.unlocked === 1
                                                            ? <StatusText status={'done'}>Unlocked</StatusText>
                                                            : <StatusText status={'locked'}/>}/>)}
</Panel>;

export default Compensations;
