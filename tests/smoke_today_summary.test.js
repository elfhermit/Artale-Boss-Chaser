const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Artale Boss Chaser - Smoke: Today Summary & PR changes', () => {
    test.beforeEach(async ({ page }) => {
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        const filePath = 'file://' + path.resolve(__dirname, '../docs/index.html').replace(/\\/g, '/');
        await page.goto(filePath);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('Today summary section renders with zero state', async ({ page }) => {
        await expect(page.locator('#today-summary')).toBeVisible();
        await expect(page.locator('#today-kills')).toHaveText('0');
        await expect(page.locator('#today-bosses')).toHaveText('0');
        await expect(page.locator('#today-drops')).toHaveText('0');
        await expect(page.locator('#today-last-time')).toHaveText('--:--');
        await expect(page.locator('.today-empty')).toContainText('今天尚無紀錄');
    });

    test('Recording a kill updates today summary', async ({ page }) => {
        const firstCard = page.locator('.boss-card').first();
        await firstCard.click();
        await page.waitForSelector('#action-bar:visible');

        await page.locator('#action-channel-input').fill('12');
        await page.evaluate(() => { document.getElementById('action-drop-equip').checked = true; });
        await page.locator('#action-submit-btn').click();

        await expect(page.locator('#today-kills')).toHaveText('1');
        await expect(page.locator('#today-bosses')).toHaveText('1');
        await expect(page.locator('#today-drops')).toHaveText('1');
        await expect(page.locator('#today-last-time')).not.toHaveText('--:--');
        await expect(page.locator('.today-boss-chip')).toHaveCount(1);
    });

    test('Today summary collapse button toggles and persists', async ({ page }) => {
        const summary = page.locator('#today-summary');
        await expect(summary).not.toHaveClass(/collapsed/);

        await page.locator('#today-summary-toggle').click();
        await expect(summary).toHaveClass(/collapsed/);

        await page.reload();
        await expect(page.locator('#today-summary')).toHaveClass(/collapsed/);
    });

    test('Daily share button copies text (generateDailyReport contract)', async ({ page }) => {
        const firstCard = page.locator('.boss-card').first();
        await firstCard.click();
        await page.locator('#action-channel-input').fill('7');
        await page.locator('#action-submit-btn').click();

        const text = await page.evaluate(() => window.App.Logic.Actions.generateDailyReport());
        expect(text).toContain('Artale 今日戰報');
        expect(text).toContain('擊殺：1');
        expect(text).toContain('擊殺排行');
    });

    test('History table rows have data-label attributes (mobile-card ready)', async ({ page }) => {
        const firstCard = page.locator('.boss-card').first();
        await firstCard.click();
        await page.locator('#action-channel-input').fill('3');
        await page.locator('#action-submit-btn').click();

        const row = page.locator('#kill-history-table tbody tr').first();
        const cells = row.locator('td');
        await expect(cells.nth(0)).toHaveAttribute('data-label', 'Boss');
        await expect(cells.nth(1)).toHaveAttribute('data-label', '擊殺');
        await expect(cells.nth(2)).toHaveAttribute('data-label', '頻道');
    });

    test('Smart sort state persists after reload (PR#3 fix)', async ({ page }) => {
        await page.locator('#smart-sort-btn').click();
        await expect(page.locator('#smart-sort-btn')).toHaveClass(/active/);
        await page.reload();
        await expect(page.locator('#smart-sort-btn')).toHaveClass(/active/);
    });

    test('Recorded entry has no hasDrop field, only drops (PR#3 cleanup)', async ({ page }) => {
        const firstCard = page.locator('.boss-card').first();
        await firstCard.click();
        await page.locator('#action-channel-input').fill('9');
        await page.evaluate(() => { document.getElementById('action-drop-scroll').checked = true; });
        await page.locator('#action-submit-btn').click();

        const entry = await page.evaluate(() => window.App.Core.State.state.killHistory[0]);
        expect(entry).toBeTruthy();
        expect(entry.drops).toBeTruthy();
        expect(entry.drops.scroll).toBe(true);
        expect('hasDrop' in entry).toBe(false);
    });
});
