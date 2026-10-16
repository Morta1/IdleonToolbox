// The node id a row gives one of its own entries, built through the row's own key so a link can never
// drift from the page it names.
export const nodeId = (row, entry, index, data) => `${row.kind}:${row.key(entry, index, data)}`;
