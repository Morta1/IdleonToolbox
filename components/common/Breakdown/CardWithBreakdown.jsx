// CardWithBreakdown is StatTile under its old name: the value itself opens the breakdown, and a tile
// with no value shows the breakdown's total. Callers move to StatTile by name with their pages.
// The alias goes in phase 6; __test__/legacy-tile-names.test.js blocks new imports of it.
export { default as CardWithBreakdown } from '@components/common/cards/StatTile';
