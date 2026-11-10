import React from 'react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

// A column whose value opens its breakdown in the drawer (Info board): { ..., wrap: withBreakdown((row) => row.xBreakdown) }.
// A module of its own, so DataTable, and every wiki listing through it, never load the drawer. titleOf names a row's drawer
// and leaves the statName alone: the search's ?breakdown= link matches the statName.
const withBreakdown = (breakdownOf, titleOf) => (row, content) => {
  const data = breakdownOf(row);
  return data ? <Breakdown data={data} title={titleOf?.(row)} asValue>{content}</Breakdown> : content;
};

export default withBreakdown;
