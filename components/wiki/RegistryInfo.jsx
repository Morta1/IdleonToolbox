import React from 'react';
import InfoBox from './InfoBox';
import LevelledEffect from './LevelledEffect';
import CoinAmount from './CoinAmount';

const fieldValue = ({ value, format }) => {
  if (format === 'coins') return <CoinAmount amount={value}/>;
  return typeof value === 'number' ? value.toLocaleString('en-US') : value;
};

// The page body for every registry kind: the level calculator when the entry has one, and the
// row's extra fields. A kind needing more than this gets its own component, not a branch here.
const RegistryInfo = ({ node }) => {
  if (!node?.registry) return null;
  const groups = [];
  if (node.effect) groups.push({ title: 'Effect', content: <LevelledEffect node={node}/>, rows: [] });
  if (node.fields?.length) {
    groups.push({ title: 'Details', rows: node.fields.map((field) => ({ label: field.label, value: fieldValue(field) })) });
  }
  return <InfoBox groups={groups}/>;
};

export default RegistryInfo;
