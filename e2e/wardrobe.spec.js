import { expect, test } from '@playwright/test';
import { waitForRender } from './wait-helpers';

test.describe('wardrobe', () => {
  test('shows one view with the seven drawn slots, the character select and three poses', async ({ page }) => {
    await page.goto('/tools/wardrobe?demo=true');
    await waitForRender(page);
    // The page is a single view now: no tab strip at all.
    await expect(page.getByRole('tab')).toHaveCount(0);
    for (const label of ['Hat', 'Weapon', 'Cape', 'Costume', 'Trophy', 'Nametag', 'Companion']) {
      await expect(page.getByRole('button', { name: `${label} slot` })).toBeVisible();
    }
    // The demo profile ships 11 characters, so CharacterSelect renders (it returns null with none).
    await expect(page.getByLabel('Character')).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCount(1);
    // Only three poses: the skilling animations belong to the sheets, not the wardrobe.
    for (const pose of ['Idle', 'Walk', 'Attack']) {
      await expect(page.getByRole('button', { name: pose, exact: true })).toBeVisible();
    }
    for (const pose of ['Mining', 'Fishing', 'Divinity']) {
      await expect(page.getByRole('button', { name: pose, exact: true })).toHaveCount(0);
    }

    // Picking a companion puts its monster raw name in the URL, so the look can be shared.
    await page.getByRole('button', { name: 'Companion slot' }).click();
    await page.getByLabel('Search').fill('Dedotated Ram');
    await page.getByRole('option', { name: 'Dedotated Ram' }).click();
    await expect(page).toHaveURL(/companion=ram/);
  });
});
