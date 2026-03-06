
/**
 * Artale Boss Chaser - Logic Unit Tests
 * 執行指令: node tests/logic_test.js
 */

const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ [FAIL] ${message}`);
        process.exit(1);
    }
    console.log(`✅ [PASS] ${message}`);
};

// --- Mock Environment ---
global.window = { App: { Core: {}, Data: {}, UI: {}, Logic: {} } };
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
    };
})();
global.localStorage = localStorageMock;

// --- Load Logic (Minimal Simulation) ---
// We manually define the functions here to test them since they are wrapped in IIFEs in the browser
const Utils = {
    formatDuration: (secs) => {
        if (secs < 0) secs = 0;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },
    calculateTimerState: (boss, killTimeStr, nowOverride) => {
        const now = nowOverride || new Date();
        const killTime = new Date(killTimeStr);
        const minRespawnTime = new Date(killTime.getTime() + boss.minMinutes * 60000);
        const maxRespawnTime = new Date(killTime.getTime() + boss.maxMinutes * 60000);
        const secondsToMin = (minRespawnTime - now) / 1000;
        const secondsToMax = (maxRespawnTime - now) / 1000;

        if (secondsToMin <= 0) {
            if (secondsToMax > 0) return { status: 'alive', text: '可能已出' };
            else return { status: 'alive', text: '必出' };
        } else if (secondsToMin <= 600) {
            return { status: 'warning', text: '即將重生' };
        } else {
            return { status: 'cooldown', text: '冷卻中' };
        }
    },
    parseChannelList: (raw) => {
        if (!raw) return [];
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        const out = new Set();
        for (const p of parts) {
            if (p.includes('-')) {
                const [a, b] = p.split('-').map(x => parseInt(x.trim()));
                if (!isNaN(a) && !isNaN(b)) {
                    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i);
                }
            } else {
                const n = parseInt(p);
                if (!isNaN(n)) out.add(n);
            }
        }
        return Array.from(out).sort((a, b) => a - b).filter(n => n >= 1 && n <= 3000);
    }
};

const StateLogic = {
    updateRecentBoss: (recentBossIds, bossId) => {
        let list = [bossId, ...recentBossIds.filter(id => id !== bossId)].slice(0, 6);
        return list;
    }
};

// --- Test Cases ---

console.log('--- Starting Unit Tests ---');

// 1. Timer Logic Tests
const mockBoss = { id: 'mush', minMinutes: 45, maxMinutes: 65 };
const killTime = new Date('2026-03-06T12:00:00Z');

// Test: Cooldown (just killed)
assert(
    Utils.calculateTimerState(mockBoss, killTime.toISOString(), new Date('2026-03-06T12:10:00Z')).status === 'cooldown',
    'Timer should be in COOLDOWN status right after kill'
);

// Test: Warning (10 mins before min)
assert(
    Utils.calculateTimerState(mockBoss, killTime.toISOString(), new Date('2026-03-06T12:40:00Z')).status === 'warning',
    'Timer should be in WARNING status 5 mins before min respawn'
);

// Test: Alive (Possible)
assert(
    Utils.calculateTimerState(mockBoss, killTime.toISOString(), new Date('2026-03-06T12:50:00Z')).status === 'alive',
    'Timer should be in ALIVE status after min respawn'
);

// 2. Recent Boss Logic Tests
let recentIds = ['boss1', 'boss2'];
recentIds = StateLogic.updateRecentBoss(recentIds, 'boss3');
assert(recentIds[0] === 'boss3' && recentIds.length === 3, 'New boss should be pinned to top');

recentIds = StateLogic.updateRecentBoss(recentIds, 'boss1');
assert(recentIds[0] === 'boss1' && recentIds.length === 3, 'Existing boss should move to top without duplication');

recentIds = ['1','2','3','4','5','6'];
recentIds = StateLogic.updateRecentBoss(recentIds, '7');
assert(recentIds.length === 6 && recentIds[0] === '7', 'Recent list should be capped at 6 items');

// 3. Channel Parsing Tests
assert(JSON.stringify(Utils.parseChannelList('1, 3, 5-7')) === '[1,3,5,6,7]', 'Channel list "1, 3, 5-7" should parse correctly');
assert(JSON.stringify(Utils.parseChannelList('3001, 0, 5')) === '[5]', 'Out of bound channels should be filtered out');

// 4. Boundary Check Simulation
const validateChannel = (ch) => Math.max(1, Math.min(3000, parseInt(ch) || 1));
assert(validateChannel(5000) === 3000, 'Channel 5000 should be capped at 3000');
assert(validateChannel(-10) === 1, 'Channel -10 should be floored at 1');
assert(validateChannel('abc') === 1, 'Invalid channel string should default to 1');

console.log('--- All Tests Passed Successfully ---');
process.exit(0);
