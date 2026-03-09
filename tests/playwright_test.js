const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Artale Boss Chaser - Recording Flow', () => {
    test.beforeEach(async ({ page }) => {
        const filePath = 'file://' + path.resolve(__dirname, '../docs/index.html');
        await page.goto(filePath);
    });

    test('should record a boss kill and update the table', async ({ page }) => {
        // 1. Select a boss (e.g., 紅寶王)
        const bossCard = page.locator('.boss-card', { hasText: '紅寶王' }).first();
        await bossCard.click();

        // 2. Ensure submit button is enabled and shows correct text
        const submitBtn = page.locator('#submit-kill-btn');
        await expect(submitBtn).toBeEnabled();
        await expect(submitBtn).toHaveText('立即紀錄擊殺');

        // 3. Set channel and click record
        await page.fill('#channel-input', '10');
        await submitBtn.click();

        // 4. Check if toast appears
        const toast = page.locator('.toast');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('紀錄已新增');

        // 5. Verify if a row is added to the table
        const firstRow = page.locator('#kill-history-table tbody tr').first();
        await expect(firstRow).toContainText('紅寶王');
        await expect(firstRow.locator('td').nth(2)).toHaveText('10'); // Channel column

        // 6. Check if channel auto-increments
        const channelInput = page.locator('#channel-input');
        await expect(channelInput).toHaveValue('11');
    });

    test('should work correctly in Target Lock (Focus) mode', async ({ page }) => {
        // 1. Select a boss to enter Focus Mode
        const bossCard = page.locator('.boss-card', { hasText: '蘑菇王' }).first();
        await bossCard.click();

        // 2. Verify Target Lock panel is visible
        const targetPanel = page.locator('#target-lock-panel');
        await expect(targetPanel).toBeVisible();

        // 3. Set focus channel and click record
        await page.fill('#focus-channel-input', '50');
        const focusSubmitBtn = page.locator('#focus-submit-btn');
        await focusSubmitBtn.click();

        // 4. Verify record in history list below Focus Mode
        const historyItem = page.locator('.target-history-item').first();
        await expect(historyItem).toContainText('CH.50');

        // 5. Verify main history table also has it
        const mainRow = page.locator('#kill-history-table tbody tr').first();
        await expect(mainRow).toContainText('蘑菇王');
        await expect(mainRow).toContainText('50');

        // 6. Verify channel increments in Focus Mode
        const focusChannelInput = page.locator('#focus-channel-input');
        await expect(focusChannelInput).toHaveValue('51');
    });
});
