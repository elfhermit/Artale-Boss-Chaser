const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: ['**/smoke_today_summary.test.js'],
    timeout: 20000,
    use: {
        headless: true,
    },
});
