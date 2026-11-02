import React from 'react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

// A column whose value opens its breakdown in the drawer (Info board): { ..., wrap: withBreakdown((row) => row.xBreakdown) }.
// A module of its own, so DataTable, and every wiki listing through it, never load the drawer.
const withBreakdown = (breakdownOf) => (row, content) => {
  const data = breakdownOf(row);
  return data ? <Breakdown data={data} asValue>{content}</Breakdown> : content;
};

export default withBreakdown;
