// --- 1. 資料定義 (Data) ---
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
let focusedBossId = null; // 當前專注的 Boss ID
let currentFilter = 'all'; // 當前篩選器
let currentSearch = ''; // 搜尋關鍵字
let currentSort = { col: 'killTime', dir: 'desc' }; // 預設排序：擊殺時間 (新->舊)

let timerInterval = null; // 計時器

// --- 3. DOM 元素 ---
const dom = {
    bossListContainer: document.getElementById('boss-monitoring-list'),
    historyTableBody: document.querySelector('#kill-history-table tbody'),
    historyTableTitle: document.getElementById('history-table-title'),
    tableHeaders: document.querySelectorAll('#kill-history-table th.sortable'),
    
    selectedBossInfo: document.getElementById('selected-boss-info'),
    killForm: document.getElementById('kill-form'),
    
    channelInput: document.getElementById('channel-input'),
    hasDropInput: document.getElementById('has-drop'),
    notesInput: document.getElementById('notes'),
    submitKillBtn: document.getElementById('submit-kill-btn'),
    
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    filterChips: document.querySelectorAll('.filter-chips .chip'),
    searchInput: document.getElementById('boss-search-input'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    
    // 頻道步進器
    channelSubBtn: document.getElementById('channel-sub'),
    channelAddBtn: document.getElementById('channel-add'),
    quickChannels: document.querySelectorAll('.quick-chip')
};

// --- 4. 初始化 ---
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadTheme();
    loadHistory();
    renderBossCards();
    renderHistoryTable();
    setupEventListeners();
    startTimerLoop();
    console.log("Boss 獵人儀表板 (Pro) 已啟動");
}

function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    // 瀏覽器效能優化：每秒執行一次，但 DOM 操作最小化
    timerInterval = setInterval(updateAllTimers, 1000);
}

// --- 5. 事件監聽 (Event Listeners) ---
function setupEventListeners() {
    // 1. 點擊 Boss 卡片
    dom.bossListContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.boss-card');
        if (card) {
            selectBoss(card.dataset.bossId);
        }
    });

    // 2. 表單提交
    dom.killForm.addEventListener('submit', handleFormSubmit);

    // 3. 頻道操作
    dom.channelSubBtn.addEventListener('click', () => updateChannel(-1));
    dom.channelAddBtn.addEventListener('click', () => updateChannel(1));
    dom.quickChannels.forEach(chip => {
        chip.addEventListener('click', () => setChannel(chip.dataset.channel));
    });

    // 4. 篩選與搜尋
    dom.filterChips.forEach(chip => {
        chip.addEventListener('click', () => setFilter(chip.dataset.filter));
    });
    dom.searchInput.addEventListener('input', (e) => setSearch(e.target.value));

    // 5. 排序標題點擊
    dom.tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            if (currentSort.col === sortKey) {
                // 切換方向
                currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                // 新欄位，預設 desc (通常看最新的比較方便)
                currentSort.col = sortKey;
                currentSort.dir = 'desc';
            }
            renderHistoryTable();
            updateSortIcons();
        });
    });

    // 6. 點擊歷史紀錄列 (編輯模式)
    dom.historyTableBody.addEventListener('click', (e) => {
        // 如果點到刪除按鈕，不觸發編輯
        if (e.target.closest('.delete-btn')) return;

        const row = e.target.closest('tr');
        if (row && row.dataset.bossId) {
            const entry = killHistory.find(h => h.id === row.dataset.historyId);
            if (entry) {
                loadEntryToForm(entry);
            }
        }
    });
    
    // 7. 刪除按鈕 (事件委派)
    dom.historyTableBody.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.delete-btn');
        if (delBtn) {
            e.stopPropagation(); // 防止觸發列點擊
            const historyId = delBtn.closest('tr').dataset.historyId;
            deleteHistoryEntry(historyId);
        }
    });

    // 8. 其他
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
    dom.clearHistoryBtn.addEventListener('click', clearAllHistory);
}

// --- 6. 核心邏輯 (Core Logic) ---

/**
 * 處理表單提交：實作唯一性約束與連續狩獵邏輯
 */
function handleFormSubmit(e) {
    e.preventDefault();
    if (!focusedBossId) {
        alert("請先選擇一個 Boss");
        return;
    }

    const currentChannel = parseInt(dom.channelInput.value);
    const nowISO = new Date().toISOString();

    // [唯一性約束]：檢查是否已存在該 Boss + 該頻道的紀錄
    // 如果有，先移除舊的 (視為更新狀態)
    const existingIndex = killHistory.findIndex(
        k => k.bossId === focusedBossId && k.channel === currentChannel
    );
    
    if (existingIndex !== -1) {
        killHistory.splice(existingIndex, 1);
    }

    // 建立新紀錄
    const newEntry = {
        id: `kill-${Date.now()}`, // 用 Timestamp 當 ID
        bossId: focusedBossId,
        killTime: nowISO,
        channel: currentChannel,
        hasDrop: dom.hasDropInput.checked,
        notes: dom.notesInput.value.trim(),
    };

    killHistory.push(newEntry);
    saveHistory();
    
    // 更新 UI
    renderHistoryTable();
    updateBossCard(focusedBossId);

    // [連續狩獵]：自動準備下一次紀錄
    // 頻道+1, 重置掉寶, 清空備註
    setChannel(currentChannel + 1);
    dom.hasDropInput.checked = false;
    dom.notesInput.value = "";
}

/**
 * 選擇 Boss (切換專注模式)
 */
function selectBoss(bossId) {
    // 如果點同一個，取消專注 (Toggle)
    if (focusedBossId === bossId) {
        focusedBossId = null;
        dom.submitKillBtn.disabled = true;
        dom.submitKillBtn.textContent = "請先選擇 Boss";
        document.querySelectorAll('.boss-card').forEach(c => c.classList.remove('selected'));
        dom.selectedBossInfo.innerHTML = `<span id="boss-placeholder">請從左側點擊 Boss 卡片<br>或點擊下方列表列</span>`;
        renderHistoryTable();
        return;
    }

    focusedBossId = bossId;
    
    // 更新卡片選中樣式
    document.querySelectorAll('.boss-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.bossId === bossId);
    });

    // 更新右側面板資訊
    const boss = getBossById(bossId);
    dom.selectedBossInfo.innerHTML = `
        <div class="boss-card-img" id="selected-boss-img">
            ${boss.name.substring(0, 2)}
        </div>
        <div>
            <div id="selected-boss-name">${boss.name}</div>
            <div id="selected-boss-respawn">${boss.respawn}</div>
        </div>
    `;

    // 啟用表單
    dom.submitKillBtn.disabled = false;
    dom.submitKillBtn.textContent = `確認新增 ${boss.name} 紀錄`;
    
    // 觸發列表過濾
    renderHistoryTable();
}

/**
 * [新功能] 點擊列載入資料到表單 (方便重複紀錄)
 */
function loadEntryToForm(entry) {
    // 1. 切換到該 Boss
    if (focusedBossId !== entry.bossId) {
        selectBoss(entry.bossId);
    }
    
    // 2. 填入資料
    setChannel(entry.channel);
    dom.notesInput.value = entry.notes || "";
    // 掉寶通常是該次擊殺的結果，重複紀錄時通常是新的擊殺，所以這裡預設不勾選，或者保留原樣？
    // 根據需求 "如果該頻道王已重生，方便User重複紀錄"，應該是為了打下一隻
    // 所以這裡只帶入頻道跟備註(可能是固定隊友名單)，掉寶重置比較合理
    dom.hasDropInput.checked = false;

    // 視覺回饋：捲動到表單
    if (window.innerWidth < 900) {
        dom.sidebar.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- 7. 渲染與視圖 (Rendering) ---

/**
 * 渲染 Boss 卡片 (初始化或重新整理)
 */
function renderBossCards() {
    dom.bossListContainer.innerHTML = "";
    // 依名稱排序
    const sortedBosses = [...BOSSES_JSON].sort((a, b) => a.name.localeCompare(b.name));

    sortedBosses.forEach(boss => {
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
            <div class="boss-card-timer-block">
                <span class="boss-card-status-text" data-status="text">偵測中...</span>
                <div class="boss-card-countdown" data-timer="timer">--:--</div>
                <div class="boss-card-channel-hint" data-channel-hint="hint"></div>
            </div>
        `;
        dom.bossListContainer.appendChild(card);
        
        // 立即計算一次狀態
        updateBossCard(boss.id);
    });
}

/**
 * [核心優化] 計算並更新單張卡片狀態
 * 邏輯：找出該 Boss 所有頻道紀錄中，「最快復活」的那一個顯示
 */
function updateBossCard(bossId) {
    const card = dom.bossListContainer.querySelector(`.boss-card[data-boss-id="${bossId}"]`);
    if (!card) return;

    const records = killHistory.filter(k => k.bossId === bossId);
    const boss = getBossById(bossId);

    const statusTextEl = card.querySelector('[data-status]');
    const timerEl = card.querySelector('[data-timer]');
    const hintEl = card.querySelector('[data-channel-hint]');

    // 1. 無紀錄
    if (records.length === 0) {
        setCardState(card, 'alive', '🟢 可擊殺', '立即前往', '無紀錄');
        updateCardVisibility(card, 'alive');
        return;
    }

    // 2. 找出所有頻道的狀態，取「最優先」的
    // 優先級：已復活 (時間越久越優先) > 即將復活 (時間越短越優先) > 冷卻中 (時間越短越優先)
    
    const now = new Date();
    let bestCandidate = null;
    let minSortScore = Infinity; // 分數越小越優先

    records.forEach(record => {
        const state = calculateTimerState(boss, record.killTime);
        let score = 0;

        // 自定義評分邏輯
        if (state.status === 'alive') {
            // 已復活：分數區間 [-100000, 0]，越早復活分數越小
            // state.secondsToMin 是負數，代表已經過多久
            score = state.secondsToMin; 
        } else {
            // 冷卻中/即將復活：分數區間 [0, Infinity]，剩餘時間越短分數越小
            score = state.secondsToMin;
        }

        if (score < minSortScore) {
            minSortScore = score;
            bestCandidate = { ...state, channel: record.channel };
        }
    });

    if (bestCandidate) {
        setCardState(
            card, 
            bestCandidate.status, 
            bestCandidate.text, 
            bestCandidate.timer, 
            `Ch. ${bestCandidate.channel}` // 顯示推薦頻道
        );
        updateCardVisibility(card, bestCandidate.status);
    }
}

function setCardState(card, statusClass, text, timer, hint) {
    const statusTextEl = card.querySelector('[data-status]');
    const timerEl = card.querySelector('[data-timer]');
    const hintEl = card.querySelector('[data-channel-hint]');

    // 清除舊狀態
    card.classList.remove('status-alive', 'status-warning', 'status-cooldown');
    card.classList.add(`status-${statusClass}`);

    statusTextEl.textContent = text;
    timerEl.textContent = timer;
    hintEl.textContent = hint;
}

/**
 * 渲染歷史紀錄列表 (含排序與篩選)
 */
function renderHistoryTable() {
    // 1. 決定要顯示哪些資料
    let displayData = [...killHistory];
    if (focusedBossId) {
        displayData = displayData.filter(k => k.bossId === focusedBossId);
        dom.historyTableTitle.innerHTML = `${getBossById(focusedBossId).name} - 頻道狀態`;
    } else {
        dom.historyTableTitle.innerHTML = `各頻道狀態紀錄`;
    }

    // 2. 執行排序
    displayData.sort((a, b) => {
        let valA, valB;
        
        // 根據欄位取值
        switch(currentSort.col) {
            case 'name':
                valA = getBossById(a.bossId).name;
                valB = getBossById(b.bossId).name;
                break;
            case 'channel':
                valA = a.channel;
                valB = b.channel;
                break;
            case 'hasDrop':
                valA = a.hasDrop ? 1 : 0;
                valB = b.hasDrop ? 1 : 0;
                break;
            case 'respawn':
                // 預估復活時間排序
                valA = new Date(a.killTime).getTime() + getBossById(a.bossId).minMinutes * 60000;
                valB = new Date(b.killTime).getTime() + getBossById(b.bossId).minMinutes * 60000;
                break;
            case 'killTime':
            default:
                valA = new Date(a.killTime).getTime();
                valB = new Date(b.killTime).getTime();
                break;
        }

        if (valA < valB) return currentSort.dir === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.dir === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. 產生 HTML
    dom.historyTableBody.innerHTML = "";
    if (displayData.length === 0) {
        dom.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--color-text-disabled);">暫無資料</td></tr>`;
        return;
    }

    displayData.forEach(entry => {
        const boss = getBossById(entry.bossId);
        const killDate = new Date(entry.killTime);
        const minRespawn = new Date(killDate.getTime() + boss.minMinutes * 60000);
        const maxRespawn = new Date(killDate.getTime() + boss.maxMinutes * 60000);
        
        const tr = document.createElement('tr');
        tr.dataset.bossId = entry.bossId;
        tr.dataset.historyId = entry.id;

        tr.innerHTML = `
            <td>${boss.name}</td>
            <td>${formatTimeDisplay(killDate)}</td>
            <td><span style="font-weight:700; color:var(--color-primary);">${entry.channel}</span></td>
            <td class="${entry.hasDrop ? 'drop-yes' : 'drop-no'}">
                ${entry.hasDrop ? '有' : '無'}
            </td>
            <td style="color:var(--color-text-secondary); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${entry.notes || '-'}
            </td>
            <td>${formatTime(minRespawn)} ~ ${formatTime(maxRespawn)}</td>
            <td>
                <button class="btn btn-danger btn-small btn-icon delete-btn" title="刪除">
                    <span class="material-icons-outlined" style="font-size:16px;">delete</span>
                </button>
            </td>
        `;
        dom.historyTableBody.appendChild(tr);
    });
}

/**
 * 更新排序圖示
 */
function updateSortIcons() {
    dom.tableHeaders.forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (th.dataset.sort === currentSort.col) {
            icon.textContent = currentSort.dir === 'asc' ? '▲' : '▼';
            th.style.color = 'var(--color-primary)';
        } else {
            icon.textContent = '';
            th.style.color = '';
        }
    });
}


// --- 8. 輔助計算與工具 ---

/**
 * 計算計時器狀態
 */
function calculateTimerState(boss, killTimeStr) {
    const now = new Date();
    const killTime = new Date(killTimeStr);
    
    const minRespawnTime = new Date(killTime.getTime() + boss.minMinutes * 60000);
    const maxRespawnTime = new Date(killTime.getTime() + boss.maxMinutes * 60000);
    
    const secondsToMin = (minRespawnTime - now) / 1000;
    const secondsToMax = (maxRespawnTime - now) / 1000;

    if (secondsToMin <= 0) {
        if (secondsToMax > 0) {
            // 正在重生區間內
            return { 
                status: 'alive', 
                text: '🟢 可能已出', 
                timer: `區間剩 ${formatDuration(secondsToMax)}`,
                secondsToMin: secondsToMin 
            };
        } else {
            // 超過最晚時間
            return { 
                status: 'alive', 
                text: '🟢 必出', 
                timer: '立即前往',
                secondsToMin: secondsToMin 
            };
        }
    } else if (secondsToMin <= 600) { // 10分鐘內
        return { 
            status: 'warning', 
            text: '🟡 即將重生', 
            timer: formatDuration(secondsToMin),
            secondsToMin: secondsToMin 
        };
    } else {
        return { 
            status: 'cooldown', 
            text: '🔴 冷卻中', 
            timer: formatDuration(secondsToMin),
            secondsToMin: secondsToMin 
        };
    }
}

// 統一更新所有計時器 (每秒呼叫)
function updateAllTimers() {
    // 只更新目前畫面上有顯示的卡片
    const visibleCards = document.querySelectorAll('.boss-card[style*="display: block"]');
    if (visibleCards.length === 0 && currentFilter === 'all' && currentSearch === '') {
        // 如果全部都顯示
        BOSSES_JSON.forEach(b => updateBossCard(b.id));
    } else {
        // 針對 DOM 存在的更新
        visibleCards.forEach(card => updateBossCard(card.dataset.bossId));
    }
}

// --- 資料存取與格式化 ---
function loadHistory() {
    const data = localStorage.getItem('bossKillHistory');
    killHistory = data ? JSON.parse(data) : [];
}

function saveHistory() {
    localStorage.setItem('bossKillHistory', JSON.stringify(killHistory));
}

function clearAllHistory() {
    if(confirm("確定要清空所有紀錄嗎？")) {
        killHistory = [];
        saveHistory();
        renderHistoryTable();
        updateAllTimers();
        dom.selectedBossInfo.innerHTML = `<span id="boss-placeholder">已清空</span>`;
    }
}

function deleteHistoryEntry(id) {
    if(confirm("刪除此筆紀錄？")) {
        const index = killHistory.findIndex(k => k.id === id);
        if (index !== -1) {
            const bossId = killHistory[index].bossId;
            killHistory.splice(index, 1);
            saveHistory();
            renderHistoryTable();
            updateBossCard(bossId);
        }
    }
}

// 格式化工具
function getBossById(id) { return BOSSES_JSON.find(b => b.id === id); }

function formatTimeDisplay(date) {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return isToday ? timeStr : `${date.getMonth()+1}/${date.getDate()} ${timeStr}`;
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDuration(secs) {
    if (secs < 0) secs = 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
}

function pad(n) { return n.toString().padStart(2, '0'); }

// UI 操作工具
function updateChannel(delta) {
    let val = parseInt(dom.channelInput.value) || 1;
    setChannel(val + delta);
}

function setChannel(val) {
    let num = parseInt(val);
    if (num < 1) num = 1;
    if (num > 3000) num = 3000;
    dom.channelInput.value = num;
}

function setFilter(filter) {
    currentFilter = filter;
    dom.filterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
    updateCardVisibility();
}

function setSearch(val) {
    currentSearch = val.toLowerCase();
    updateCardVisibility();
}

function updateCardVisibility(specificCard = null, specificStatus = null) {
    const cards = specificCard ? [specificCard] : document.querySelectorAll('.boss-card');
    
    cards.forEach(card => {
        // 如果只更新特定卡片，不需要重算狀態，直接用傳入的狀態
        // 如果是全面更新，則需重新檢查 DOM class
        let status = specificStatus;
        if (!status) {
            if (card.classList.contains('status-alive')) status = 'alive';
            else if (card.classList.contains('status-warning')) status = 'warning';
            else status = 'cooldown';
        }

        const bossName = getBossById(card.dataset.bossId).name.toLowerCase();
        const matchesSearch = bossName.includes(currentSearch);
        const matchesFilter = currentFilter === 'all' || currentFilter === status;

        card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
    });
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        dom.themeIcon.textContent = 'dark_mode';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    dom.themeIcon.textContent = isLight ? 'dark_mode' : 'light_mode';
}