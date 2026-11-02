import React from 'react';
import Notice from '@components/common/Notice';

// After a settings migration: how many alerts differ from the defaults, with a way to review them.
const DefaultsNote = ({ count, onReview, onDismiss }) => (
  <Notice sx={{ mb: 2 }} action={{ label: 'Review', onClick: onReview }} onDismiss={onDismiss} dismissLabel={'Dismiss'}>
    {`${count} of your alert settings differ from the defaults.`}
  </Notice>
);

export default DefaultsNote;
