import React from 'react';
import InfoBox from './InfoBox';
import LevelledEffect from './LevelledEffect';

const TalentInfo = ({ node }) => {
  if (node?.kind !== 'talent') return null;

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

  return <InfoBox groups={groups}/>;
};

export default TalentInfo;
