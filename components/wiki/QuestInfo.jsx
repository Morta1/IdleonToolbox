import React from 'react';
import InfoBox from './InfoBox';
import { numberWithCommas } from '@utility/helpers';

// The half of idleon.wiki's quest table that is neither an item nor an NPC, so none of it can be
// an edge: how hard the quest is, whether it eats the items it asks for, and the objectives that
// point at a skill level or a kill count rather than at an entity.
const QuestInfo = ({ node }) => {
  const information = [];
  if (node?.difficulty) information.push({ label: 'Difficulty', value: node.difficulty });
  if (node?.consumed != null) information.push({ label: 'Items consumed', value: node.consumed ? 'Yes' : 'No' });

  const objectives = (node?.objectives || []).map((objective) => ({
    label: objective.desc,
    value: typeof objective.value === 'number' ? numberWithCommas(objective.value) : objective.value
  }));

  return <InfoBox groups={[
    { title: 'Quest Info', rows: information },
    { title: 'Objectives', rows: objectives }
  ]}/>;
};

export default QuestInfo;
