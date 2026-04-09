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
            renderTargetLock(state.focusedBossId);
        } else {
            dom.targetLockPanel.style.display = 'none';
            dom.selectedBossInfo.style.display = 'flex';
            dom.killForm.style.display = 'block';
            
            // Auto-focus search if no boss selected and on desktop
            if (window.innerWidth > 900 && !state.currentSearch) {
                setTimeout(() => dom.searchInput.focus(), 100);
            }
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
        
        // UX Improvement: If a boss is focused, show that boss's history. 
        // But also provide a way to see "Recent Global" if there's no data for this boss.
        if (state.focusedBossId) {
            const filtered = displayData.filter(k => k.bossId === state.focusedBossId);
            const boss = getBossById(state.focusedBossId);
            
            if (filtered.length > 0) {
                displayData = filtered;
                dom.historyTableTitle.innerHTML = `<span class="material-icons-outlined" style="vertical-align:middle; margin-right:4px;">target</span> ${boss.name} - 頻道紀錄`;
            } else {
                // If focused boss has no history, show everything but dim the title or indicate it
                dom.historyTableTitle.innerHTML = `<span style="color:var(--color-text-disabled)">${boss.name} (尚無紀錄) - 顯示全部</span>`;
            }
        } else {
            dom.historyTableTitle.innerHTML = `<span class="material-icons-outlined" style="vertical-align:middle; margin-right:4px;">history</span> 全域擊殺流水帳`;
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
                <td><div style="display:flex; align-items:center; gap:8px;">
                    <div class="mini-boss-img">${boss.name.substring(0,1)}</div>
                    <span>${boss.name}</span>
                </div></td>
                <td>${formatTimeDisplay(killDate)}</td>
                <td><span style="font-weight:700; color:var(--color-primary); font-size:1.1rem;">${entry.channel}</span></td>
                <td><div style="display:flex; gap:4px; justify-content:center;">${dropHtml}</div></td>
                <td style="color:var(--color-text-secondary); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${entry.notes || '-'}</td>
                <td><span class="respawn-range">${formatTime(minRespawn)} ~ ${formatTime(maxRespawn)}</span></td>
                <td><button class="btn btn-danger btn-small btn-icon delete-btn" title="刪除" aria-label="刪除紀錄"><span class="material-icons-outlined" style="font-size:16px;">delete</span></button></td>
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

                if (minSeconds < 120 && minSeconds > 0) {
                    if (!state.alertedBosses.has(boss.id)) {
                        playNotificationSound();
                        state.alertedBosses.add(boss.id);
                    }
                } else if (minSeconds > 120) {
                    state.alertedBosses.delete(boss.id);
                }
            }
        });

        // 更新篩選計數
        updateFilterCounts();
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

    // =============================================
    // 最愛芯片 & 下拉選單渲染
    // =============================================
    function renderFavoriteChips() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;

        if (!dom.favChipsContainer) return;
        dom.favChipsContainer.innerHTML = '';

        if (state.favorites.length === 0) {
            dom.favChipsContainer.innerHTML = '<span class="fav-placeholder">點 Boss 卡片上的 ☆ 可加入常用</span>';
        } else {
            state.favorites.forEach(bossId => {
                const boss = getBossById(bossId);
                if (!boss) return;
                const chip = document.createElement('button');
                chip.className = 'fav-boss-chip';
                chip.dataset.bossId = bossId;
                chip.title = `${boss.name}（${boss.respawn}）`;
                chip.innerHTML = `<span class="fav-chip-abbr">${boss.name.substring(0, 2)}</span><span class="fav-chip-name">${boss.name}</span>`;
                dom.favChipsContainer.appendChild(chip);
            });
        }

        renderBossSelectorDropdown();
    }

    function renderBossSelectorDropdown() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;

        if (!dom.bossSelectorDropdown) return;
        dom.bossSelectorDropdown.innerHTML = '<option value="">🔍 快速選擇 Boss...</option>';

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
            dom.bossSelectorDropdown.appendChild(favGroup);
        }

        const allGroup = document.createElement('optgroup');
        allGroup.label = '── 全部 Boss ──';
        allBosses.forEach(boss => {
            const opt = document.createElement('option');
            opt.value = boss.id;
            opt.textContent = `${boss.name}（${boss.respawn}）`;
            allGroup.appendChild(opt);
        });
        dom.bossSelectorDropdown.appendChild(allGroup);
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

    window.App.UI.Render = {
        renderBossCards, updateBossCard, updateCardVisibility, renderHistoryTable, updateSortIcons, updateAllTimers, renderPresets,
        renderFavoriteChips, renderBossSelectorDropdown, updateFilterCounts
    };
})();
