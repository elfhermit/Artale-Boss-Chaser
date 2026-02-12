
(function () {
    const dom = {
        bossListContainer: null,
        historyTableBody: null,
        historyTableTitle: null,
        tableHeaders: [],
        historyPagination: null,

        selectedBossInfo: null,
        killForm: null,

        channelInput: null,
        hasDropInput: null,
        notesInput: null,
        submitKillBtn: null,

        themeToggleBtn: null,
        themeIcon: null,
        filterChips: [],
        searchInput: null,
        clearHistoryBtn: null,
        savePresetBtn: null,
        saveBatchPresetBtn: null,
        presetsList: null,
        toastContainer: null,

        // 頻道步進器
        channelSubBtn: null,
        channelAddBtn: null,
        quickChannels: [],

        sidebar: null,

        // Batch
        batchInput: null,
        batchBtn: null,

        // New Features
        viewToggleBtn: null,
        viewIcon: null,
        soundToggleBtn: null,
        soundIcon: null,
        smartSortBtn: null
    };

    function initDOM() {
        dom.bossListContainer = document.getElementById('boss-monitoring-list');
        dom.historyTableBody = document.querySelector('#kill-history-table tbody');
        dom.historyTableTitle = document.getElementById('history-table-title');
        dom.tableHeaders = document.querySelectorAll('#kill-history-table th.sortable');
        dom.historyPagination = document.getElementById('history-pagination');

        dom.selectedBossInfo = document.getElementById('selected-boss-info');
        dom.killForm = document.getElementById('kill-form');

        dom.channelInput = document.getElementById('channel-input');
        dom.hasDropInput = document.getElementById('has-drop');
        dom.notesInput = document.getElementById('notes');
        dom.submitKillBtn = document.getElementById('submit-kill-btn');

        dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
        dom.themeIcon = document.getElementById('theme-icon');
        dom.filterChips = document.querySelectorAll('.filter-chips .chip');
        dom.searchInput = document.getElementById('boss-search-input');
        dom.clearHistoryBtn = document.getElementById('clear-history-btn');
        dom.savePresetBtn = document.getElementById('save-preset-btn');
        dom.saveBatchPresetBtn = document.getElementById('save-batch-preset-btn');
        dom.presetsList = document.getElementById('presets-list');
        dom.toastContainer = document.getElementById('toast-container');

        dom.channelSubBtn = document.getElementById('channel-sub');
        dom.channelAddBtn = document.getElementById('channel-add');
        dom.quickChannels = document.querySelectorAll('.quick-chip');

        dom.sidebar = document.getElementById('sidebar'); // ensure sidebar reference for scrolling on mobile

        dom.batchInput = document.getElementById('batch-channels-input');
        dom.batchBtn = document.getElementById('apply-batch-btn');

        // Init New Feature Elements
        dom.viewToggleBtn = document.getElementById('view-mode-btn');
        dom.viewIcon = document.getElementById('view-mode-icon');
        dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
        dom.soundIcon = document.getElementById('sound-toggle-icon');
        dom.smartSortBtn = document.getElementById('smart-sort-btn');
    }

    // Export
    window.App.UI.DOM = { dom, initDOM };
})();
