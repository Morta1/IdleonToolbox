import React from 'react';
import InfoBox, { visibleGroups } from './InfoBox';
import LevelledEffect from './LevelledEffect';

const talentGroups = (node) => {
  if (node?.kind !== 'talent') return [];

  const groups = [];
  // Full-width content rather than a label/value row: the effect is a sentence, and the row layout
  // right-aligns it into a ragged column three lines deep.
  if (node.effect) groups.push({ title: 'Effect', content: <LevelledEffect node={node}/> });

  // 91 of the 376 talents are attacks; the rest are passives and have none of this.
  const cost = [];
  if (node.manaCost > 0) cost.push({ label: 'Mana', value: node.manaCost.toLocaleString('en-US') });
  if (node.cooldown > 0) cost.push({ label: 'Cooldown', value: `${node.cooldown}s` });
  if (node.castTime > 0) cost.push({ label: 'Cast time', value: `${node.castTime}s` });
  if (cost.length) groups.push({ title: 'Attack', rows: cost });

  // No Classes box: the class pages link here through `teaches`, so the panel renders that as a
  // section of real links rather than a list of tab names that go nowhere.

  return groups;
};

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const talentInfoShows = (node) => visibleGroups(talentGroups(node)).length > 0;

const TalentInfo = ({ node }) => <InfoBox groups={talentGroups(node)}/>;

export default TalentInfo;
