import Notice from '@components/common/Notice';

// Show completed unticks the page's Hide completed box, so the focus goes to that box, not the page body.
const hideCompletedBox = () => [...document.querySelectorAll('input[type="checkbox"]')]
  .find((input) => input.labels?.[0]?.textContent.trim() === 'Hide completed') ?? null;

// An empty list (Notices board): a note under the list's controls with the one step that brings the
// rows back. onShowCompleted turns the caller's Hide completed off. Full width, so it reads from the left
// inside the centred rows its callers draw their cards in.
const EmptyState = ({ hideCompleted, label, onShowCompleted }) => (
  <Notice sx={{ mt: 2, width: '100%' }} action={hideCompleted ? { label: 'Show completed', onClick: onShowCompleted } : undefined}
          focusAfter={hideCompletedBox}>
    {hideCompleted ? `All ${label} completed.` : `No ${label} yet.`}
  </Notice>
);

export default EmptyState;
