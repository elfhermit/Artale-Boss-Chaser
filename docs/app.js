// --- 1. 資料 (Data) ---
// 你的 bosses.json 資料
const BOSSES_JSON = [
  { "id": "boss-1", "name": "紅寶王", "respawn": "23分~30分", "minMinutes": 23, "maxMinutes": 30, "image": "placeholder.svg" },
  { "id": "boss-2", "name": "冥界幽靈", "respawn": "45分~1小時", "minMinutes": 45, "maxMinutes": 60, "image": "placeholder.svg" },
  { "id": "boss-3", "name": "巨居蟹", "respawn": "45分~1小時", "minMinutes": 45, "maxMinutes": 60, "image": "placeholder.svg" },
  { "id": "boss-4", "name": "蘑菇王", "respawn": "3小時30分~4小時", "minMinutes": 210, "maxMinutes": 240, "image": "placeholder.svg" },
  { "id": "boss-5", "name": "巴洛古", "respawn": "6小時45分~9小時", "minMinutes": 405, "maxMinutes": 540, "image": "placeholder.svg" },
  { "id": "boss-6", "name": "樹妖王", "respawn": "23分~30分", "minMinutes": 23, "maxMinutes": 30, "image": "placeholder.svg" },
  { "id": "boss-7", "name": "殭屍猴王", "respawn": "38分~45分", "minMinutes": 38, "maxMinutes": 45, "image": "placeholder.svg" },
  { "id": "boss-8", "name": "沼澤巨鱷", "respawn": "1小時30分~1小時45分", "minMinutes": 90, "maxMinutes": 105, "image": "placeholder.svg" },
  { "id": "boss-9", "name": "殭屍蘑菇王", "respawn": "3小時15分~3小時45分", "minMinutes": 195, "maxMinutes": 225, "image": "placeholder.svg" },
  { "id": "boss-10", "name": "雪山魔女", "respawn": "2小時38分~3小時", "minMinutes": 158, "maxMinutes": 180, "image": "placeholder.svg" },
  { "id": "boss-11", "name": "雪毛怪人", "respawn": "45分~1小時8分", "minMinutes": 45, "maxMinutes": 68, "image": "placeholder.svg" },
  { "id": "boss-12", "name": "厄運死神", "respawn": "45分~1小時45分", "minMinutes": 45, "maxMinutes": 105, "image": "placeholder.svg" },
  { "id": "boss-13", "name": "艾利傑", "respawn": "1小時58分~2小時8分", "minMinutes": 118, "maxMinutes": 128, "image": "placeholder.svg" },
  { "id": "boss-14", "name": "咕咕鐘", "respawn": "1小時8分~1小時30分", "minMinutes": 68, "maxMinutes": 90, "image": "placeholder.svg" },
  { "id": "boss-15", "name": "葛雷金剛", "respawn": "4小時30分~5小時50分", "minMinutes": 270, "maxMinutes": 350, "image": "placeholder.svg" },
  { "id": "boss-16", "name": "書生幽靈", "respawn": "2小時30分~5小時", "minMinutes": 150, "maxMinutes": 300, "image": "placeholder.svg" },
  { "id": "boss-17", "name": "九尾妖狐", "respawn": "3小時30分~9小時30分", "minMinutes": 210, "maxMinutes": 570, "image": "placeholder.svg" },
  { "id": "boss-18", "name": "海怒斯(左)", "respawn": "3小時~5小時", "minMinutes": 180, "maxMinutes": 300, "image": "placeholder.svg" },
  { "id": "boss-19", "name": "海怒斯(右)", "respawn": "3小時~5小時", "minMinutes": 180, "maxMinutes": 300, "image": "placeholder.svg" },
  { "id": "boss-20", "name": "仙人長老", "respawn": "1小時8分~1小時30分", "minMinutes": 68, "maxMinutes": 90, "image": "placeholder.svg" },
  { "id": "boss-21", "name": "自動警備系統", "respawn": "2小時38分~2小時53分", "minMinutes": 158, "maxMinutes": 173, "image": "placeholder.svg" },
  { "id": "boss-22", "name": "奇美拉", "respawn": "2小時~2小時15分", "minMinutes": 120, "maxMinutes": 135, "image": "placeholder.svg" },
  { "id": "boss-23", "name": "紅藍雙怪", "respawn": "1小時53分~2小時15分", "minMinutes": 113, "maxMinutes": 135, "image": "placeholder.svg" },
  { "id": "boss-24", "name": "迪特和洛依", "respawn": "2小時30分~2小時45分", "minMinutes": 150, "maxMinutes": 165, "image": "placeholder.svg" },
  { "id": "boss-25", "name": "仙人娃娃", "respawn": "2小時38分~3小時", "minMinutes": 158, "maxMinutes": 180, "image": "placeholder.svg" },
  { "id": "boss-26", "name": "肯德熊", "respawn": "1小時53分~2小時8分", "minMinutes": 113, "maxMinutes": 128, "image": "placeholder.svg" },
  { "id": "boss-27", "name": "巨大深山人蔘", "respawn": "1小時~2小時15分", "minMinutes": 60, "maxMinutes": 135, "image": "placeholder.svg" },
  { "id": "boss-28", "name": "喵怪仙人", "respawn": "2小時30分~2小時50分", "minMinutes": 150, "maxMinutes": 170, "image": "placeholder.svg" },
  { "id": "boss-29", "name": "多多", "respawn": "45分~5小時15分", "minMinutes": 45, "maxMinutes": 315, "image": "placeholder.svg" },
  { "id": "boss-30", "name": "萊伊卡", "respawn": "45分~5小時15分", "minMinutes": 45, "maxMinutes": 315, "image": "placeholder.svg" },
  { "id": "boss-31", "name": "利里諾斯", "respawn": "45分~5小時15分", "minMinutes": 45, "maxMinutes": 315, "image": "placeholder.svg" },
  { "id": "boss-32", "name": "噴火龍", "respawn": "20分~1小時", "minMinutes": 20, "maxMinutes": 60, "image": "placeholder.svg" },
  { "id": "boss-33", "name": "寒霜冰龍", "respawn": "4小時~12小時", "minMinutes": 240, "maxMinutes": 720, "image": "placeholder.svg" },
  { "id": "boss-34", "name": "格瑞芬多", "respawn": "20分~1小時", "minMinutes": 20, "maxMinutes": 60, "image": "placeholder.svg" },
  { "id": "boss-35", "name": "竹刀武士", "respawn": "1小時53分~2小時8分", "minMinutes": 113, "maxMinutes": 128, "image": "placeholder.svg" },
  { "id": "boss-36", "name": "藍色蘑菇王", "respawn": "16小時40分~31小時20分", "minMinutes": 1000, "maxMinutes": 1880, "image": "placeholder.svg" },
  { "id": "boss-37", "name": "蜈蚣大王", "respawn": "45分~2小時15分", "minMinutes": 45, "maxMinutes": 135, "image": "placeholder.svg" },
  { "id": "boss-38", "name": "黑輪王", "respawn": "13小時~17小時", "minMinutes": 780, "maxMinutes": 1020, "image": "placeholder.svg" },
  { "id": "boss-39", "name": "瘋狂喵z客", "respawn": "2小時~7小時", "minMinutes": 120, "maxMinutes": 420, "image": "placeholder.svg" }
];

// --- 2. 應用程式狀態 (State) ---
let killHistory = []; // 儲存所有擊殺紀錄
let focusedBossId = null; // 【獵人模式】當前專注的 Boss ID
let currentFilter = 'all'; // 當前篩選器
let currentSearch = ''; // 當前搜尋關鍵字
let bossData = BOSSES_JSON; // Boss 靜態資料
let timerInterval = null; // 計時器

// --- 3. DOM 元素 (*** Bug Fix ***) ---
const dom = {
    bossListContainer: document.getElementById('boss-monitoring-list'),
    historyTableBody: document.querySelector('#kill-history-table tbody'),
    historyTableTitle: document.getElementById('history-table-title'), // *** 修正：補上這個 DOM 選取 ***
    sidebar: document.getElementById('sidebar'),
    selectedBossInfo: document.getElementById('selected-boss-info'),
    killForm: document.getElementById('kill-form'),
    // killTimeInput 已移除
    channelInput: document.getElementById('channel-input'),
    hasDropInput: document.getElementById('has-drop'),
    notesInput: document.getElementById('notes'),
    submitKillBtn: document.getElementById('submit-kill-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    filterChips: document.querySelectorAll('.filter-chips .chip'),
    searchInput: document.getElementById('boss-search-input'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
};

// --- 4. 初始化 ---
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadTheme();
    loadHistory();
    renderBossCards(); // 包含更新計時器
    renderHistoryTable();
    setupEventListeners();
    startTimerLoop();
    console.log("Boss 獵人儀表板已啟動 (Ultimate Hunter Mode - Bug Fixed)");
}

function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    // 每秒更新一次計時器
    timerInterval = setInterval(updateAllTimers, 1000);
}

// --- 5. 事件監聽 (Event Listeners) ---
function setupEventListeners() {
    // 點擊 Boss 卡片 (觸發獵人模式)
    dom.bossListContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.boss-card');
        if (card) {
            selectBoss(card.dataset.bossId);
        }
    });

    // 表單提交
    dom.killForm.addEventListener('submit', handleFormSubmit);

    // 主題切換
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    // 時間微調 (已移除)
    
    // 頻道步進器
    document.getElementById('channel-sub').addEventListener('click', () => updateChannel(-1));
    document.getElementById('channel-add').addEventListener('click', () => updateChannel(1));
    
    // 頻道快速選擇
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => setChannel(chip.dataset.channel));
    });

    // 篩選器
    dom.filterChips.forEach(chip => {
        chip.addEventListener('click', () => setFilter(chip.dataset.filter));
    });
    
    // 搜尋框
    dom.searchInput.addEventListener('input', (e) => setSearch(e.target.value));

    // 清除歷史紀錄
    dom.clearHistoryBtn.addEventListener('click', clearAllHistory);

    // 歷史紀錄表的操作 (事件委派)
    dom.historyTableBody.addEventListener('click', (e) => {
        // 刪除按鈕
        if (e.target.closest('.delete-btn')) {
            const historyId = e.target.closest('tr').dataset.historyId;
            deleteHistoryEntry(historyId);
        }
    });
}

// --- 6. 核心功能 (Core Logic) ---

/**
 * 【Ultimate Hunter 模式核心】
 * 處理表單提交
 */
function handleFormSubmit(e) {
    e.preventDefault();
    if (!focusedBossId) { // 必須處於專注模式
        alert("請先選擇一個 Boss");
        return;
    }

    const currentChannel = parseInt(dom.channelInput.value);

    const newEntry = {
        id: `kill-${Date.now()}`,
        bossId: focusedBossId,
        killTime: new Date().toISOString(), // *** 關鍵修改：擷取當下時間 ***
        channel: currentChannel,
        hasDrop: dom.hasDropInput.checked,
        notes: dom.notesInput.value.trim(),
    };

    killHistory.push(newEntry);
    saveHistory();
    renderHistoryTable(); // 重繪歷史 (會保持專注)
    updateBossCard(focusedBossId); // 更新卡片計時器

    // --- 連續狩獵 (Chain Hunting) 邏輯 ---
    // 保持選中，自動準備下一次紀錄
    
    // 1. 更新時間為現在 (已移除，時間欄位不存在)
    
    // 2. 頻道自動 +1 (帶邊界檢查)
    setChannel(currentChannel + 1); 
    
    // 3. 重設掉寶
    dom.hasDropInput.checked = false;
    
    // 4. 清空備註
    dom.notesInput.value = "";
    
    console.log(`已紀錄 CH ${currentChannel}，自動準備 CH ${currentChannel + 1}`);
}

/**
 * 【獵人模式核心】
 * 選中一個 Boss，更新側邊欄表單，並觸發歷史紀錄篩選
 * @param {string} bossId 
 */
function selectBoss(bossId) {
    const oldSelected = document.querySelector('.boss-card.selected');
    
    // 點擊同一個已選中的 Boss = 取消專注
    if (oldSelected && focusedBossId === bossId) {
        focusedBossId = null;
        deselectBoss();
        renderHistoryTable(); // 重繪歷史為 "全部"
        return;
    }

    // 移除舊的 selected class
    if (oldSelected) oldSelected.classList.remove('selected');

    focusedBossId = bossId; // 設定專注
    const boss = getBossById(bossId);
    if (!boss) return;

    // 增加新的 selected class
    document.querySelector(`.boss-card[data-boss-id="${bossId}"]`)?.classList.add('selected');

    // 更新側邊欄顯示
    dom.selectedBossInfo.innerHTML = `
        <div class="boss-card-img" id="selected-boss-img">
            ${boss.name.substring(0, 2)}
        </div>
        <div>
            <div id="selected-boss-name">${boss.name}</div>
            <div id="selected-boss-respawn">${boss.respawn}</div>
        </div>
    `;

    // 【重設表單為「新狩獵」的預設值】
    // dom.killTimeInput.value = getFormattedDateTimeLocal(new Date()); // (已移除)
    dom.channelInput.value = "1"; // *每次*手動選王，都從 CH 1 開始
    dom.hasDropInput.checked = false;
    dom.notesInput.value = "";
    dom.submitKillBtn.disabled = false;
    dom.submitKillBtn.textContent = `確認新增 ${boss.name} 紀錄`;

    // *** 關鍵連動 ***
    renderHistoryTable();
}

/**
 * 取消選中，清空表單
 */
function deselectBoss() {
    const oldSelected = document.querySelector('.boss-card.selected');
    if (oldSelected) oldSelected.classList.remove('selected');
    
    focusedBossId = null;

    dom.selectedBossInfo.innerHTML = `<span id="boss-placeholder">請從左側點擊 Boss 卡片</span>`;
    dom.killForm.reset();
    // dom.killTimeInput.value = ""; // (已移除)
    dom.submitKillBtn.disabled = true;
    dom.submitKillBtn.textContent = "請先選擇 Boss";
}

/**
 * 刪除一筆歷史紀錄
 * @param {string} historyId
 */
function deleteHistoryEntry(historyId) {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    
    const entry = killHistory.find(h => h.id === historyId);
    killHistory = killHistory.filter(h => h.id !== historyId);
    
    saveHistory();
    renderHistoryTable(); // 重繪歷史 (會保持專注)
    
    // 如果刪除的是該 Boss 的最後一筆紀錄，需更新卡片
    if (entry) {
        updateBossCard(entry.bossId);
    }
}

/**
 * 清除所有歷史紀錄
 */
function clearAllHistory() {
    if (!confirm("確定要刪除 *所有* 擊殺紀錄嗎？此操作無法復原！")) return;

    killHistory = [];
    saveHistory();
    renderHistoryTable(); // 重繪為空
    renderBossCards(); // 重新渲染所有卡片
    deselectBoss(); // 清空表單
}


// --- 7. 渲染 (Rendering) ---

/**
 * 渲染所有 Boss 卡片 (僅在初始化時)
 */
function renderBossCards() {
    dom.bossListContainer.innerHTML = ""; // 清空
    const sortedBosses = [...bossData].sort((a, b) => a.name.localeCompare(b.name));
    
    for (const boss of sortedBosses) {
        const card = document.createElement('div');
        card.className = 'boss-card';
        card.dataset.bossId = boss.id;
        card.innerHTML = `
            <div class="boss-card-header">
                <div class="boss-card-img">${boss.name.substring(0, 2)}</div>
                <div class="boss-card-info">
                    <h3>${boss.name}</h3>
                    <p>${boss.respawn}</p>
                </div>
            </div>
            <div class="boss-card-status" data-status="status">狀態未知</div>
            <div class="progress-bar">
                <div class="progress-fill" data-progress="fill" style="width: 0%;"></div>
            </div>
            <div class="boss-card-footer">
                <span data-timer="timer">--:--:--</span>
                <span data-respawn-window="window"></span>
            </div>
        `;
        dom.bossListContainer.appendChild(card);
        updateBossCard(boss.id); // 更新該卡片的計時器與狀態
    }
}

/**
 * 更新單個 Boss 卡片的計時器、進度條和狀態
 * @param {string} bossId
 */
function updateBossCard(bossId) {
    const card = dom.bossListContainer.querySelector(`.boss-card[data-boss-id="${bossId}"]`);
    if (!card) return;

    const boss = getBossById(bossId);
    const latestKill = getLatestKillForBoss(bossId);
    
    const statusEl = card.querySelector('[data-status]');
    const timerEl = card.querySelector('[data-timer]');
    const windowEl = card.querySelector('[data-respawn-window]');
    const progressFill = card.querySelector('[data-progress]');
    
    let status = 'alive'; // 預設狀態

    if (!latestKill) {
        status = 'alive';
        statusEl.textContent = "🟢 已存活 (無紀錄)";
        timerEl.textContent = "立即擊殺";
        windowEl.textContent = "";
        progressFill.style.width = "100%";
    } else {
        const state = calculateTimerState(boss, latestKill);
        status = state.status;
        statusEl.textContent = state.text;
        timerEl.textContent = state.timer;
        windowEl.textContent = state.windowText;
        progressFill.style.width = `${state.progress}%`;
    }

    // 更新狀態 class (視覺降噪)
    const statusClasses = ['status-alive', 'status-warning', 'status-cooldown'];
    card.classList.remove(...statusClasses);
    card.classList.add(`status-${status}`);
    
    // 最後，套用可見度
    updateCardVisibility(card, status);
}

/**
 * 【獵人模式核心】
 * 渲染擊殺歷史紀錄表格 (根據 focusedBossId)
 */
function renderHistoryTable() {
    // *** Bug Fix Check ***
    if (!dom.historyTableBody || !dom.historyTableTitle) {
        console.error("DOM 元素 'historyTableBody' 或 'historyTableTitle' 未找到！請檢查 index.html。");
        return;
    }

    dom.historyTableBody.innerHTML = ""; // 清空
    
    let historyToShow = [...killHistory];

    // *** 檢查是否處於專注模式 ***
    if (focusedBossId) {
        historyToShow = killHistory.filter(entry => entry.bossId === focusedBossId);
        const bossName = getBossById(focusedBossId).name;
        // 更新標題，並加上 "顯示全部" 按鈕
        dom.historyTableTitle.innerHTML = `
            <span><span class="material-icons-outlined" style="font-size: 1.2rem; vertical-align: middle;">filter_center_focus</span>
            ${bossName} - 擊殺歷史</span>
            <button id="show-all-history" class="btn btn-secondary btn-small">顯示全部</button>
        `;
        
        // 幫 "顯示全部" 按鈕加上事件
        document.getElementById('show-all-history')?.addEventListener('click', () => {
            deselectBoss(); // 取消專注會自動重繪
        }, { once: true });

    } else {
        dom.historyTableTitle.innerHTML = `近期擊殺歷史紀錄`;
    }
    
    // 依擊殺時間倒序排列
    const sortedHistory = historyToShow.sort((a, b) => new Date(b.killTime) - new Date(a.killTime));

    if (sortedHistory.length === 0) {
        dom.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-disabled);">尚無紀錄</td></tr>`;
        return;
    }

    sortedHistory.forEach(entry => {
        const boss = getBossById(entry.bossId);
        if (!boss) return;

        const killTime = new Date(entry.killTime);
        const minRespawn = new Date(killTime.getTime() + boss.minMinutes * 60000);
        const maxRespawn = new Date(killTime.getTime() + boss.maxMinutes * 60000);

        const tr = document.createElement('tr');
        tr.dataset.historyId = entry.id;
        tr.innerHTML = `
            <td>${boss.name}</td>
            <td>${formatHistoryDateTime(killTime)}</td>
            <td>${entry.channel} 頻</td>
            <td class="${entry.hasDrop ? 'drop-yes' : 'drop-no'}">
                <span class="material-icons-outlined">${entry.hasDrop ? 'check_circle' : 'cancel'}</span>
            </td>
            <td>${entry.notes || '-'}</td>
            <td>${formatTime(minRespawn)} ~ ${formatTime(maxRespawn)}</td>
            <td>
                <button class="btn btn-danger btn-small btn-icon delete-btn" title="刪除紀錄">
                    <span class="material-icons-outlined">delete_outline</span>
                </button>
            </td>
        `;
        dom.historyTableBody.appendChild(tr);
    });
}

/**
 * 每秒被呼叫一次，更新所有卡片的計時器
 */
function updateAllTimers() {
    dom.bossListContainer.querySelectorAll('.boss-card').forEach(card => {
        const bossId = card.dataset.bossId;
        const boss = getBossById(bossId);
        const latestKill = getLatestKillForBoss(bossId);
        
        let status = 'alive';

        if (latestKill) {
            const state = calculateTimerState(boss, latestKill);
            status = state.status;

            // 只更新會變動的 DOM
            card.querySelector('[data-status]').textContent = state.text;
            card.querySelector('[data-timer]').textContent = state.timer;
            card.querySelector('[data-respawn-window]').textContent = state.windowText;
            card.querySelector('[data-progress]').style.width = `${state.progress}%`;
            
            // 避免重複設定 class
            if (!card.classList.contains(`status-${status}`)) {
                card.classList.remove('status-alive', 'status-warning', 'status-cooldown');
                card.classList.add(`status-${status}`);
            }
        }
        
        // 每次更新狀態後，都要檢查可見度
        updateCardVisibility(card, status);
    });
}


// --- 8. 資料處理 (Data Handling) ---

/**
 * 根據 Boss ID 和最新擊殺紀錄，計算當前狀態
 */
function calculateTimerState(boss, latestKill) {
    const now = new Date();
    const killTime = new Date(latestKill.killTime);
    
    const minRespawnTime = new Date(killTime.getTime() + boss.minMinutes * 60000);
    const maxRespawnTime = new Date(killTime.getTime() + boss.maxMinutes * 60000);
    
    const secondsToMin = (minRespawnTime - now) / 1000;
    const secondsToMax = (maxRespawnTime - now) / 1000;
    
    const totalWindowSeconds = (boss.maxMinutes - boss.minMinutes) * 60;
    const totalCooldownSeconds = boss.maxMinutes * 60;
    const secondsSinceKill = (now - killTime) / 1000;

    let status, text, timer, windowText, progress;
    
    // 狀態 1: 已存活 (超過最早重生時間)
    if (secondsToMin <= 0) {
        status = 'alive';
        text = '🟢 已存活';
        progress = 100;
        
        // 狀態 1a: 仍在重生區間內
        if (secondsToMax > 0) {
            timer = `剩 ${formatDuration(secondsToMax)} (最晚)`;
            windowText = `${formatTime(minRespawnTime)} ~ ${formatTime(maxRespawnTime)}`;
        } 
        // 狀態 1b: 已超過最晚重生時間
        else {
            timer = '立即擊殺';
            windowText = `自 ${formatTime(maxRespawnTime)} 起`;
        }
    } 
    // 狀態 2: 即將重生 (例如 10 分鐘內)
    else if (secondsToMin <= 600) { // 10 分鐘警告
        status = 'warning';
        text = '🟡 即將重生';
        timer = `剩 ${formatDuration(secondsToMin)}`;
        windowText = `${formatTime(minRespawnTime)} ~ ${formatTime(maxRespawnTime)}`;
        progress = Math.min(100, (secondsSinceKill / totalCooldownSeconds) * 100);
    } 
    // 狀態 3: 冷卻中
    else {
        status = 'cooldown';
        text = '🔴 冷卻中';
        timer = `剩 ${formatDuration(secondsToMin)}`;
        windowText = `${formatTime(minRespawnTime)} ~ ${formatTime(maxRespawnTime)}`;
        progress = Math.min(100, (secondsSinceKill / totalCooldownSeconds) * 100);
    }
    
    return { status, text, timer, windowText, progress: Math.max(0, progress) };
}

function loadHistory() {
    const historyJSON = localStorage.getItem('bossKillHistory');
    killHistory = historyJSON ? JSON.parse(historyJSON) : [];
}

function saveHistory() {
    localStorage.setItem('bossKillHistory', JSON.stringify(killHistory));
}

function loadTheme() {
    const theme = localStorage.getItem('bossTimerTheme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        dom.themeIcon.textContent = 'dark_mode';
    } else {
        document.body.classList.remove('light-mode');
        dom.themeIcon.textContent = 'light_mode';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('bossTimerTheme', 'light');
        dom.themeIcon.textContent = 'dark_mode';
    } else {
        localStorage.setItem('bossTimerTheme', 'dark');
        dom.themeIcon.textContent = 'light_mode';
    }
}


// --- 9. 篩選器與搜尋 (Filtering & Search) ---

function setFilter(filter) {
    currentFilter = filter;
    
    // 更新 chip 樣式
    dom.filterChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    updateAllCardVisibility();
}

function setSearch(term) {
    currentSearch = term.toLowerCase();
    updateAllCardVisibility();
}

/**
 * 集中處理所有卡片的可見度
 */
function updateAllCardVisibility() {
    document.querySelectorAll('.boss-card').forEach(card => {
        const bossId = card.dataset.bossId;
        const boss = getBossById(bossId);
        const latestKill = getLatestKillForBoss(bossId);
        
        let status = 'alive';
        if (latestKill) {
            status = calculateTimerState(boss, latestKill).status;
        }
        
        updateCardVisibility(card, status);
    });
}

/**
 * 根據當前篩選器和搜尋，顯示或隱藏卡片
 * @param {HTMLElement} card 
 * @param {string} status 
 */
function updateCardVisibility(card, status) {
    const matchesFilter = (currentFilter === 'all' || currentFilter === status);
    
    const bossName = getBossById(card.dataset.bossId).name;
    const matchesSearch = bossName.toLowerCase().includes(currentSearch);

    if (matchesFilter && matchesSearch) {
        card.style.display = 'block';
    } else {
        card.style.display = 'none';
    }
}


// --- 10. 輔助工具 (Utilities) ---

function getBossById(id) {
    return bossData.find(b => b.id === id);
}

function getLatestKillForBoss(bossId) {
    const kills = killHistory.filter(k => k.bossId === bossId);
    if (kills.length === 0) return null;
    return kills.sort((a, b) => new Date(b.killTime) - new Date(a.killTime))[0];
}

/**
 * 將 Date 物件轉為 YYYY-MM-DD HH:mm:ss (僅供歷史紀錄使用)
 */
function formatHistoryDateTime(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    
    const Y = date.getFullYear();
    const M = pad(date.getMonth() + 1);
    const D = pad(date.getDate());
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    
    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}


/**
 * 格式化時間 HH:mm
 */
function formatTime(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 格式化剩餘秒數為 HH:mm:ss
 */
function formatDuration(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    const pad = (num) => num.toString().padStart(2, '0');

    if (h > 0) {
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
        return `${pad(m)}:${pad(s)}`;
    }
}

/**
 * 調整表單中的時間 (已移除)
 */
// function adjustTime(minutes) { ... }

/**
 * 更新頻道輸入框
 * @param {number} delta - 變化量 (+1 或 -1)
 */
function updateChannel(delta) {
    let val = parseInt(dom.channelInput.value) || 1;
    val += delta;
    setChannel(val);
}

/**
 * 設定頻道 (含 3000 上限)
 * @param {number | string} val - 頻道號碼
 */
function setChannel(val) {
    let num = parseInt(val);
    if (isNaN(num)) num = 1;
    if (num < 1) num = 1;
    if (num > 3000) num = 3000; // 邊界檢查
    dom.channelInput.value = num;
}