
(function () {
    function setupEventListeners() {
        // Shortcuts
        const { dom } = window.App.UI.DOM;
        const { state, saveTheme, savePresets } = window.App.Core.State;
        const { renderHistoryTable, updateSortIcons, updateCardVisibility, renderPresets } = window.App.UI.Render;
        const actions = window.App.Logic.Actions;

        // 1. 點擊 Boss 卡片
        dom.bossListContainer.addEventListener('click', (e) => {
            const quickBtn = e.target.closest('.quick-kill-btn');
            if (quickBtn) {
                const bid = quickBtn.dataset.bossId;
                actions.recordKillQuick(bid, parseInt(dom.channelInput.value) || 1, { autoinc: true });
                return;
            }
            const card = e.target.closest('.boss-card');
            if (card) {
                actions.selectBoss(card.dataset.bossId);
            }
        });

        // 2. 表單提交
        dom.killForm.addEventListener('submit', actions.handleFormSubmit);

        // 3. 頻道操作
        dom.channelSubBtn.addEventListener('click', () => actions.updateChannel(-1));
        dom.channelAddBtn.addEventListener('click', () => actions.updateChannel(1));
        dom.quickChannels.forEach(chip => {
            chip.addEventListener('click', () => actions.setChannel(chip.dataset.channel));
        });

        // 4. 篩選與搜尋
        dom.filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                state.currentFilter = chip.dataset.filter;
                dom.filterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === state.currentFilter));
                updateCardVisibility();
            });
        });
        dom.searchInput.addEventListener('input', (e) => {
            state.currentSearch = e.target.value.toLowerCase();
            updateCardVisibility();
        });

        // 5. 排序標題點擊
        dom.tableHeaders.forEach(th => {
            th.addEventListener('click', () => {
                const sortKey = th.dataset.sort;
                if (state.currentSort.col === sortKey) {
                    state.currentSort.dir = state.currentSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    state.currentSort.col = sortKey;
                    state.currentSort.dir = 'desc';
                }
                renderHistoryTable();
                updateSortIcons();
            });
        });

        // 6. 點擊歷史紀錄列 (編輯模式)
        dom.historyTableBody.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            const row = e.target.closest('tr');
            if (row && row.dataset.bossId) {
                const entry = state.killHistory.find(h => h.id === row.dataset.historyId);
                if (entry) {
                    actions.loadEntryToForm(entry);
                }
            }
        });

        // 7. 刪除按鈕 (事件委派)
        dom.historyTableBody.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.delete-btn');
            if (delBtn) {
                e.stopPropagation();
                const historyId = delBtn.closest('tr').dataset.historyId;
                actions.deleteHistoryEntry(historyId);
            }
        });

        // 8. 其他
        dom.themeToggleBtn.addEventListener('click', toggleTheme);
        dom.clearHistoryBtn.addEventListener('click', actions.clearAllHistory);
        document.addEventListener('keydown', handleGlobalKeydown);

        if (dom.savePresetBtn) dom.savePresetBtn.addEventListener('click', actions.handleSavePreset);
        if (dom.saveBatchPresetBtn) dom.saveBatchPresetBtn.addEventListener('click', actions.handleSaveBatchPreset);

        // Inline edit
        dom.historyTableBody.addEventListener('dblclick', (e) => {
            const td = e.target.closest('td');
            if (!td) return;
            const tr = td.closest('tr');
            if (!tr) return;
            const historyId = tr.dataset.historyId;
            const entry = state.killHistory.find(x => x.id === historyId);
            if (!entry) return;

            const cells = Array.from(tr.children);
            const channelCell = cells[2];
            const notesCell = cells[4];

            if (td === channelCell) {
                const inp = document.createElement('input'); inp.type = 'number'; inp.value = entry.channel; inp.min = 1; inp.max = 3000; inp.className = 'form-input';
                channelCell.innerHTML = ''; channelCell.appendChild(inp); inp.focus();
                inp.addEventListener('blur', () => { actions.saveInlineChannel(entry, inp.value); });
                inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { inp.blur(); } });
            }

            if (td === notesCell) {
                const inp = document.createElement('input'); inp.type = 'text'; inp.value = entry.notes || ''; inp.className = 'form-input';
                notesCell.innerHTML = ''; notesCell.appendChild(inp); inp.focus();
                inp.addEventListener('blur', () => { actions.saveInlineNotes(entry, inp.value); });
                inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { inp.blur(); } });
            }
        });

        if (dom.batchBtn) dom.batchBtn.addEventListener('click', actions.handleBatchApply);

        if (dom.presetsList) {
            dom.presetsList.addEventListener('click', (e) => {
                const applyBtn = e.target.closest('.apply-preset');
                const delBtn = e.target.closest('.del-preset');

                if (applyBtn) {
                    const id = applyBtn.dataset.presetId;
                    const p = state.presets.find(x => x.id === id);
                    if (p) actions.applyPreset(p);
                }
                if (delBtn) {
                    const id = delBtn.dataset.presetId;
                    const idx = state.presets.findIndex(x => x.id === id);
                    if (idx !== -1) {
                        state.presets.splice(idx, 1);
                        savePresets();
                        renderPresets();
                    }
                }
            });
        }

        // New Features
        if (dom.viewToggleBtn) dom.viewToggleBtn.addEventListener('click', actions.toggleViewMode);
        if (dom.soundToggleBtn) dom.soundToggleBtn.addEventListener('click', actions.toggleSound);
        if (dom.smartSortBtn) dom.smartSortBtn.addEventListener('click', actions.toggleSmartSort);
    }

    function toggleTheme() {
        const { dom } = window.App.UI.DOM;
        const { saveTheme } = window.App.Core.State;
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        saveTheme(isLight);
        dom.themeIcon.textContent = isLight ? 'dark_mode' : 'light_mode';
    }

    function handleGlobalKeydown(e) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        const actions = window.App.Logic.Actions;
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

        if (!isTyping && /^[1-9]$/.test(e.key)) {
            actions.setChannel(parseInt(e.key));
            return;
        }

        if (!isTyping && (e.key === 'ArrowUp' || e.key === 'ArrowRight')) { actions.updateChannel(1); return; }
        if (!isTyping && (e.key === 'ArrowDown' || e.key === 'ArrowLeft')) { actions.updateChannel(-1); return; }

        if (e.key === 'Enter' && state.focusedBossId && !isTyping) {
            dom.killForm.requestSubmit();
            return;
        }

        if (!isTyping && (e.key === 'k' || e.key === 'K')) {
            if (state.focusedBossId) {
                actions.recordKillQuick(state.focusedBossId, parseInt(dom.channelInput.value) || 1, { autoinc: true, viaKeyboard: true });
            }
        }
    }

    window.App.UI.Events = { setupEventListeners };
})();
