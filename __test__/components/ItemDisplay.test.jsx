// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import ItemDisplay from '@components/common/ItemDisplay';
import { items } from '@website-data';
import darkTheme from '../../styles/theme/darkTheme';

const account = {
  forge: { list: [{ speed: 2 }] },
  bribes: [{ name: 'Fossil_Fuel_Legislation', done: true, value: 0.2 }],
  guild: { guildBonuses: { 13: { func: 'decay', level: 50, x1: 16, x2: 50 } } },
  hole: { caverns: { gambit: { bonuses: { 4: { bonus: 20 } } } } }
};
const character = {};
// Told apart, so a row proves which of the two the fill asked for
const getPlayerFoodBonus = (_, __, isHealth) => (isHealth ? 3.5 : 2.5);

const textOf = (rawName, props = {}) => render(
  <ThemeProvider theme={darkTheme}>
    <ItemDisplay {...items[rawName]} rawName={rawName} {...props}/>
  </ThemeProvider>
).container.textContent;

// The item box's DESC row, N.js: the game's expression beside each
describe('ItemDisplay fills', () => {
  it.each([
    // Math.max(Math.ceil(Amount - FoodBonuses("OreRedux")), 1), and Cooldown / 1 / (4 * ForgeSpeeed(0))
    ['an ore', 'Plat', { account }, 'Smelt down 16 Ores', `will take ${Math.ceil(items.Plat.Cooldown / (4 * 2))} Seconds`],
    // Amount * 1, and Cooldown * (1 - GetBribeBonus("9") / 100)
    ['an oil', 'OilBarrel1', { account }, 'by 15%', '74.85% chance'],
    ['an oil with no account', 'OilBarrel1', {}, 'by 15%', '75% chance'],
    // Math.round(Amount * FoodBonuses("HealthEffectBonus")), and Cooldown * 1
    ['a health food', 'FoodHealth1', { account, character, getPlayerFoodBonus }, 'Restores 70 HP', 'Has a 30 second'],
    // Amount * FoodBonuses("BoostsEffectBonus")
    ['a boost food', 'FoodPotOr1', { account, character, getPlayerFoodBonus }, 'Base Dmg by 125.', '1% chance'],
    ['a boost food with no character', 'FoodPotOr1', { account, getPlayerFoodBonus }, 'Base Dmg by 50.', '1% chance'],
    // Math.min(Amount + StoneChancePCT(0), 100): GuildBonuses(13) is decay(50, 16, 50) = 8, GambitBonuses(4) is 20
    ['a stone', 'StoneW3', { account }, 'Success Chance; 78%', 'Uses up 1 slot only'],
    ['a stone at its cap', 'StoneW2', { account }, 'Success Chance; 100%', 'Uses up 1 slot only'],
    // StoneChancePCT(1) is 0
    ['a Tempest stone', 'StoneTempestR0', { account }, 'Success Chance; 60%', 'Uses up 1 item slot']
  ])('%s', (_, rawName, props, first, second) => {
    const text = textOf(rawName, props);
    expect(text).toContain(first);
    expect(text).toContain(second);
  });
});
