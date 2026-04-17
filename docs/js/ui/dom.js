(function () {
    const dom = {
        bossListContainer: null,
        historyTableBody: null,
        historyTableTitle: null,
        tableHeaders: [],
        historyPagination: null,

        themeToggleBtn: null,
        themeIcon: null,
        filterChips: [],
        searchInput: null,
        clearHistoryBtn: null,
        toastContainer: null,

        // New Features
        viewToggleBtn: null,
        viewIcon: null,
        soundToggleBtn: null,
        soundIcon: null,
        smartSortBtn: null,

        // 最愛 & 快選 (Unified)
        favChipsContainer: null,
        bossSelectorDropdown: null,

        // === Unified Action Bar (Target Lock) ===
        actionBar: null,
        actionTargetImg: null,
        actionTargetName: null,
        actionTargetRespawn: null,
        actionShareBtn: null,
        actionUnlockBtn: null,
        actionChannelInput: null,
        actionChSubBtn: null,
        actionChAddBtn: null,
        actionSubmitBtn: null,
        actionAutoInc: null,
        actionDropEquip: null,
        actionDropScroll: null,
        actionDropStar: null,
        actionHistoryList: null,

        // 分享 Modal
        shareStatusBtn: null,
        shareModal: null,
        shareTextContent: null,
        shareCopyBtn: null,
        shareNativeBtn: null,
        shareModalClose: null,
        shareCloseBtn2: null,
        shareFormatRadios: null,
        shareBossList: null,
        shareSelectAllBtn: null,

        // 篩選計數
        filterChipAll: null,
        filterChipAlive: null,
        filterChipWarning: null,
        filterChipCooldown: null,

        // === Tab System ===
        bottomNav: null,
        tabButtons: [],
        tabPanels: [],

        // 今日戰況
        todaySummary: null,
        todaySummaryBody: null,
        todaySummaryDate: null,
        todaySummaryToggle: null,
        todaySummaryToggleIcon: null,
        todayKills: null,
        todayBosses: null,
        todayDrops: null,
        todayDropBreakdown: null,
        todayLastTime: null,
        todayTopBosses: null,
        todayShareBtn: null
    };

    function initDOM() {
        dom.bossListContainer = document.getElementById('boss-monitoring-list');
        dom.historyTableBody = document.querySelector('#kill-history-table tbody');
        dom.historyTableTitle = document.getElementById('history-table-title');
        dom.tableHeaders = document.querySelectorAll('#kill-history-table th.sortable');
        dom.historyPagination = document.getElementById('history-pagination');

        dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
        dom.themeIcon = document.getElementById('theme-icon');
        dom.filterChips = document.querySelectorAll('.filter-chips .chip');
        dom.searchInput = document.getElementById('boss-search-input');
        dom.clearHistoryBtn = document.getElementById('clear-history-btn');
        dom.toastContainer = document.getElementById('toast-container');

        // Init New Feature Elements
        dom.viewToggleBtn = document.getElementById('view-mode-btn');
        dom.viewIcon = document.getElementById('view-mode-icon');
        dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
        dom.soundIcon = document.getElementById('sound-toggle-icon');
        dom.smartSortBtn = document.getElementById('smart-sort-btn');

        // 最愛 & 快選
        dom.favChipsContainer = document.getElementById('fav-chips-container');
        dom.bossSelectorDropdown = document.getElementById('boss-selector-dropdown');

        // === Unified Action Bar Init ===
        dom.actionBar = document.getElementById('action-bar');
        dom.actionTargetImg = document.getElementById('action-target-img');
        dom.actionTargetName = document.getElementById('action-target-name');
        dom.actionTargetRespawn = document.getElementById('action-target-respawn');
        dom.actionShareBtn = document.getElementById('action-share-btn');
        dom.actionUnlockBtn = document.getElementById('action-unlock-btn');
        dom.actionChannelInput = document.getElementById('action-channel-input');
        dom.actionChSubBtn = document.getElementById('action-ch-sub');
        dom.actionChAddBtn = document.getElementById('action-ch-add');
        dom.actionSubmitBtn = document.getElementById('action-submit-btn');
        dom.actionAutoInc = document.getElementById('action-auto-inc');
        dom.actionDropEquip = document.getElementById('action-drop-equip');
        dom.actionDropScroll = document.getElementById('action-drop-scroll');
        dom.actionDropStar = document.getElementById('action-drop-star');
        dom.actionHistoryList = document.getElementById('action-history-list');

        // 分享 Modal
        dom.shareStatusBtn = document.getElementById('share-status-btn');
        dom.shareModal = document.getElementById('share-modal');
        dom.shareTextContent = document.getElementById('share-text-content');
        dom.shareCopyBtn = document.getElementById('share-copy-btn');
        dom.shareNativeBtn = document.getElementById('share-native-btn');
        dom.shareModalClose = document.getElementById('share-modal-close');
        dom.shareCloseBtn2 = document.getElementById('share-close-btn2');
        dom.shareFormatRadios = document.querySelectorAll('input[name="share-format"]');
        dom.shareBossList = document.getElementById('share-boss-list');
        dom.shareSelectAllBtn = document.getElementById('share-select-all-btn');

        // 篩選計數
        dom.filterChipAll = document.querySelector('.filter-chips .chip[data-filter="all"]');
        dom.filterChipAlive = document.querySelector('.filter-chips .chip[data-filter="alive"]');
        dom.filterChipWarning = document.querySelector('.filter-chips .chip[data-filter="warning"]');
        dom.filterChipCooldown = document.querySelector('.filter-chips .chip[data-filter="cooldown"]');

        // 今日戰況
        dom.todaySummary = document.getElementById('today-summary');
        dom.todaySummaryBody = document.getElementById('today-summary-body');
        dom.todaySummaryDate = document.getElementById('today-summary-date');
        dom.todaySummaryToggle = document.getElementById('today-summary-toggle');
        dom.todaySummaryToggleIcon = document.getElementById('today-summary-toggle-icon');
        dom.todayKills = document.getElementById('today-kills');
        dom.todayBosses = document.getElementById('today-bosses');
        dom.todayDrops = document.getElementById('today-drops');
        dom.todayDropBreakdown = document.getElementById('today-drop-breakdown');
        dom.todayLastTime = document.getElementById('today-last-time');
        dom.todayTopBosses = document.getElementById('today-top-bosses');
        dom.todayShareBtn = document.getElementById('today-share-btn');

        // === Tab System ===
        dom.bottomNav = document.getElementById('bottom-nav');
        dom.tabButtons = document.querySelectorAll('.bottom-nav-btn');
        dom.tabPanels = document.querySelectorAll('.tab-panel');
    }

    // Export
    window.App.UI.DOM = { dom, initDOM };
})();
