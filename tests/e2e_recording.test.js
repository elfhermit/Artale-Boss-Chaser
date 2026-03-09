const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Artale Boss Chaser - Debug Recording', () => {
    test.beforeEach(async ({ page }) => {
        // Listen for console logs
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        const filePath = 'file://' + path.resolve(__dirname, '../docs/index.html');
        await page.goto(filePath);
    });

    test('Recording in Target Lock mode should work and increment channel', async ({ page }) => {
        const bossName = '紅寶王';
        await page.click(`.boss-card:has-text("${bossName}")`);
        await expect(page.locator('#target-lock-panel')).toBeVisible();

        const channelInput = page.locator('#focus-channel-input');
        await channelInput.fill('5');
        await page.click('#focus-submit-btn');

        const toast = page.locator('.toast');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText(`紀錄已新增：${bossName} Ch.5`);

        const firstRow = page.locator('#kill-history-table tbody tr').first();
        await expect(firstRow).toContainText(bossName);
        await expect(firstRow).toContainText('5');
        await expect(channelInput).toHaveValue('6');
    });

    test('Keyboard Enter should trigger recording in Focus Mode', async ({ page }) => {
        await page.click('.boss-card:has-text("蘑菇王")');
        const channelInput = page.locator('#focus-channel-input');
        await channelInput.fill('20');
        await channelInput.press('Enter');

        const firstRow = page.locator('#kill-history-table tbody tr').first();
        await expect(firstRow).toContainText('蘑菇王');
        await expect(firstRow).toContainText('20');
        await expect(channelInput).toHaveValue('21');
    });

    test('History table should show all records when no boss is focused', async ({ page }) => {
        // Record one boss
        await page.click('.boss-card:has-text("紅寶王")');
        await page.locator('#focus-channel-input').fill('1');
        await page.click('#focus-submit-btn');
        
        // Record another boss
        await page.click('.boss-card:has-text("樹妖王")');
        await page.locator('#focus-channel-input').fill('2');
        await page.click('#focus-submit-btn');

        // Unlock focus
        await page.click('#unlock-boss-btn');

        // Table should have 2 rows
        const rows = page.locator('#kill-history-table tbody tr');
        await expect(rows).toHaveCount(2);
    });
});
