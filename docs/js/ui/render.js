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

        // Apply UI state for Smart Sort button
        if (dom.smartSortBtn) {
            dom.smartSortBtn.classList.toggle('active', state.smartSortActive);
        }

        // --- Improved Sorting Logic ---
        let displayBosses = [...BOSSES_JSON];

        // 1. Filter by Search
        if (state.currentSearch) {
            displayBosses = displayBosses.filter(b => b.name.toLowerCase().includes(state.currentSearch.toLowerCase()));
        }

        // 2. Sort Logic
        if (state.smartSortActive) {
            const timerData = new Map();
            displayBosses.forEach(boss => {
                const records = state.killHistory.filter(k => k.bossId === boss.id);
                if (records.length === 0) {
                    timerData.set(boss.id, -999999); 
                } else {
                    let minSeconds = Infinity;
                    records.forEach(r => {
                        const ts = calculateTimerState(boss, r.killTime);
                        if (ts.secondsToMin < minSeconds) minSeconds = ts.secondsToMin;
                    });
                    timerData.set(boss.id, minSeconds);
                }
            });
            displayBosses.sort((a, b) => timerData.get(a.id) - timerData.get(b.id));
        } else {
            displayBosses.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
        }

        // 3. Separate Recent Bosses (Only when NOT searching)
        const recentOnes = !state.currentSearch ? displayBosses.filter(b => state.recentBossIds.includes(b.id))
            .sort((a, b) => state.recentBossIds.indexOf(a.id) - state.recentBossIds.indexOf(b.id)) : [];
        
        const otherOnes = !state.currentSearch ? displayBosses.filter(b => !state.recentBossIds.includes(b.id)) : displayBosses;

        // Render Recent Section
        if (recentOnes.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'boss-list-divider';
            divider.innerHTML = '<span class="material-icons-outlined">history</span> 最近獵殺';
            dom.bossListContainer.appendChild(divider);
            
            recentOnes.forEach(boss => createBossCard(boss, true));

            const divider2 = document.createElement('div');
            divider2.className = 'boss-list-divider';
            divider2.innerHTML = '<span class="material-icons-outlined">list</span> 全部 Boss';
            divider2.style.marginTop = '16px';
            dom.bossListContainer.appendChild(divider2);
        }

        otherOnes.forEach(boss => createBossCard(boss, false));

        // Restore selection visualization
        if (state.focusedBossId) {
            const card = dom.bossListContainer.querySelector(`.boss-card[data-boss-id="${state.focusedBossId}"]`);
            if (card) card.classList.add('selected');
            renderActionBar(state.focusedBossId);
        } else {
            if (dom.actionBar) dom.actionBar.style.display = 'none';
            document.body.classList.remove('has-action-bar');
        }
    }

    function createBossCard(boss, isRecent) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const card = document.createElement('div');
        card.className = 'boss-card';
        if (isRecent) card.classList.add('is-recent');
        card.dataset.bossId = boss.id;

        const isFav = state.favorites.includes(boss.id);
        // Get last used channel for this boss from history
        const bossRecords = state.killHistory.filter(k => k.bossId === boss.id)
            .sort((a, b) => new Date(b.killTime) - new Date(a.killTime));
        const lastCh = bossRecords.length > 0 ? bossRecords[0].channel : 1;

        card.innerHTML = `
            <div class="boss-card-header">
                <div class="boss-card-img">${boss.name.substring(0, 2)}</div>
                <div class="boss-card-info">
                    <h3>${boss.name}</h3>
                    <p>${boss.respawn}</p>
                </div>
                <button class="fav-toggle-btn${isFav ? ' is-fav' : ''}" data-boss-id="${boss.id}" title="${isFav ? '移除常用' : '加入常用'}">
                    <span class="material-icons-outlined">${isFav ? 'star' : 'star_border'}</span>
                </button>
            </div>
            <div class="boss-card-timer-block">
                <span class="boss-card-status-text" data-status="text">偵測中...</span>
                <div class="boss-card-countdown" data-timer="timer">--:--</div>
                <div class="boss-card-channel-hint" data-channel-hint="hint"></div>
                <div class="boss-card-progress" data-progress><div class="bar" style="width:0%"></div></div>
                <div class="boss-card-channels" data-channels></div>
            </div>
            <div class="card-quick-panel" data-quick-panel>
                <input type="number" class="quick-ch-input" min="1" max="3000" placeholder="Ch." value="${lastCh}" data-boss-id="${boss.id}" title="輸入頻道">
                <button class="quick-kill-btn" data-boss-id="${boss.id}" title="快速紀錄此頻道">
                    <span class="material-icons-outlined">bolt</span>
                </button>
            </div>
        `;
        dom.bossListContainer.appendChild(card);
        updateBossCard(boss.id);
    }

    function renderActionBar(bossId) {
        const { dom } = window.App.UI.DOM;
        const boss = getBossById(bossId);
        if (!boss) return;

        if (dom.actionBar) {
            dom.actionBar.style.display = 'block';
            document.body.classList.add('has-action-bar');
        }

        if (dom.actionTargetImg) dom.actionTargetImg.textContent = boss.name.substring(0, 2);
        if (dom.actionTargetName) dom.actionTargetName.textContent = boss.name;
        if (dom.actionTargetRespawn) dom.actionTargetRespawn.textContent = `重生週期: ${boss.respawn}`;

        // Sync channel input
        if (dom.actionChannelInput && !dom.actionChannelInput.value) {
            dom.actionChannelInput.value = window.App.Core.State.state.lastChannel || 1;
        }

        renderTargetHistory(bossId);
    }

    function renderTargetHistory(bossId) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const { calculateTimerState } = window.App.Core.Utils;
        const boss = getBossById(bossId);

        if (!dom.actionHistoryList) return;
        dom.actionHistoryList.innerHTML = '';

        // Filter history for this specific boss, sorted by time desc
        const relevant = state.killHistory
            .filter(k => k.bossId === bossId)
            .sort((a, b) => new Date(b.killTime) - new Date(a.killTime));

        if (relevant.length === 0) {
            dom.actionHistoryList.innerHTML = '<div style="text-align:center; padding:10px; color:var(--color-text-disabled); font-style:italic;">尚無紀錄</div>';
            return;
        }

        relevant.forEach(record => {
            dom.actionHistoryList.appendChild(createHistoryItem(boss, record));
        });
    }

    // Shared helper to create a target history item element
    function createHistoryItem(boss, record) {
        const { calculateTimerState } = window.App.Core.Utils;
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
        return item;
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

            const bossData = getBossById(card.dataset.bossId);
            if (!bossData) return;
            const bossName = bossData.name.toLowerCase();
            const matchesSearch = bossName.includes(state.currentSearch.toLowerCase());
            const matchesFilter = state.currentFilter === 'all' || state.currentFilter === status;

            card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        });
    }

    function isMobileWidth() {
        return window.matchMedia && window.matchMedia('(max-width: 880px)').matches;
    }

    function renderHistoryTable() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;

        // P2-09 · empty state when no records at all
        const tableContainer = document.querySelector('#kill-history-section .table-container');
        let emptyEl = document.getElementById('history-empty-state');
        if (state.killHistory.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (dom.historyPagination) dom.historyPagination.style.display = 'none';
            if (!emptyEl) {
                emptyEl = document.createElement('div');
                emptyEl.id = 'history-empty-state';
                emptyEl.className = 'empty-state';
                emptyEl.innerHTML = `
                    <div class="empty-icon">📜</div>
                    <h4>還沒有任何擊殺紀錄</h4>
                    <p>先到 Boss 列表選一隻目標<br>按 Enter 即可秒速紀錄第一筆</p>
                    <button class="btn btn-primary" id="empty-goto-bosses">→ 前往 Boss 列表</button>
                `;
                const section = document.getElementById('kill-history-section');
                if (section) section.appendChild(emptyEl);
                const goto = emptyEl.querySelector('#empty-goto-bosses');
                if (goto) goto.addEventListener('click', () => {
                    window.App.Logic.Actions.switchTab('bosses');
                });
            } else {
                emptyEl.style.display = '';
            }
            renderPaginationControls(0, 0);
            return;
        } else {
            if (emptyEl) emptyEl.style.display = 'none';
            if (tableContainer) tableContainer.style.display = '';
            if (dom.historyPagination) dom.historyPagination.style.display = '';
        }

        // 1. 決定要顯示哪些資料
        let displayData = [...state.killHistory];
        
        // UX Improvement: If a boss is focused, show that boss's history. 
        if (state.focusedBossId) {
            const filtered = displayData.filter(k => k.bossId === state.focusedBossId);
            const boss = getBossById(state.focusedBossId);
            
            if (filtered.length > 0) {
                displayData = filtered;
                dom.historyTableTitle.innerHTML = `<span class="material-icons-outlined" style="vertical-align:middle; margin-right:4px;">target</span> ${boss.name} - 頻道紀錄`;
            } else {
                dom.historyTableTitle.innerHTML = `<span style="color:var(--color-text-disabled)">${boss.name} (尚無紀錄) - 顯示全部</span>`;
            }
        } else {
            dom.historyTableTitle.innerHTML = `<span class="material-icons-outlined" style="vertical-align:middle; margin-right:4px;">history</span> 全域擊殺流水帳`;
        }

        // 2. 執行排序 (加入 null 防禦，避免孤兒紀錄造成 TypeError)
        displayData = displayData.filter(k => !!getBossById(k.bossId)); // 過濾孤兒紀錄
        displayData.sort((a, b) => {
            let valA, valB;
            const bossA = getBossById(a.bossId);
            const bossB = getBossById(b.bossId);
            switch (state.currentSort.col) {
                case 'name':
                    valA = bossA ? bossA.name : '';
                    valB = bossB ? bossB.name : '';
                    break;
                case 'channel': valA = a.channel; valB = b.channel; break;
                case 'hasDrop':
                    valA = (a.drops && (a.drops.equip || a.drops.scroll || a.drops.star)) || a.hasDrop ? 1 : 0;
                    valB = (b.drops && (b.drops.equip || b.drops.scroll || b.drops.star)) || b.hasDrop ? 1 : 0;
                    break;
                case 'respawn':
                    valA = new Date(a.killTime).getTime() + (bossA ? bossA.minMinutes * 60000 : 0);
                    valB = new Date(b.killTime).getTime() + (bossB ? bossB.minMinutes * 60000 : 0);
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
            dom.historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--color-text-disabled);">
                <div class="material-icons-outlined" style="font-size:48px; display:block; margin-bottom:10px;">inventory_2</div>
                目前沒有任何擊殺紀錄
            </td></tr>`;
            renderPaginationControls(0, 0);
            return;
        }

        const total = displayData.length;
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const start = (state.currentPage - 1) * state.pageSize;
        const pageItems = displayData.slice(start, start + state.pageSize);

        // P1-03 · Mobile: render timeline cards instead of table
        const mobileMode = isMobileWidth();
        let timelineEl = document.getElementById('history-timeline');
        const tableEl = document.getElementById('kill-history-table');
        if (mobileMode) {
            if (tableEl) tableEl.style.display = 'none';
            if (!timelineEl) {
                timelineEl = document.createElement('div');
                timelineEl.id = 'history-timeline';
                timelineEl.className = 'history-timeline';
                const section = document.getElementById('kill-history-section');
                const tc = section ? section.querySelector('.table-container') : null;
                if (tc) tc.appendChild(timelineEl); else if (section) section.appendChild(timelineEl);
            }
            timelineEl.style.display = '';
            timelineEl.innerHTML = '';
            const { formatTime, relativeTimeFromNow } = window.App.Core.Utils;
            pageItems.forEach(entry => {
                const boss = getBossById(entry.bossId);
                if (!boss) return;
                const killDate = new Date(entry.killTime);
                const card = document.createElement('div');
                card.className = 'tl-card';
                card.dataset.historyId = entry.id;
                let dropChips = '';
                if (entry.drops) {
                    if (entry.drops.equip) dropChips += '<span class="tl-chip tl-chip-equip">🛡 裝備</span>';
                    if (entry.drops.scroll) dropChips += '<span class="tl-chip tl-chip-scroll">📜 卷軸</span>';
                    if (entry.drops.star) dropChips += '<span class="tl-chip tl-chip-star">★ 幸運</span>';
                }
                card.innerHTML = `
                    <div class="tl-row-top">
                        <div class="tl-time">${formatTime(killDate)} · <span class="tl-rel">${relativeTimeFromNow(killDate)}</span></div>
                        <button class="tl-delete delete-btn" title="刪除"><span class="material-icons-outlined" style="font-size:16px;">delete</span></button>
                    </div>
                    <div class="tl-name">${boss.name}${entry.drops && entry.drops.star ? ' <span class="tl-star">★</span>' : ''}</div>
                    <div class="tl-tags">
                        <span class="tl-chip tl-chip-ch">Ch.${entry.channel}</span>
                        ${dropChips}
                    </div>
                `;
                card.querySelector('.tl-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.App.Logic.Actions.deleteHistoryEntry(entry.id);
                });
                card.addEventListener('click', () => {
                    window.App.Logic.Actions.loadEntryToForm(entry);
                });
                timelineEl.appendChild(card);
            });
            renderPaginationControls(total, totalPages);
            return;
        } else {
            if (tableEl) tableEl.style.display = '';
            if (timelineEl) timelineEl.style.display = 'none';
        }

        pageItems.forEach(entry => {
            const boss = getBossById(entry.bossId);
            if (!boss) return;
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
            
            // Highlight if this is the focused boss
            if (state.focusedBossId === entry.bossId) {
                tr.style.borderLeft = '4px solid var(--color-primary)';
            }

            tr.innerHTML = `
                <td data-label="Boss"><div style="display:flex; align-items:center; gap:8px;">
                    <div class="mini-boss-img">${boss.name.substring(0,1)}</div>
                    <span>${boss.name}</span>
                </div></td>
                <td data-label="擊殺">${formatTimeDisplay(killDate)}</td>
                <td data-label="頻道"><span style="font-weight:700; color:var(--color-primary); font-size:1.1rem;">${entry.channel}</span></td>
                <td data-label="掉寶"><div class="drops-cell">${dropHtml}</div></td>
                <td data-label="備註" class="notes-cell">${entry.notes || '-'}</td>
                <td data-label="重生"><span class="respawn-range">${formatTime(minRespawn)} ~ ${formatTime(maxRespawn)}</span></td>
                <td data-label="操作"><button class="btn btn-danger btn-small btn-icon delete-btn" title="刪除"><span class="material-icons-outlined" style="font-size:16px;">delete</span></button></td>
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
        const { playNotificationSound, calculateTimerState, showDesktopNotification } = window.App.Core.Utils;
        const BOSSES_JSON = window.App.Data.Bosses;

        BOSSES_JSON.forEach(boss => {
            updateBossCard(boss.id);

            // Check Audio / Desktop Alert
            const records = state.killHistory.filter(k => k.bossId === boss.id);
            if (records.length === 0) return;
            let minSeconds = Infinity;
            let bestChannel = null;
            records.forEach(r => {
                const ts = calculateTimerState(boss, r.killTime);
                if (ts.secondsToMin < minSeconds) { minSeconds = ts.secondsToMin; bestChannel = r.channel; }
            });

            if (minSeconds < 120 && minSeconds > 0) {
                if (!state.alertedBosses.has(boss.id)) {
                    if (state.soundEnabled) {
                        playNotificationSound(state.settings.soundType);
                    }
                    if (state.settings.desktopNotification && document.hidden) {
                        showDesktopNotification(
                            `${boss.name} · 即將重生`,
                            `最早於 ${Math.ceil(minSeconds/60)} 分後出現 · 上次頻道 ${bestChannel}`,
                            () => window.App.Logic.Actions.selectBoss(boss.id)
                        );
                    }
                    state.alertedBosses.add(boss.id);
                }
            } else if (minSeconds > 120) {
                state.alertedBosses.delete(boss.id);
            }
        });

        // 更新篩選計數
        updateFilterCounts();

        // Update target history if boss is focused
        if (state.focusedBossId) {
            renderTargetHistory(state.focusedBossId);
        }
    }

    // =============================================
    // 最愛芯片 & 下拉選單渲染
    // =============================================
    function renderFavoriteChips() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;

        // Render Desktop Chips
        if (dom.favChipsContainer) {
            dom.favChipsContainer.innerHTML = '';
            if (state.favorites.length === 0) {
                dom.favChipsContainer.innerHTML = '<span class="fav-placeholder">點 Boss 卡片上的 ☆ 可加入常用</span>';
            } else {
                state.favorites.forEach(bossId => {
                    const boss = getBossById(bossId);
                    if (!boss) return;
                    dom.favChipsContainer.appendChild(createFavChip(boss));
                });
            }
        }

        renderBossSelectorDropdown();
    }

    function createFavChip(boss) {
        const chip = document.createElement('button');
        chip.className = 'fav-boss-chip';
        chip.dataset.bossId = boss.id;
        chip.title = `${boss.name}（${boss.respawn}）`;
        chip.innerHTML = `<span class="fav-chip-abbr">${boss.name.substring(0, 2)}</span><span class="fav-chip-name">${boss.name}</span>`;
        return chip;
    }

    function renderBossSelectorDropdown() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const dropdown = dom.bossSelectorDropdown;
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">🔍 快速選擇 Boss...</option>';

        const favBosses = state.favorites.map(id => getBossById(id)).filter(Boolean);
        const allBosses = [...BOSSES_JSON].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

        if (favBosses.length > 0) {
            const favGroup = document.createElement('optgroup');
            favGroup.label = '⭐ 常用 Boss';
            favBosses.forEach(boss => {
                const opt = document.createElement('option');
                opt.value = boss.id;
                opt.textContent = boss.name;
                favGroup.appendChild(opt);
            });
            dropdown.appendChild(favGroup);
        }

        const allGroup = document.createElement('optgroup');
        allGroup.label = '── 全部 Boss ──';
        allBosses.forEach(boss => {
            const opt = document.createElement('option');
            opt.value = boss.id;
            opt.textContent = `${boss.name}（${boss.respawn}）`;
            allGroup.appendChild(opt);
        });
        dropdown.appendChild(allGroup);
    }

    // =============================================
    // 更新篩選計數標籤
    // =============================================
    function updateFilterCounts() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const { calculateTimerState } = window.App.Core.Utils;

        let alive = 0, warning = 0, cooldown = 0;
        BOSSES_JSON.forEach(boss => {
            const records = state.killHistory.filter(k => k.bossId === boss.id);
            if (records.length === 0) { alive++; return; }
            let bestStatus = 'cooldown';
            records.forEach(r => {
                const ts = calculateTimerState(boss, r.killTime);
                if (ts.status === 'alive') bestStatus = 'alive';
                else if (ts.status === 'warning' && bestStatus === 'cooldown') bestStatus = 'warning';
            });
            if (bestStatus === 'alive') alive++;
            else if (bestStatus === 'warning') warning++;
            else cooldown++;
        });

        const total = BOSSES_JSON.length;
        if (dom.filterChipAll) dom.filterChipAll.textContent = `全部 (${total})`;
        if (dom.filterChipAlive) dom.filterChipAlive.textContent = `🟢 可擊殺 (${alive})`;
        if (dom.filterChipWarning) dom.filterChipWarning.textContent = `🟡 即將重生 (${warning})`;
        if (dom.filterChipCooldown) dom.filterChipCooldown.textContent = `🔴 冷卻中 (${cooldown})`;
    }

    function renderShareModalOptions() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const { getBossById } = window.App.Core.Utils;

        if (!dom.shareBossList) return;
        dom.shareBossList.innerHTML = '';

        // Get unique boss IDs from history
        const activeBossIds = new Set(state.killHistory.map(k => k.bossId));
        
        if (activeBossIds.size === 0) {
            dom.shareBossList.innerHTML = '<div style="color:var(--color-text-disabled); grid-column:1/-1;">無資料</div>';
            return;
        }

        const activeBosses = Array.from(activeBossIds).map(id => getBossById(BOSSES_JSON, id)).filter(Boolean);
        activeBosses.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

        activeBosses.forEach(boss => {
            const label = document.createElement('label');
            label.className = 'share-boss-item';
            label.innerHTML = `
                <input type="checkbox" class="share-boss-checkbox" value="${boss.id}" checked>
                <span class="share-boss-name">${boss.name}</span>
            `;
            dom.shareBossList.appendChild(label);
        });
    }

    // =============================================
    // 今日戰況 Summary
    // =============================================
    function getTodayRecords() {
        const { state } = window.App.Core.State;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return state.killHistory.filter(k => new Date(k.killTime) >= startOfDay);
    }

    function renderTodaySummary() {
        const { dom } = window.App.UI.DOM;
        if (!dom.todaySummary) return;

        const records = getTodayRecords();
        const now = new Date();
        if (dom.todaySummaryDate) {
            dom.todaySummaryDate.textContent = `${now.getMonth() + 1}/${now.getDate()}`;
        }

        const bossSet = new Set(records.map(r => r.bossId));
        let equip = 0, scroll = 0, star = 0;
        records.forEach(r => {
            if (r.drops) {
                if (r.drops.equip) equip++;
                if (r.drops.scroll) scroll++;
                if (r.drops.star) star++;
            }
        });
        const totalDrops = equip + scroll + star;

        if (dom.todayKills) dom.todayKills.textContent = records.length;
        if (dom.todayBosses) dom.todayBosses.textContent = bossSet.size;
        if (dom.todayDrops) dom.todayDrops.textContent = totalDrops;
        if (dom.todayDropBreakdown) {
            if (totalDrops === 0) {
                dom.todayDropBreakdown.innerHTML = '<span style="opacity:0.4;">無</span>';
            } else {
                const parts = [];
                if (equip) parts.push(`<span title="裝備"><span class="material-icons-outlined">shield</span>${equip}</span>`);
                if (scroll) parts.push(`<span title="卷軸"><span class="material-icons-outlined">description</span>${scroll}</span>`);
                if (star) parts.push(`<span title="大寶物"><span class="material-icons-outlined">stars</span>${star}</span>`);
                dom.todayDropBreakdown.innerHTML = parts.join('');
            }
        }

        if (dom.todayLastTime) {
            if (records.length === 0) {
                dom.todayLastTime.textContent = '--:--';
            } else {
                const last = records.reduce((a, b) => new Date(a.killTime) > new Date(b.killTime) ? a : b);
                dom.todayLastTime.textContent = formatTime(new Date(last.killTime));
            }
        }

        if (dom.todayTopBosses) {
            dom.todayTopBosses.innerHTML = '';
            if (records.length === 0) {
                dom.todayTopBosses.innerHTML = '<div class="today-empty">今天尚無紀錄，開始獵 Boss 吧！</div>';
            } else {
                const counter = new Map();
                records.forEach(r => counter.set(r.bossId, (counter.get(r.bossId) || 0) + 1));
                const ranked = Array.from(counter.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                ranked.forEach(([bossId, count]) => {
                    const boss = getBossById(bossId);
                    if (!boss) return;
                    const chip = document.createElement('div');
                    chip.className = 'today-boss-chip';
                    chip.innerHTML = `<span class="today-boss-abbr">${boss.name.substring(0, 2)}</span><span class="today-boss-name">${boss.name}</span><span class="today-boss-count">×${count}</span>`;
                    dom.todayTopBosses.appendChild(chip);
                });
            }
        }
    }

    // ============================================================
    // P1-06 · Recent / Lucky channel chips
    // ============================================================
    function renderRecentChannelChips(bossId) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.actionChannelChips || !dom.actionChannelChipsWrap) return;
        if (!bossId) { dom.actionChannelChipsWrap.style.display = 'none'; return; }

        const records = state.killHistory.filter(k => k.bossId === bossId);
        if (records.length === 0) { dom.actionChannelChipsWrap.style.display = 'none'; return; }

        // Recent: last 3 unique channels
        const recent = [];
        const seen = new Set();
        records.slice().sort((a,b) => new Date(b.killTime) - new Date(a.killTime)).forEach(r => {
            if (recent.length < 3 && !seen.has(r.channel)) { recent.push(r.channel); seen.add(r.channel); }
        });

        // Lucky: top 2 channels by star count
        const starCounter = new Map();
        records.forEach(r => {
            if (r.drops && r.drops.star) starCounter.set(r.channel, (starCounter.get(r.channel) || 0) + 1);
        });
        const lucky = Array.from(starCounter.entries()).sort((a,b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);

        const allChips = [];
        recent.forEach(ch => allChips.push({ ch, hot: false }));
        lucky.forEach(ch => { if (!recent.includes(ch)) allChips.push({ ch, hot: true }); });

        if (allChips.length === 0) { dom.actionChannelChipsWrap.style.display = 'none'; return; }

        dom.actionChannelChipsWrap.style.display = '';
        dom.actionChannelChips.innerHTML = allChips.map(c =>
            `<button type="button" class="rc${c.hot ? ' hot' : ''}" data-channel="${c.ch}">${c.hot ? '★ ' : ''}${c.ch}</button>`
        ).join('');
    }

    // ============================================================
    // P2-07 · Lucky channel heatmap
    // ============================================================
    let _heatmapSegment = 0; // 0: 1-1000, 1: 1001-2000, 2: 2001-3000

    function renderHeatmap(bossId) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.heatmapContainer) return;

        const records = state.killHistory.filter(k => k.bossId === bossId);

        // Render segment switcher
        if (dom.heatmapSegments) {
            dom.heatmapSegments.innerHTML = '';
            ['1-1000', '1001-2000', '2001-3000'].forEach((label, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'heatmap-seg-btn' + (i === _heatmapSegment ? ' active' : '');
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    _heatmapSegment = i;
                    renderHeatmap(bossId);
                });
                dom.heatmapSegments.appendChild(btn);
            });
        }

        // Aggregate per 100 channels
        const segStart = _heatmapSegment * 1000 + 1;
        const segEnd = (_heatmapSegment + 1) * 1000;
        const buckets = []; // 10 buckets * 100 channels each
        for (let i = 0; i < 10; i++) {
            const from = segStart + i * 100;
            const to = from + 99;
            buckets.push({ from, to, kills: 0, stars: 0 });
        }
        records.forEach(r => {
            if (r.channel < segStart || r.channel > segEnd) return;
            const idx = Math.floor((r.channel - segStart) / 100);
            if (buckets[idx]) {
                buckets[idx].kills++;
                if (r.drops && r.drops.star) buckets[idx].stars++;
            }
        });

        const maxKills = Math.max(1, ...buckets.map(b => b.kills));
        dom.heatmapContainer.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'lucky-grid';
        buckets.forEach(b => {
            const cell = document.createElement('div');
            const pct = b.starRate = b.kills ? (b.stars / b.kills) : 0;
            let cls = 'l0';
            if (b.kills > 0) {
                const ratio = b.kills / maxKills;
                if (ratio > 0.66) cls = 'l3';
                else if (ratio > 0.33) cls = 'l2';
                else cls = 'l1';
            }
            if (b.stars > 0) cls = 'star';
            cell.className = `lucky-cell ${cls}`;
            cell.title = `頻道 ${b.from}~${b.to} · 擊殺 ${b.kills} 次 · ★ ${b.stars} 次（${Math.round(pct*100)}%）`;
            cell.innerHTML = b.stars > 0 ? '★' : (b.kills > 0 ? String(b.kills) : '');
            cell.dataset.from = b.from;
            cell.addEventListener('click', () => {
                if (dom.actionChannelInput) {
                    dom.actionChannelInput.value = b.from;
                    dom.actionChannelInput.focus();
                }
            });
            grid.appendChild(cell);
        });
        dom.heatmapContainer.appendChild(grid);

        // Range labels
        const labels = document.createElement('div');
        labels.className = 'heatmap-axis';
        labels.innerHTML = `<span>${segStart}</span><span>${segEnd}</span>`;
        dom.heatmapContainer.appendChild(labels);
    }

    window.App.UI.Render = {
        renderBossCards, updateBossCard, updateCardVisibility, renderHistoryTable, updateSortIcons, updateAllTimers,
        renderFavoriteChips, renderBossSelectorDropdown, updateFilterCounts, renderActionBar,
        renderShareModalOptions, renderTodaySummary, getTodayRecords,
        renderRecentChannelChips, renderHeatmap, renderTargetHistory,
        isMobileWidth
    };
})();
