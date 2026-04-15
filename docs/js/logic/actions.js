
(function () {
    // Shortcuts
    const getBossById = (id) => window.App.Core.Utils.getBossById(window.App.Data.Bosses, id);
    const { parseChannelList } = window.App.Core.Utils;

    function recordKillQuick(bossId, channel, opts = {}) {
        if (!bossId) return;
        const { state, saveHistory, saveLastChannel } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        const { renderHistoryTable, updateBossCard, renderBossCards } = window.App.UI.Render;
        const BOSSES_JSON = window.App.Data.Bosses;

        // Prevent rapid double-clicking
        const now = Date.now();
        if (state.lastRecordTime && (now - state.lastRecordTime < 500)) return;
        state.lastRecordTime = now;

        const nowISO = new Date().toISOString();
        const safeChannel = Math.max(1, Math.min(3000, parseInt(channel) || 1));

        const existingIndex = state.killHistory.findIndex(k => k.bossId === bossId && k.channel === safeChannel);
        if (existingIndex !== -1) {
            state.killHistory.splice(existingIndex, 1);
        }

        const entry = {
            id: `kill-${Date.now()}`,
            bossId: bossId,
            killTime: nowISO,
            channel: safeChannel,
            hasDrop: opts.equip || opts.scroll || opts.star || false,
            drops: {
                equip: opts.equip || false,
                scroll: opts.scroll || false,
                star: opts.star || false
            },
            notes: ''
        };

        state.killHistory.push(entry);

        // Reset alerted status for this boss as timer resets
        state.alertedBosses.delete(bossId);

        saveHistory();
        renderHistoryTable();
        updateBossCard(bossId);
        saveLastChannel(safeChannel);
        window.App.Core.State.updateRecentBoss(bossId);

        if (state.focusedBossId === bossId) {
            renderBossCards(); // Fully refresh to update list

            // Refresh target history lists
            if (window.App.UI.Render.renderTargetHistory) {
                window.App.UI.Render.renderTargetHistory(bossId);
            }

            // Focus the active channel input
            if (dom.actionChannelInput) {
                dom.actionChannelInput.focus();
                dom.actionChannelInput.select();
            }
            
            // Visual Feedback: Flash the panel
            if (dom.actionBar) {
                dom.actionBar.classList.add('flash-success');
                setTimeout(() => {
                    dom.actionBar.classList.remove('flash-success');
                }, 400);
            }
        }

        if (opts.autoinc) {
            const nextCh = safeChannel + 1;
            setChannel(nextCh);
        }
        
        // Safety checks for resetting UI
        if (dom.actionDropEquip) dom.actionDropEquip.checked = false;
        if (dom.actionDropScroll) dom.actionDropScroll.checked = false;
        if (dom.actionDropStar) dom.actionDropStar.checked = false;

        showToast(`紀錄已新增：${getBossById(bossId).name} Ch.${safeChannel}`, { timeout: 1400 });
        
        // Feedback animation on the history table row if it exists
        setTimeout(() => {
            const row = document.querySelector(`tr[data-history-id="${entry.id}"]`);
            if (row) {
                row.style.transition = 'background-color 0.5s';
                row.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                setTimeout(() => row.style.backgroundColor = '', 1000);
            }
        }, 50);
    }

    function handleFocusSubmit() {
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (!state.focusedBossId) return;
        
        const ch = parseInt(dom.actionChannelInput ? dom.actionChannelInput.value : 1) || 1;
        const autoInc = dom.actionAutoInc ? dom.actionAutoInc.checked : false;
        
        const equip = dom.actionDropEquip ? dom.actionDropEquip.checked : false;
        const scroll = dom.actionDropScroll ? dom.actionDropScroll.checked : false;
        const star = dom.actionDropStar ? dom.actionDropStar.checked : false;
        
        recordKillQuick(state.focusedBossId, ch, { autoinc: autoInc, equip, scroll, star });
    }

    function selectBoss(bossId) {
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        const { renderHistoryTable, renderBossCards } = window.App.UI.Render;
        const BOSSES_JSON = window.App.Data.Bosses;

        // Toggle off
        if (state.focusedBossId === bossId && bossId !== null) {
            state.focusedBossId = null;
        } else {
            state.focusedBossId = bossId;
            window.App.Core.State.updateRecentBoss(bossId);
        }

        renderBossCards();
        renderHistoryTable();

        if (state.focusedBossId) {
            // UX Improvement: Auto-focus the channel input in Action Bar
            setTimeout(() => {
                if (dom.actionChannelInput) {
                    dom.actionChannelInput.focus();
                    dom.actionChannelInput.select();
                }
            }, 100);
        }
    }

    // V2: Tab Switching
    function switchTab(tabId) {
        const { dom } = window.App.UI.DOM;
        if (!dom.tabPanels || !dom.tabButtons) return;

        dom.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabId);
        });
        dom.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
    }

    function loadEntryToForm(entry) {
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (state.focusedBossId !== entry.bossId) {
            selectBoss(entry.bossId);
        }
        setChannel(entry.channel);
        
        if (dom.actionDropEquip) dom.actionDropEquip.checked = entry.drops ? entry.drops.equip : false;
        if (dom.actionDropScroll) dom.actionDropScroll.checked = entry.drops ? entry.drops.scroll : false;
        if (dom.actionDropStar) dom.actionDropStar.checked = entry.drops ? entry.drops.star : false;
    }

    function deleteHistoryEntry(id) {
        const { state, saveHistory } = window.App.Core.State;
        const { renderHistoryTable, updateBossCard } = window.App.UI.Render;

        const index = state.killHistory.findIndex(k => k.id === id);
        if (index === -1) return;
        const removed = state.killHistory.splice(index, 1)[0];
        saveHistory();
        renderHistoryTable();
        updateBossCard(removed.bossId);

        showUndoToast('已刪除一筆紀錄', () => {
            state.killHistory.push(removed);
            saveHistory();
            renderHistoryTable();
            updateBossCard(removed.bossId);
        }, { timeout: 6000 });
    }

    function clearAllHistory() {
        if (confirm("確定要清空所有紀錄嗎？")) {
            const { state, saveHistory } = window.App.Core.State;
            const { renderHistoryTable, updateBossCard } = window.App.UI.Render;
            const { dom } = window.App.UI.DOM;
            state.killHistory = [];
            saveHistory();
            renderHistoryTable();
            document.querySelectorAll('.boss-card').forEach(card => updateBossCard(card.dataset.bossId));
            if (dom.selectedBossInfo) dom.selectedBossInfo.innerHTML = `<span id="boss-placeholder">已清空</span>`;
        }
    }

    function saveInlineChannel(entry, val) {
        const { saveHistory } = window.App.Core.State;
        const { renderHistoryTable, updateBossCard } = window.App.UI.Render;
        const num = parseInt(val) || entry.channel;
        entry.channel = Math.max(1, Math.min(3000, num));
        saveHistory(); renderHistoryTable(); updateBossCard(entry.bossId);
    }

    function saveInlineNotes(entry, val) {
        const { saveHistory } = window.App.Core.State;
        const { renderHistoryTable } = window.App.UI.Render;
        entry.notes = String(val).trim(); saveHistory(); renderHistoryTable();
    }



    function updateChannel(delta) {
        const { dom } = window.App.UI.DOM;
        let val = parseInt(dom.actionChannelInput ? dom.actionChannelInput.value : 1) || 1;
        setChannel(val + delta);
    }

    function setChannel(val) {
        const { dom } = window.App.UI.DOM;
        let num = parseInt(val);
        if (num < 1) num = 1;
        if (num > 3000) num = 3000;
        if (dom.actionChannelInput) dom.actionChannelInput.value = num;
    }

    function showToast(message, opts = {}) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.toastContainer) return;
        const id = `toast-${Date.now()}`;
        const div = document.createElement('div');
        div.className = 'toast';
        div.id = id;
        const msg = document.createElement('div'); msg.className = 'toast-msg'; msg.textContent = message;
        const actions = document.createElement('div'); actions.className = 'toast-actions';
        div.appendChild(msg); div.appendChild(actions);
        dom.toastContainer.appendChild(div);

        const timeout = typeof opts.timeout === 'number' ? opts.timeout : 3000;
        const t = setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); state.toastTimers.delete(id); }, timeout);
        state.toastTimers.set(id, t);
        return id;
    }

    function showUndoToast(message, undoCallback, opts = {}) {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.toastContainer) return;
        const id = `toast-${Date.now()}`;
        const div = document.createElement('div');
        div.className = 'toast';
        div.id = id;
        const msg = document.createElement('div'); msg.className = 'toast-msg'; msg.textContent = message;
        const actions = document.createElement('div'); actions.className = 'toast-actions';
        const undoBtn = document.createElement('button'); undoBtn.textContent = '撤銷';
        const closeBtn = document.createElement('button'); closeBtn.textContent = '關閉';
        actions.appendChild(undoBtn); actions.appendChild(closeBtn);
        div.appendChild(msg); div.appendChild(actions);
        dom.toastContainer.appendChild(div);

        const timeout = typeof opts.timeout === 'number' ? opts.timeout : 5000;
        const t = setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); state.toastTimers.delete(id); }, timeout);
        state.toastTimers.set(id, t);

        undoBtn.addEventListener('click', () => {
            try { undoCallback(); } catch (e) { }
            if (div.parentNode) div.parentNode.removeChild(div);
            clearTimeout(t);
            state.toastTimers.delete(id);
        });
        closeBtn.addEventListener('click', () => {
            if (div.parentNode) div.parentNode.removeChild(div);
            clearTimeout(t);
            state.toastTimers.delete(id);
        });
    }

    // =============================================
    // 最愛 Boss 功能
    // =============================================
    function toggleFavorite(bossId) {
        const { state, saveFavorites } = window.App.Core.State;
        const { renderFavoriteChips, renderBossCards } = window.App.UI.Render;

        const idx = state.favorites.indexOf(bossId);
        if (idx === -1) {
            state.favorites.unshift(bossId);
            if (state.favorites.length > 8) state.favorites = state.favorites.slice(0, 8);
            showToast(`已加入常用：${getBossById(bossId).name}`, { timeout: 1200 });
        } else {
            state.favorites.splice(idx, 1);
            showToast(`已移除常用：${getBossById(bossId).name}`, { timeout: 1200 });
        }
        saveFavorites();
        renderFavoriteChips();
        renderBossCards();
    }

    // =============================================
    // 分享功能
    // =============================================
    function generateShareText(selectedBossIds = null, format = 'detailed') {
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const { calculateTimerState, formatTime } = window.App.Core.Utils;
        const { getBossById } = window.App.Core.Utils;

        const now = new Date();
        const pad = (s, len) => String(s).padEnd(len, ' ');

        // Group records by boss
        const bossMap = new Map();
        state.killHistory.forEach(record => {
            if (selectedBossIds && selectedBossIds.length > 0 && !selectedBossIds.includes(record.bossId)) return;
            const boss = getBossById(BOSSES_JSON, record.bossId);
            if (!boss) return;
            if (!bossMap.has(record.bossId)) {
                bossMap.set(record.bossId, { boss, records: [] });
            }
            const killDate = new Date(record.killTime);
            const minRespawn = new Date(killDate.getTime() + boss.minMinutes * 60000);
            const maxRespawn = new Date(killDate.getTime() + boss.maxMinutes * 60000);
            const ts = calculateTimerState(boss, record.killTime);
            bossMap.get(record.bossId).records.push({ record, ts, minRespawn, maxRespawn });
        });

        if (bossMap.size === 0) {
            return '[ Artale Boss Chaser ]\n目前選擇的 Boss 沒有任何追蹤紀錄。';
        }

        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        
        let text = `[ Artale Boss Chaser — ${hh}:${mm} 速報 ]\n`;
        
        if (format === 'simple') {
            text += '─'.repeat(30) + '\n';
            bossMap.forEach(({ boss, records }) => {
                records
                    .sort((a, b) => a.record.channel - b.record.channel)
                    .forEach(({ record, ts }) => {
                        let statusText = '';
                        if (ts.status === 'alive') statusText = '已出';
                        else if (ts.status === 'warning') statusText = ts.timer.replace('剩 ', '剩');
                        else statusText = '冷卻中';
                        text += `${boss.name}(Ch${record.channel}) ${statusText}\n`;
                    });
            });
        } else {
            text += '─'.repeat(44) + '\n';
            bossMap.forEach(({ boss, records }) => {
                text += `\n🔥 ${boss.name}（${boss.respawn}）\n`;
                text += `  CH   擊殺     預估復活\n`;
                records
                    .sort((a, b) => a.record.channel - b.record.channel)
                    .forEach(({ record, ts, minRespawn, maxRespawn }) => {
                        const chStr = pad(record.channel, 5);
                        const killStr = pad(formatTime(new Date(record.killTime)), 7);
                        const respawnStr = `${formatTime(minRespawn)}~${formatTime(maxRespawn)}`;
                        const statusMark = ts.status === 'alive' ? '🟢' : ts.status === 'warning' ? '🟡' : '🔴';
                        text += `  ${chStr}${killStr}${respawnStr} ${statusMark}\n`;
                    });
            });
            text += '\n' + '─'.repeat(44) + '\n';
            text += '分享自 Artale Boss Chaser PRO 🎮';
        }

        return text;
    }

    function shareBossStatus(text) {
        if (navigator.share) {
            navigator.share({
                title: 'Artale Boss Chaser',
                text: text
            }).then(() => {
                showToast("分享成功");
            }).catch((err) => {
                console.log('分享取消或失敗', err);
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                showToast("已複製到剪貼簿", { timeout: 1500 });
            });
        }
    }

    function openShareModal() {
        const { dom } = window.App.UI.DOM;
        const { renderShareModalOptions } = window.App.UI.Render;
        if (!dom.shareModal) return;
        
        renderShareModalOptions();
        
        // Check if Native Share is perfectly supported
        if (navigator.share && dom.shareNativeBtn) {
            dom.shareNativeBtn.style.display = 'inline-flex';
        } else if (dom.shareNativeBtn) {
            dom.shareNativeBtn.style.display = 'none';
        }
        
        dom.shareModal.style.display = 'flex';
    }

    // New Feature Actions
    function toggleViewMode() {
        const { state, saveViewMode } = window.App.Core.State;
        const { renderBossCards } = window.App.UI.Render;
        const newMode = state.viewMode === 'card' ? 'compact' : 'card';
        saveViewMode(newMode);
        renderBossCards();
    }

    function toggleSound() {
        const { state, saveSoundEnabled } = window.App.Core.State;
        const { renderBossCards, updateAllTimers } = window.App.UI.Render;
        const newState = !state.soundEnabled;
        saveSoundEnabled(newState);
        if (newState) showToast("已開啟音效提示 (重生前2分鐘)", { timeout: 1500 });
        else showToast("已關閉音效", { timeout: 1500 });
        renderBossCards();
    }

    function toggleSmartSort() {
        const { state } = window.App.Core.State;
        const { renderBossCards } = window.App.UI.Render;
        state.smartSortActive = !state.smartSortActive;
        renderBossCards();
        if (state.smartSortActive) showToast("已啟用智慧排序 (即將重生優先)", { timeout: 1000 });
        else showToast("已還原預設排序", { timeout: 1000 });
    }

    window.App.Logic.Actions = {
        recordKillQuick, handleFocusSubmit, selectBoss, loadEntryToForm, deleteHistoryEntry, clearAllHistory,
        saveInlineChannel, saveInlineNotes,
        updateChannel, setChannel, showToast, showUndoToast,
        toggleViewMode, toggleSound, toggleSmartSort,
        toggleFavorite, generateShareText, openShareModal, shareBossStatus,
        switchTab
    };
})();
