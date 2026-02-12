
(function () {
    // Shortcuts

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // App Parts
        const { initDOM } = window.App.UI.DOM;
        const { loadHistory, loadPresets, loadLastChannel, loadTheme } = window.App.Core.State;
        const { renderBossCards, renderHistoryTable, updateAllTimers, renderPresets } = window.App.UI.Render;
        const { setupEventListeners } = window.App.UI.Events;
        const { setChannel } = window.App.Logic.Actions;

        initDOM();
        loadTheme();
        loadHistory();
        const lastCh = loadLastChannel();
        if (lastCh) setChannel(lastCh);
        loadPresets();

        renderBossCards();
        renderHistoryTable();
        renderPresets();

        setupEventListeners();
        startTimerLoop();
        console.log("Boss 獵人儀表板 (Pro) - Namespace Refactored - 已啟動");
    }

    let timerInterval = null;

    function startTimerLoop() {
        const { updateAllTimers } = window.App.UI.Render;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            updateAllTimers();
        }, 1000);
    }
})();
