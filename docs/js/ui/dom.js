
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

        // Target Lock Mode (Desktop)
        targetLockPanel: null,
        targetBossImg: null,
        targetBossName: null,
        targetBossRespawn: null,
        unlockBossBtn: null,
        
        // Focus Mode Elements (Desktop)
        focusChannelInput: null,
        focusChSubBtn: null,
        focusChAddBtn: null,
        focusSubmitBtn: null,
        autoIncCheckbox: null,
        targetHistoryList: null,
        focusDropEquip: null,
        focusDropScroll: null,
        focusDropStar: null,

        // Batch
        batchInput: null,
        batchBtn: null,

        // New Features
        viewToggleBtn: null,
        viewIcon: null,
        soundToggleBtn: null,
        soundIcon: null,
        smartSortBtn: null,

        // 最愛 & 快選 (Desktop)
        favChipsContainer: null,
        bossSelectorDropdown: null,

        // 分享 Modal
        shareStatusBtn: null,
        shareModal: null,
        shareTextContent: null,
        shareCopyBtn: null,
        shareModalClose: null,
        shareCloseBtn2: null,

        // 篩選計數
        filterChipAll: null,
        filterChipAlive: null,
        filterChipWarning: null,
        filterChipCooldown: null,

        // === V2: Bottom Nav & Tab System ===
        bottomNav: null,
        tabButtons: [],
        tabPanels: [],

        // === V2: Mobile Record Panel ===
        mobileFavChips: null,
        mobileBossDropdown: null,
        mobileTargetLock: null,
        mobileTargetImg: null,
        mobileTargetName: null,
        mobileTargetRespawn: null,
        mobileUnlockBtn: null,
        mobileChannelInput: null,
        mobileChSubBtn: null,
        mobileChAddBtn: null,
        mobileSubmitBtn: null,
        mobileAutoInc: null,
        mobileDropEquip: null,
        mobileDropScroll: null,
        mobileDropStar: null,
        mobileTargetHistory: null,
        mobileNoBossHint: null
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

        dom.sidebar = document.getElementById('sidebar');

        // Init Target Lock Mode Elements (Desktop)
        dom.targetLockPanel = document.getElementById('target-lock-panel');
        dom.targetBossImg = document.getElementById('target-boss-img');
        dom.targetBossName = document.getElementById('target-boss-name');
        dom.targetBossRespawn = document.getElementById('target-boss-respawn');
        dom.unlockBossBtn = document.getElementById('unlock-boss-btn');
        
        // Focus Mode Init (Desktop)
        dom.focusChannelInput = document.getElementById('focus-channel-input');
        dom.focusChSubBtn = document.getElementById('focus-ch-sub');
        dom.focusChAddBtn = document.getElementById('focus-ch-add');
        dom.focusSubmitBtn = document.getElementById('focus-submit-btn');
        dom.autoIncCheckbox = document.getElementById('auto-inc-ch');
        dom.targetHistoryList = document.getElementById('target-history-list');
        dom.focusDropEquip = document.getElementById('focus-drop-equip');
        dom.focusDropScroll = document.getElementById('focus-drop-scroll');
        dom.focusDropStar = document.getElementById('focus-drop-star');

        dom.batchInput = document.getElementById('batch-channels-input');
        dom.batchBtn = document.getElementById('apply-batch-btn');

        // Init New Feature Elements
        dom.viewToggleBtn = document.getElementById('view-mode-btn');
        dom.viewIcon = document.getElementById('view-mode-icon');
        dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
        dom.soundIcon = document.getElementById('sound-toggle-icon');
        dom.smartSortBtn = document.getElementById('smart-sort-btn');

        // 最愛 & 快選 (Desktop)
        dom.favChipsContainer = document.getElementById('fav-chips-container');
        dom.bossSelectorDropdown = document.getElementById('boss-selector-dropdown');

        // 分享 Modal
        dom.shareStatusBtn = document.getElementById('share-status-btn');
        dom.shareModal = document.getElementById('share-modal');
        dom.shareTextContent = document.getElementById('share-text-content');
        dom.shareCopyBtn = document.getElementById('share-copy-btn');
        dom.shareModalClose = document.getElementById('share-modal-close');
        dom.shareCloseBtn2 = document.getElementById('share-close-btn2');

        // 篩選計數
        dom.filterChipAll = document.querySelector('.filter-chips .chip[data-filter="all"]');
        dom.filterChipAlive = document.querySelector('.filter-chips .chip[data-filter="alive"]');
        dom.filterChipWarning = document.querySelector('.filter-chips .chip[data-filter="warning"]');
        dom.filterChipCooldown = document.querySelector('.filter-chips .chip[data-filter="cooldown"]');

        // === V2: Bottom Nav & Tab System ===
        dom.bottomNav = document.getElementById('bottom-nav');
        dom.tabButtons = document.querySelectorAll('.bottom-nav-btn');
        dom.tabPanels = document.querySelectorAll('.tab-panel');

        // === V2: Mobile Record Panel ===
        dom.mobileFavChips = document.getElementById('mobile-fav-chips');
        dom.mobileBossDropdown = document.getElementById('mobile-boss-dropdown');
        dom.mobileTargetLock = document.getElementById('mobile-target-lock');
        dom.mobileTargetImg = document.getElementById('mobile-target-img');
        dom.mobileTargetName = document.getElementById('mobile-target-name');
        dom.mobileTargetRespawn = document.getElementById('mobile-target-respawn');
        dom.mobileUnlockBtn = document.getElementById('mobile-unlock-btn');
        dom.mobileChannelInput = document.getElementById('mobile-channel-input');
        dom.mobileChSubBtn = document.getElementById('mobile-ch-sub');
        dom.mobileChAddBtn = document.getElementById('mobile-ch-add');
        dom.mobileSubmitBtn = document.getElementById('mobile-submit-btn');
        dom.mobileAutoInc = document.getElementById('mobile-auto-inc');
        dom.mobileDropEquip = document.getElementById('mobile-drop-equip');
        dom.mobileDropScroll = document.getElementById('mobile-drop-scroll');
        dom.mobileDropStar = document.getElementById('mobile-drop-star');
        dom.mobileTargetHistory = document.getElementById('mobile-target-history');
        dom.mobileNoBossHint = document.getElementById('mobile-no-boss-hint');
    }

    // Export
    window.App.UI.DOM = { dom, initDOM };
})();
