import React from 'react';
import InfoBox, { visibleGroups } from './InfoBox';
import { numberWithCommas } from '@utility/helpers';

// The half of idleon.wiki's quest table that is neither an item nor an NPC, so none of it can be
// an edge: how hard the quest is, whether it eats the items it asks for, and the objectives that
// point at a skill level or a kill count rather than at an entity.
export const questGroups = (node) => {
  const information = [];
  if (node?.difficulty) information.push({ label: 'Difficulty', value: node.difficulty });
  if (node?.consumed != null) information.push({ label: 'Items consumed', value: node.consumed ? 'Yes' : 'No' });

  const objectives = (node?.objectives || []).map((objective) => ({
    label: objective.desc,
    value: typeof objective.value === 'number' ? numberWithCommas(objective.value) : objective.value
  }));

  return [
    { title: 'Quest Info', rows: information },
    { title: 'Objectives', rows: objectives }
  ];
};

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const questInfoShows = (node) => visibleGroups(questGroups(node)).length > 0;

const QuestInfo = ({ node }) => <InfoBox groups={questGroups(node)}/>;

export default QuestInfo;
