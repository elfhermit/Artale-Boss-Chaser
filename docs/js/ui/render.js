
(function () {
    // Shortcuts
    const getBossById = (id) => window.App.Core.Utils.getBossById(window.App.Data.Bosses, id);
    const { formatTimeDisplay, formatTime, calculateTimerState, formatDuration } = window.App.Core.Utils;

    function renderBossCards() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;

        dom.bossListContainer.innerHTML = "";

        // Handle View Mode Class
        if (state.viewMode === 'compact') {
            dom.bossListContainer.classList.add('compact');
        } else {
            dom.bossListContainer.classList.remove('compact');
        }

        // Apply View Mode Icon Update
        if (dom.viewIcon) {
            dom.viewIcon.textContent = state.viewMode === 'compact' ? 'view_list' : 'grid_view';
            dom.viewToggleBtn.classList.toggle('active', state.viewMode === 'compact');
            dom.viewToggleBtn.title = state.viewMode === 'compact' ? '切換為網格檢視' : '切換為清單檢視';
        }

        // Apply Sound Icon Update
        if (dom.soundIcon) {
            dom.soundIcon.textContent = state.soundEnabled ? 'volume_up' : 'volume_off';
            dom.soundToggleBtn.classList.toggle('active', state.soundEnabled);
        }

        // Determine sorting order
        // Check if smart sort is requested via a temporary flag or if we just want to sort by name by default
        let displayBosses = [...BOSSES_JSON];

        // If Smart Sort is active (we can store this in state too, or just re-sort here if needed)
        // For now, let's assume the order in DOM is controlled here.
        // If the user clicked "Smart Sort", we re-order displayBosses.
        if (state.smartSortActive) {
            // Calculate imminent respawns for sorting
            const timerData = new Map();
            displayBosses.forEach(boss => {
                const records = state.killHistory.filter(k => k.bossId === boss.id);
                if (records.length === 0) {
                    timerData.set(boss.id, -999999); // No record = low priority or high? Usually low priority in "Respawn" sort, but actually "Alive" is high priority.
                    // Let's say: Alive (Sure) > Alive (Range) > Warning > Cooldown
                    // No record = Alive (Sure) effectively.
                } else {
                    let minSeconds = Infinity;
                    records.forEach(r => {
                        const ts = calculateTimerState(boss, r.killTime);
                        if (ts.secondsToMin < minSeconds) minSeconds = ts.secondsToMin;
                    });
                    timerData.set(boss.id, minSeconds);
                }
            });

            displayBosses.sort((a, b) => {
                const scoreA = timerData.get(a.id);
                const scoreB = timerData.get(b.id);
                return scoreA - scoreB; // Smallest seconds (most negative or smallest positive) first
            });
        } else {
            // Default Name Sort
            displayBosses.sort((a, b) => a.name.localeCompare(b.name));
        }


        displayBosses.forEach(boss => {
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
                <!-- Compact view re-ordering handled by CSS via Flexbox orders if needed, or DOM structure -->
                
                <div class="boss-card-timer-block">
                    <span class="boss-card-status-text" data-status="text">偵測中...</span>
                    <div class="boss-card-countdown" data-timer="timer">--:--</div>
                    <div class="boss-card-channel-hint" data-channel-hint="hint"></div>
                    <div class="boss-card-progress" data-progress><div class="bar" style="width:0%"></div></div>
                    <div class="boss-card-channels" data-channels></div>
                </div>
                <button class="quick-kill-btn" data-boss-id="${boss.id}" title="一鍵紀錄">Quick</button>
            `;
            dom.bossListContainer.appendChild(card);
            updateBossCard(boss.id);
        });

        // Restore selection visualization
        if (state.focusedBossId) {
            const card = dom.bossListContainer.querySelector(`.boss-card[data-boss-id="${state.focusedBossId}"]`);
            if (card) card.classList.add('selected');
            renderTargetLock(state.focusedBossId);
        } else {
            dom.targetLockPanel.style.display = 'none';
            dom.selectedBossInfo.style.display = 'flex';
            dom.killForm.style.display = 'block';
        }
    }

    function renderTargetLock(bossId) {
        const { dom } = window.App.UI.DOM;
        const boss = getBossById(bossId);
        if (!boss) return;

        dom.targetLockPanel.style.display = 'block';
        dom.selectedBossInfo.style.display = 'none';
        dom.killForm.style.display = 'none';

        dom.targetBossImg.textContent = boss.name.substring(0, 2);
        dom.targetBossName.textContent = boss.name;
        dom.targetBossRespawn.textContent = `重生週期: ${boss.respawn}`;

        // Initialize input with current state if needed
        if (!dom.focusChannelInput.value) {
            dom.focusChannelInput.value = window.App.Core.State.state.lastChannel || 1;
        }

        renderTargetHistory(bossId);
    }

    function renderTargetHistory(bossId) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const { calculateTimerState } = window.App.Core.Utils;
        const boss = getBossById(bossId);

        dom.targetHistoryList.innerHTML = '';

        // Filter history for this specific boss, sorted by time desc
        const relevant = state.killHistory
            .filter(k => k.bossId === bossId)
            .sort((a, b) => new Date(b.killTime) - new Date(a.killTime));

        if (relevant.length === 0) {
            dom.targetHistoryList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-disabled); font-style:italic;">尚無此 Boss 的紀錄</div>';
            return;
        }

        relevant.forEach(record => {
            const ts = calculateTimerState(boss, record.killTime);
            const item = document.createElement('div');
            item.className = 'target-history-item';
            
            let dropHtml = '';
            if (record.drops) {
                if (record.drops.equip) dropHtml += '<span class="material-icons-outlined drop-icon equip" title="裝備">shield</span>';
                if (record.drops.scroll) dropHtml += '<span class="material-icons-outlined drop-icon scroll" title="卷軸">description</span>';
                if (record.drops.star) dropHtml += '<span class="material-icons-outlined drop-icon star" title="大寶物">stars</span>';
            }

            item.innerHTML = `
                <div class="history-ch-badge">
                    CH.${record.channel}
                    <div class="history-drops">${dropHtml}</div>
                </div>
                <div class="history-time-info">
                    <span class="history-status-tag tag-${ts.status}">${ts.text}</span>
                    <span class="history-countdown">${ts.timer}</span>
                </div>
            `;
            dom.targetHistoryList.appendChild(item);
        });
    }

    function updateBossCard(bossId) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;

        const card = dom.bossListContainer.querySelector(`.boss-card[data-boss-id="${bossId}"]`);
        if (!card) return;

        const records = state.killHistory.filter(k => k.bossId === bossId);
        const boss = getBossById(bossId);

        if (records.length === 0) {
            setCardState(card, 'alive', '🟢 可擊殺', '立即前往', '無紀錄');
            updateCardVisibility(card, 'alive');
            return;
        }

        let bestCandidate = null;
        let minSortScore = Infinity;

        records.forEach(record => {
            const timerState = calculateTimerState(boss, record.killTime);
            let score = timerState.secondsToMin;
            if (score < minSortScore) {
                minSortScore = score;
                bestCandidate = { ...timerState, channel: record.channel };
            }
        });

        if (bestCandidate) {
            setCardState(card, bestCandidate.status, bestCandidate.text, bestCandidate.timer, `Ch. ${bestCandidate.channel}`);
            updateCardVisibility(card, bestCandidate.status);
        }

        renderCardExtras(card, boss, records);
    }

    function renderCardExtras(card, boss, records) {
        const channelsEl = card.querySelector('[data-channels]');
        if (channelsEl) {
            channelsEl.innerHTML = '';
            const recent = [...records].sort((a, b) => new Date(b.killTime) - new Date(a.killTime));
            const seen = new Set();
            for (const r of recent) {
                if (seen.has(r.channel)) continue;
                seen.add(r.channel);
                const span = document.createElement('div'); span.className = 'ch-badge';
                span.textContent = `Ch.${r.channel}`;
                channelsEl.appendChild(span);
                if (seen.size >= 3) break;
            }
        }

        const progressEl = card.querySelector('[data-progress] .bar');
        if (progressEl) {
            let minSecondsToMax = Infinity;
            const now = new Date();
            records.forEach(r => {
                const killDate = new Date(r.killTime);
                const maxRespawn = new Date(killDate.getTime() + boss.maxMinutes * 60000);
                const secondsToMax = (maxRespawn - now) / 1000;
                if (secondsToMax < minSecondsToMax) minSecondsToMax = secondsToMax;
            });
            const totalMaxSec = boss.maxMinutes * 60;
            let percent = 0;
            if (minSecondsToMax !== Infinity) {
                const passed = Math.max(0, totalMaxSec - minSecondsToMax);
                percent = Math.min(100, Math.round((passed / totalMaxSec) * 100));
            }
            progressEl.style.width = percent + '%';
        }
    }

    function setCardState(card, statusClass, text, timer, hint) {
        const statusTextEl = card.querySelector('[data-status]');
        const timerEl = card.querySelector('[data-timer]');
        const hintEl = card.querySelector('[data-channel-hint]');

        card.classList.remove('status-alive', 'status-warning', 'status-cooldown');
        card.classList.add(`status-${statusClass}`);

        statusTextEl.textContent = text;
        timerEl.textContent = timer;
        hintEl.textContent = hint;
    }

    function updateCardVisibility(specificCard = null, specificStatus = null) {
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const cards = specificCard ? [specificCard] : document.querySelectorAll('.boss-card');

        cards.forEach(card => {
            let status = specificStatus;
            if (!status) {
                if (card.classList.contains('status-alive')) status = 'alive';
                else if (card.classList.contains('status-warning')) status = 'warning';
                else status = 'cooldown';
            }

            const bossName = getBossById(card.dataset.bossId).name.toLowerCase();
            const matchesSearch = bossName.includes(state.currentSearch.toLowerCase());
            const matchesFilter = state.currentFilter === 'all' || state.currentFilter === status;

            card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        });
    }

    function renderHistoryTable() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;

        // 1. 決定要顯示哪些資料
        let displayData = [...state.killHistory];
        if (state.focusedBossId) {
            displayData = displayData.filter(k => k.bossId === state.focusedBossId);
            dom.historyTableTitle.innerHTML = `${getBossById(state.focusedBossId).name} - 頻道狀態`;
        } else {
            dom.historyTableTitle.innerHTML = `各頻道狀態紀錄`;
        }

        // 2. 執行排序
        displayData.sort((a, b) => {
            let valA, valB;
            switch (state.currentSort.col) {
                case 'name':
                    valA = getBossById(a.bossId).name;
                    valB = getBossById(b.bossId).name;
                    break;
                case 'channel': valA = a.channel; valB = b.channel; break;
                case 'hasDrop': valA = a.hasDrop ? 1 : 0; valB = b.hasDrop ? 1 : 0; break;
                case 'respawn':
                    valA = new Date(a.killTime).getTime() + getBossById(a.bossId).minMinutes * 60000;
                    valB = new Date(b.killTime).getTime() + getBossById(b.bossId).minMinutes * 60000;
                    break;
                case 'killTime':
                default:
                    valA = new Date(a.killTime).getTime();
                    valB = new Date(b.killTime).getTime();
                    break;
            }
            if (valA < valB) return state.currentSort.dir === 'asc' ? -1 : 1;
            if (valA > valB) return state.currentSort.dir === 'asc' ? 1 : -1;
            return 0;
        });

        dom.historyTableBody.innerHTML = "";
        if (displayData.length === 0) {
            dom.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--color-text-disabled);">暫無資料</td></tr>`;
            renderPaginationControls(0, 0);
            return;
        }

        const total = displayData.length;
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const start = (state.currentPage - 1) * state.pageSize;
        const pageItems = displayData.slice(start, start + state.pageSize);

        pageItems.forEach(entry => {
            const boss = getBossById(entry.bossId);
            const killDate = new Date(entry.killTime);
            const minRespawn = new Date(killDate.getTime() + boss.minMinutes * 60000);
            const maxRespawn = new Date(killDate.getTime() + boss.maxMinutes * 60000);

            let dropHtml = '';
            if (entry.drops) {
                if (entry.drops.equip) dropHtml += '<span class="material-icons-outlined drop-icon equip" title="裝備" style="font-size:16px;">shield</span>';
                if (entry.drops.scroll) dropHtml += '<span class="material-icons-outlined drop-icon scroll" title="卷軸" style="font-size:16px;">description</span>';
                if (entry.drops.star) dropHtml += '<span class="material-icons-outlined drop-icon star" title="大寶物" style="font-size:16px;">stars</span>';
            } else if (entry.hasDrop) {
                dropHtml = '<span class="material-icons-outlined" style="font-size:16px; color:var(--color-success);">check_circle</span>';
            } else {
                dropHtml = '<span style="color:var(--color-text-disabled); opacity:0.5;">-</span>';
            }

            const tr = document.createElement('tr');
            tr.dataset.bossId = entry.bossId;
            tr.dataset.historyId = entry.id;
            tr.innerHTML = `
                <td>${boss.name}</td>
                <td>${formatTimeDisplay(killDate)}</td>
                <td><span style="font-weight:700; color:var(--color-primary);">${entry.channel}</span></td>
                <td>${dropHtml}</td>
                <td style="color:var(--color-text-secondary); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${entry.notes || '-'}</td>
                <td>${formatTime(minRespawn)} ~ ${formatTime(maxRespawn)}</td>
                <td><button class="btn btn-danger btn-small btn-icon delete-btn" title="刪除"><span class="material-icons-outlined" style="font-size:16px;">delete</span></button></td>
            `;
            dom.historyTableBody.appendChild(tr);
        });
        renderPaginationControls(total, totalPages);
    }

    function renderPaginationControls(totalItems, totalPages) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.historyPagination) return;
        dom.historyPagination.innerHTML = '';
        if (totalItems === 0) return;

        const prev = document.createElement('button'); prev.className = 'btn btn-secondary btn-small'; prev.textContent = '‹ Prev';
        prev.disabled = state.currentPage <= 1;
        prev.addEventListener('click', () => { if (state.currentPage > 1) { state.currentPage--; renderHistoryTable(); } });

        const next = document.createElement('button'); next.className = 'btn btn-secondary btn-small'; next.textContent = 'Next ›';
        next.disabled = state.currentPage >= totalPages;
        next.addEventListener('click', () => { if (state.currentPage < totalPages) { state.currentPage++; renderHistoryTable(); } });

        const info = document.createElement('div'); info.style.color = 'var(--color-text-secondary)'; info.textContent = `第 ${state.currentPage} / ${totalPages} 頁（共 ${totalItems} 筆）`;

        const sizeSelect = document.createElement('select'); sizeSelect.style.marginLeft = '8px';
        [20, 50, 100, 200].forEach(s => {
            const o = document.createElement('option'); o.value = s; o.textContent = `${s}/頁`;
            if (s === state.pageSize) o.selected = true;
            sizeSelect.appendChild(o);
        });
        sizeSelect.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value);
            state.currentPage = 1;
            renderHistoryTable();
        });

        dom.historyPagination.appendChild(prev);
        dom.historyPagination.appendChild(info);
        dom.historyPagination.appendChild(sizeSelect);
        dom.historyPagination.appendChild(next);
    }

    function updateSortIcons() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        dom.tableHeaders.forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (th.dataset.sort === state.currentSort.col) {
                icon.textContent = state.currentSort.dir === 'asc' ? '▲' : '▼';
                th.style.color = 'var(--color-primary)';
            } else {
                icon.textContent = '';
                th.style.color = '';
            }
        });
    }

    function updateAllTimers() {
        const { state, saveSoundEnabled } = window.App.Core.State;
        const { playNotificationSound, calculateTimerState } = window.App.Core.Utils;
        const BOSSES_JSON = window.App.Data.Bosses;

        let shouldSort = false;

        BOSSES_JSON.forEach(boss => {
            // Only update UI for visible cards to save perf? No, need to check audio for all.
            updateBossCard(boss.id);

            // Check Audio Alert
            if (state.soundEnabled) {
                const records = state.killHistory.filter(k => k.bossId === boss.id);
                let minSeconds = Infinity;
                records.forEach(r => {
                    const ts = calculateTimerState(boss, r.killTime);
                    if (ts.secondsToMin < minSeconds) minSeconds = ts.secondsToMin;
                });

                // Alert if entering warning zone (e.g. 120s to 121s was boundary, now < 120)
                // or just < 2 mins (120s) and not yet alerted.
                if (minSeconds < 120 && minSeconds > 0) {
                    if (!state.alertedBosses.has(boss.id)) {
                        playNotificationSound();
                        state.alertedBosses.add(boss.id);
                    }
                } else if (minSeconds > 120) {
                    // Reset alert if time > 2 mins (e.g. wrong entry deleted or just initialized)
                    state.alertedBosses.delete(boss.id);
                }
            }
        });

    }

    function renderPresets() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.presetsList) return;
        dom.presetsList.innerHTML = '';
        if (state.presets.length === 0) {
            dom.presetsList.innerHTML = '<div style="color:var(--color-text-disabled);">尚無範本</div>';
            return;
        }
        state.presets.forEach(p => {
            const el = document.createElement('div');
            el.className = 'preset-item';
            el.innerHTML = `<div style="font-size:0.95rem">${p.name}</div><div style="display:flex; gap:8px"><button class="btn btn-secondary btn-small apply-preset" data-preset-id="${p.id}">套用</button><button class="btn btn-danger btn-small del-preset" data-preset-id="${p.id}">刪除</button></div>`;
            dom.presetsList.appendChild(el);
        });
    }

    window.App.UI.Render = {
        renderBossCards, updateBossCard, updateCardVisibility, renderHistoryTable, updateSortIcons, updateAllTimers, renderPresets
    };
})();
