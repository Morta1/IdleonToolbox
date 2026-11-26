import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Link } from '@mui/material';
import Notice from '@components/common/Notice';
import { getOptimizerKey, useResearchOptimizer } from '@hooks/useResearchOptimizer';
import { gainText } from './optimizerShared';

/** One line on the Observations tab when moving lenses would raise Research EXP today, leading to the Optimizer tab. */
const LensHint = ({ input }) => {
  const router = useRouter();
  const lenses = useResearchOptimizer();
  const options = { goal: 'researchExp', realHours: 0 };
  const runKey = getOptimizerKey('lenses', input, options);
  const hasLenses = (input?.lensSlots ?? []).some(({ observation }) => observation >= 0);

  useEffect(() => {
    if (hasLenses) lenses.run('lenses', input, options);
  }, [runKey]);

  const plan = lenses.status === 'done' ? lenses.result : null;
  if (!plan || plan.ratioToday - 1 < 0.0005) return null;
  const moved = plan.drags.reduce((sum, { count }) => sum + count, 0);
  const open = (event) => {
    event.preventDefault();
    router.push({ pathname: router.pathname, query: { ...router.query, t: 'Optimizer' } }, undefined, { shallow: true });
  };
  return <Notice>
    Moving {moved} lens{moved === 1 ? '' : 'es'} could give {gainText(plan.ratioToday)} Research EXP today.{' '}
    <Link href={'?t=Optimizer'} onClick={open}>See where in the Optimizer tab</Link>
  </Notice>;
};

export default LensHint;
