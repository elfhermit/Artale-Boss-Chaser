
(function () {
    const state = {
        killHistory: [], // 儲存所有擊殺紀錄
        focusedBossId: null, // 當前專注的 Boss ID
        currentFilter: 'all', // 當前篩選器
        currentSearch: '', // 搜尋關鍵字
        currentSort: { col: 'killTime', dir: 'desc' }, // 預設排序：擊殺時間 (新->舊)
        presets: [], // quick presets
        currentPage: 1,
        pageSize: 50, // default rows per page for history table
        timerInterval: null,
        toastTimers: new Map(),

        // New Features
        viewMode: 'card', // 'card' | 'compact'
        soundEnabled: false,
        alertedBosses: new Set() // Set<bossId> to track played sounds for current cycle
    };

    function loadHistory() {
        const data = localStorage.getItem('bossKillHistory');
        state.killHistory = data ? JSON.parse(data) : [];
    }

    function saveHistory() {
        localStorage.setItem('bossKillHistory', JSON.stringify(state.killHistory));
    }

    function loadPresets() {
        try {
            const raw = localStorage.getItem('quickPresets');
            state.presets = raw ? JSON.parse(raw) : [];
        } catch (e) { state.presets = []; }
    }

    function savePresets() {
        try { localStorage.setItem('quickPresets', JSON.stringify(state.presets)); } catch (e) { }
    }

    function loadTheme() {
        // Load Theme
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-mode');
        }

        // Load View Mode
        const savedView = localStorage.getItem('viewMode');
        if (savedView) state.viewMode = savedView;

        // Load Sound
        const savedSound = localStorage.getItem('soundEnabled');
        state.soundEnabled = savedSound === 'true';
    }

    function saveTheme(isLight) {
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    function saveViewMode(mode) {
        state.viewMode = mode;
        localStorage.setItem('viewMode', mode);
    }

    function saveSoundEnabled(enabled) {
        state.soundEnabled = enabled;
        localStorage.setItem('soundEnabled', String(enabled));
    }

    function loadLastChannel() {
        try {
            return localStorage.getItem('lastChannel');
        } catch (e) { return null; }
    }

    function saveLastChannel(channel) {
        try { localStorage.setItem('lastChannel', String(channel)); } catch (e) { }
    }

    // Export
    window.App.Core.State = {
        state,
        loadHistory, saveHistory,
        loadPresets, savePresets,
        loadTheme, saveTheme,
        saveViewMode, saveSoundEnabled,
        loadLastChannel, saveLastChannel
    };
})();
