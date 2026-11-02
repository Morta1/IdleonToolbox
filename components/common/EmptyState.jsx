import Notice from '@components/common/Notice';

// An empty list (Notices board): a note under the list's controls with the one step that brings the
// rows back. onShowCompleted turns the caller's Hide completed off. Full width, so it reads from the left
// inside the centred rows its callers draw their cards in.
const EmptyState = ({ hideCompleted, label, onShowCompleted }) => (
  <Notice sx={{ mt: 2, width: '100%' }} action={hideCompleted ? { label: 'Show completed', onClick: onShowCompleted } : undefined}>
    {hideCompleted ? `All ${label} completed.` : `No ${label} yet.`}
  </Notice>
);

export default EmptyState;
