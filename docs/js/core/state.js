
(function () {
    const state = {
        killHistory: [], // 儲存所有擊殺紀錄
        focusedBossId: null, // 當前專注的 Boss ID
        currentFilter: 'all', // 當前篩選器
        currentSearch: '', // 搜尋關鍵字
        currentSort: { col: 'killTime', dir: 'desc' }, // 預設排序：擊殺時間 (新->舊)
        currentPage: 1,
        pageSize: 50, // default rows per page for history table
        timerInterval: null,
        toastTimers: new Map(),

        // New Features
        viewMode: 'card', // 'card' | 'compact'
        soundEnabled: false,
        alertedBosses: new Set(), // Set<bossId> to track played sounds for current cycle
        recentBossIds: JSON.parse(localStorage.getItem('recentBossIds') || '[]'),
        smartSortActive: localStorage.getItem('smartSortActive') === 'true',
        favorites: JSON.parse(localStorage.getItem('abt_favorites_v1') || '[]'),

        // App settings (notification, sound type, onboarding, etc.)
        settings: (function () {
            const def = {
                onboarded: false,
                desktopNotification: false,
                soundType: 'ding', // 'ding' | 'bell' | 'drum'
                firstKillCelebrated: false,
                lastBackupAt: null
            };
            try {
                const raw = localStorage.getItem('abt_settings_v1');
                if (!raw) return def;
                return Object.assign(def, JSON.parse(raw));
            } catch (e) { return def; }
        })()
    };

    function loadHistory() {
        const data = localStorage.getItem('bossKillHistory');
        state.killHistory = data ? JSON.parse(data) : [];
    }

    function saveHistory() {
        localStorage.setItem('bossKillHistory', JSON.stringify(state.killHistory));
    }

    function updateRecentBoss(bossId) {
        if (!bossId) return;
        state.recentBossIds = [bossId, ...state.recentBossIds.filter(id => id !== bossId)].slice(0, 6);
        localStorage.setItem('recentBossIds', JSON.stringify(state.recentBossIds));
    }

    function saveSmartSort(active) {
        state.smartSortActive = active;
        localStorage.setItem('smartSortActive', String(active));
    }

    function saveFavorites() {
        localStorage.setItem('abt_favorites_v1', JSON.stringify(state.favorites));
    }

    function saveSettings(patch) {
        if (patch && typeof patch === 'object') {
            Object.assign(state.settings, patch);
        }
        try { localStorage.setItem('abt_settings_v1', JSON.stringify(state.settings)); } catch (e) {}
    }

    // ===== Backup / Restore (P0-01) =====
    const PERSIST_KEYS = [
        'bossKillHistory',
        'abt_favorites_v1',
        'recentBossIds',
        'abt_settings_v1',
        'theme',
        'viewMode',
        'soundEnabled',
        'lastChannel',
        'smartSortActive',
        'todaySummaryCollapsed'
    ];

    function getAllPersistData() {
        const data = {};
        PERSIST_KEYS.forEach(k => {
            const v = localStorage.getItem(k);
            if (v !== null) data[k] = v;
        });
        return {
            schemaVersion: 1,
            app: 'artale-boss-chaser',
            exportedAt: new Date().toISOString(),
            data
        };
    }

    function applyImportData(payload, mode) {
        if (!payload || !payload.data || typeof payload.data !== 'object') {
            throw new Error('資料格式無效');
        }
        if (payload.schemaVersion && payload.schemaVersion > 1) {
            throw new Error('檔案 schema 版本較新，請更新應用程式');
        }
        const incoming = payload.data;

        if (mode === 'replace') {
            PERSIST_KEYS.forEach(k => localStorage.removeItem(k));
            Object.keys(incoming).forEach(k => {
                if (PERSIST_KEYS.includes(k)) localStorage.setItem(k, incoming[k]);
            });
            return { mode: 'replace', count: Object.keys(incoming).length };
        }

        // Merge: history dedup by bossId+killTime+channel; favorites union; others keep current if present
        let mergedHistory = state.killHistory.slice();
        try {
            const incomingHistory = incoming.bossKillHistory ? JSON.parse(incoming.bossKillHistory) : [];
            const seen = new Set(mergedHistory.map(k => `${k.bossId}|${k.killTime}|${k.channel}`));
            let added = 0;
            incomingHistory.forEach(h => {
                const key = `${h.bossId}|${h.killTime}|${h.channel}`;
                if (!seen.has(key)) { mergedHistory.push(h); seen.add(key); added++; }
            });
            localStorage.setItem('bossKillHistory', JSON.stringify(mergedHistory));

            const curFav = JSON.parse(localStorage.getItem('abt_favorites_v1') || '[]');
            const incFav = incoming.abt_favorites_v1 ? JSON.parse(incoming.abt_favorites_v1) : [];
            const mergedFav = Array.from(new Set([...curFav, ...incFav])).slice(0, 8);
            localStorage.setItem('abt_favorites_v1', JSON.stringify(mergedFav));

            // Other keys: keep current; only fill missing
            ['recentBossIds', 'abt_settings_v1', 'theme', 'viewMode', 'soundEnabled', 'lastChannel', 'smartSortActive', 'todaySummaryCollapsed'].forEach(k => {
                if (incoming[k] && localStorage.getItem(k) === null) {
                    localStorage.setItem(k, incoming[k]);
                }
            });

            return { mode: 'merge', added };
        } catch (e) {
            throw new Error('合併失敗：' + e.message);
        }
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
        loadTheme, saveTheme,
        saveViewMode, saveSoundEnabled,
        loadLastChannel, saveLastChannel,
        saveFavorites, updateRecentBoss,
        saveSmartSort, saveSettings,
        getAllPersistData, applyImportData
    };
})();
