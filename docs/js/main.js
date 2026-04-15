
(function () {
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // App Parts
        const { initDOM } = window.App.UI.DOM;
        const { loadHistory, loadLastChannel, loadTheme } = window.App.Core.State;
        const { renderBossCards, renderHistoryTable, updateAllTimers, renderFavoriteChips, updateFilterCounts } = window.App.UI.Render;
        const { setupEventListeners } = window.App.UI.Events;
        const { setChannel } = window.App.Logic.Actions;

        initDOM();
        loadTheme();
        loadHistory();
        const lastCh = loadLastChannel();
        if (lastCh) setChannel(lastCh);

        renderBossCards();
        renderHistoryTable();
        renderFavoriteChips();
        updateFilterCounts();

        setupEventListeners();
        startTimerLoop();

        // V2: Show default tab on mobile
        initMobileDefaults();

        console.log("Boss 獵人儀表板 (Pro) V2 — Mobile-First Refactored — 已啟動");
    }

    let timerInterval = null;

    function startTimerLoop() {
        const { updateAllTimers } = window.App.UI.Render;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            updateAllTimers();
        }, 1000);
    }

    // V2: 設定手機版初始狀態
    function initMobileDefaults() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;

        // 如果有已選擇的 Boss (from previous session)，初始化 Action Bar
        if (state.focusedBossId && dom.actionBar) {
            const { renderActionBar } = window.App.UI.Render;
            renderActionBar(state.focusedBossId);
        }

        // Apply view mode icon
        if (dom.viewIcon) {
            dom.viewIcon.textContent = state.viewMode === 'compact' ? 'view_list' : 'grid_view';
        }

        // Apply sound icon
        if (dom.soundIcon) {
            dom.soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
        }
    }
})();
