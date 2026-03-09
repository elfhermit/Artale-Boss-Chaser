
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
        if (state.lastRecordTime && (now - state.lastRecordTime < 300)) return;
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
            hasDrop: ((dom.hasDropInput && dom.hasDropInput.checked) || opts.equip || opts.scroll || opts.star) && (!opts.viaKeyboard || (opts.equip || opts.scroll || opts.star)),
            drops: {
                equip: opts.equip || false,
                scroll: opts.scroll || false,
                star: opts.star || false
            },
            notes: (dom.notesInput ? dom.notesInput.value.trim() : '') || ''
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
            if (dom.focusChannelInput) {
                dom.focusChannelInput.focus();
                dom.focusChannelInput.select();
            }
        }

        if (opts.autoinc) {
            const nextCh = safeChannel + 1;
            setChannel(nextCh);
        }
        
        // Safety checks for resetting UI
        if (dom.hasDropInput) dom.hasDropInput.checked = false;
        if (dom.focusDropEquip) dom.focusDropEquip.checked = false;
        if (dom.focusDropScroll) dom.focusDropScroll.checked = false;
        if (dom.focusDropStar) dom.focusDropStar.checked = false;
        if (dom.notesInput) dom.notesInput.value = '';

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
        
        const ch = parseInt(dom.focusChannelInput.value) || 1;
        const autoInc = dom.autoIncCheckbox ? dom.autoIncCheckbox.checked : false;
        
        const equip = dom.focusDropEquip ? dom.focusDropEquip.checked : false;
        const scroll = dom.focusDropScroll ? dom.focusDropScroll.checked : false;
        const star = dom.focusDropStar ? dom.focusDropStar.checked : false;
        
        recordKillQuick(state.focusedBossId, ch, { autoinc: autoInc, equip, scroll, star });
    }

    function handleFormSubmit(e) {
        if (e) e.preventDefault();
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (!state.focusedBossId) {
            alert("請先選擇一個 Boss");
            return;
        }
        const currentChannel = parseInt(dom.channelInput.value) || 1;
        recordKillQuick(state.focusedBossId, currentChannel, { autoinc: true });
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

        // Enable/Disable Submit Button
        if (dom.submitKillBtn) {
            if (state.focusedBossId) {
                dom.submitKillBtn.disabled = false;
                dom.submitKillBtn.textContent = '立即紀錄擊殺';
            } else {
                dom.submitKillBtn.disabled = true;
                dom.submitKillBtn.textContent = '請先選擇 Boss';
            }
        }

        renderBossCards();
        renderHistoryTable();

        if (state.focusedBossId) {
            if (window.innerWidth < 900) {
                dom.sidebar.scrollIntoView({ behavior: 'smooth' });
            }
            // UX Improvement: Auto-focus the channel input in Target Lock Mode
            setTimeout(() => {
                if (dom.focusChannelInput) {
                    dom.focusChannelInput.focus();
                    dom.focusChannelInput.select();
                }
            }, 100);
        }
    }

    function loadEntryToForm(entry) {
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (state.focusedBossId !== entry.bossId) {
            selectBoss(entry.bossId);
        }
        setChannel(entry.channel);
        if (dom.focusChannelInput) dom.focusChannelInput.value = entry.channel;
        
        dom.notesInput.value = entry.notes || "";
        dom.hasDropInput.checked = entry.hasDrop || false;

        if (dom.focusDropEquip) dom.focusDropEquip.checked = entry.drops ? entry.drops.equip : false;
        if (dom.focusDropScroll) dom.focusDropScroll.checked = entry.drops ? entry.drops.scroll : false;
        if (dom.focusDropStar) dom.focusDropStar.checked = entry.drops ? entry.drops.star : false;

        if (window.innerWidth < 900) {
            dom.sidebar.scrollIntoView({ behavior: 'smooth' });
        }
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
            dom.selectedBossInfo.innerHTML = `<span id="boss-placeholder">已清空</span>`;
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

    function handleSavePreset() {
        const { state, savePresets } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        const { renderPresets } = window.App.UI.Render;
        const BOSSES_JSON = window.App.Data.Bosses;
        if (!state.focusedBossId) return alert('請先選擇 Boss 再儲存範本');
        const channel = parseInt(dom.channelInput.value) || 1;
        const boss = getBossById(state.focusedBossId);
        const preset = { id: `preset-${Date.now()}`, bossId: state.focusedBossId, channel, name: `${boss.name} Ch.${channel}` };
        state.presets.unshift(preset);
        savePresets();
        renderPresets();
        showToast('已儲存範本', { timeout: 1200 });
    }

    function handleSaveBatchPreset() {
        const { state, savePresets } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        const { renderPresets } = window.App.UI.Render;
        const BOSSES_JSON = window.App.Data.Bosses;
        if (!state.focusedBossId) return alert('請先選擇 Boss 再儲存批次範本');
        const raw = (dom.batchInput && dom.batchInput.value) ? dom.batchInput.value.trim() : '';
        const channels = parseChannelList(raw);
        if (!channels || channels.length === 0) return alert('請輸入正確的頻道或範圍');
        const boss = getBossById(state.focusedBossId);
        const preset = { id: `preset-${Date.now()}`, bossId: state.focusedBossId, channels, name: `${boss.name} x${channels.length}` };
        state.presets.unshift(preset);
        savePresets(); renderPresets();
        showToast('已儲存批次範本', { timeout: 1200 });
    }

    function applyPreset(preset) {
        if (!preset) return;
        selectBoss(preset.bossId);
        if (preset.channels) {
            preset.channels.forEach(ch => recordKillQuick(preset.bossId, ch, { autoinc: false }));
            showToast(`已批次新增 ${preset.channels.length} 筆紀錄`, { timeout: 1600 });
        } else {
            setChannel(preset.channel);
        }
    }

    function handleBatchApply() {
        const { state } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (!state.focusedBossId) return alert('請先選擇 Boss');
        const raw = dom.batchInput.value.trim();
        const channels = parseChannelList(raw);
        if (!channels || channels.length === 0) return alert('請輸入正確的頻道或範圍');
        channels.forEach(ch => recordKillQuick(state.focusedBossId, ch, { autoinc: false }));
        showToast(`已批次新增 ${channels.length} 筆紀錄`, { timeout: 1600 });
    }

    function updateChannel(delta) {
        const { dom } = window.App.UI.DOM;
        let val = parseInt(dom.channelInput.value) || 1;
        setChannel(val + delta);
    }

    function setChannel(val) {
        const { dom } = window.App.UI.DOM;
        let num = parseInt(val);
        if (num < 1) num = 1;
        if (num > 3000) num = 3000;
        if (dom.channelInput) dom.channelInput.value = num;
        if (dom.focusChannelInput) dom.focusChannelInput.value = num;
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
        recordKillQuick, handleFormSubmit, handleFocusSubmit, selectBoss, loadEntryToForm, deleteHistoryEntry, clearAllHistory,
        saveInlineChannel, saveInlineNotes, handleSavePreset, handleSaveBatchPreset, applyPreset, handleBatchApply,
        updateChannel, setChannel, showToast, showUndoToast,
        toggleViewMode, toggleSound, toggleSmartSort
    };
})();
