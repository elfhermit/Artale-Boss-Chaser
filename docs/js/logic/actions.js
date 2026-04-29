
(function () {
    // Shortcuts
    const getBossById = (id) => window.App.Core.Utils.getBossById(window.App.Data.Bosses, id);
    const { parseChannelList } = window.App.Core.Utils;

    function recordKillQuick(bossId, channel, opts = {}) {
        if (!bossId) return;
        const { state, saveHistory, saveLastChannel } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        const { renderHistoryTable, updateBossCard, renderBossCards, renderTodaySummary } = window.App.UI.Render;
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
        if (renderTodaySummary) renderTodaySummary();
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

        // Refresh recent-channel chips and heatmap for the focused boss
        if (state.focusedBossId === bossId) {
            const R = window.App.UI.Render;
            if (R.renderRecentChannelChips) R.renderRecentChannelChips(bossId);
            if (R.renderHeatmap) R.renderHeatmap(bossId);
        }

        // First-kill celebration (P0-02)
        const { saveSettings } = window.App.Core.State;
        if (!state.settings.firstKillCelebrated) {
            saveSettings({ firstKillCelebrated: true, onboarded: true });
            // Close onboarding overlay if open
            const ov = document.getElementById('onboarding-overlay');
            if (ov) ov.style.display = 'none';
            setTimeout(() => {
                showToast('🎉 太棒了！系統已自動跳到下一頻道，繼續按 Enter 即可秒速紀錄', { timeout: 3500 });
            }, 600);
        }
        
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

            // Render chip and heatmap
            const R = window.App.UI.Render;
            if (R.renderRecentChannelChips) R.renderRecentChannelChips(state.focusedBossId);
            if (R.renderHeatmap) R.renderHeatmap(state.focusedBossId);
        } else {
            // Clear chips/heatmap when unlocked
            if (dom.actionChannelChipsWrap) dom.actionChannelChipsWrap.style.display = 'none';
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
        const { renderHistoryTable, updateBossCard, renderTodaySummary } = window.App.UI.Render;

        const index = state.killHistory.findIndex(k => k.id === id);
        if (index === -1) return;
        const removed = state.killHistory.splice(index, 1)[0];
        saveHistory();
        renderHistoryTable();
        updateBossCard(removed.bossId);
        if (renderTodaySummary) renderTodaySummary();

        showUndoToast('已刪除一筆紀錄', () => {
            state.killHistory.push(removed);
            saveHistory();
            renderHistoryTable();
            updateBossCard(removed.bossId);
            if (renderTodaySummary) renderTodaySummary();
        }, { timeout: 6000 });
    }

    function clearAllHistory() {
        if (confirm("確定要清空所有紀錄嗎？")) {
            const { state, saveHistory } = window.App.Core.State;
            const { renderHistoryTable, updateBossCard, renderTodaySummary } = window.App.UI.Render;
            const { dom } = window.App.UI.DOM;
            state.killHistory = [];
            saveHistory();
            renderHistoryTable();
            document.querySelectorAll('.boss-card').forEach(card => updateBossCard(card.dataset.bossId));
            if (renderTodaySummary) renderTodaySummary();
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
    // 分享功能 — 純複製剪貼簿，良好 LINE/Discord 排版
    // =============================================

    function _copyToClipboard(text, successMsg) {
        const msg = successMsg || '已複製！貼到 LINE / Discord 分享吧 📋';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(msg, { timeout: 2000 }))
                .catch(() => {
                    _fallbackCopy(text);
                    showToast(msg, { timeout: 2000 });
                });
        } else {
            _fallbackCopy(text);
            showToast(msg, { timeout: 2000 });
        }
    }

    function _fallbackCopy(text) {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    function generateDailyReport() {
        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const { formatTime, getBossById } = window.App.Core.Utils;

        const now = new Date();
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const records = state.killHistory.filter(k => new Date(k.killTime) >= startOfDay);

        const M = now.getMonth() + 1, D = now.getDate();
        const timeStr = formatTime(now);

        if (records.length === 0) {
            return `🎮 Artale 今日戰報｜${M}/${D} ${timeStr}\n今天尚無任何擊殺紀錄。出發吧！⚔️`;
        }

        const bossCounter = new Map();
        let equip = 0, scroll = 0, star = 0;
        records.forEach(r => {
            bossCounter.set(r.bossId, (bossCounter.get(r.bossId) || 0) + 1);
            if (r.drops) {
                if (r.drops.equip) equip++;
                if (r.drops.scroll) scroll++;
                if (r.drops.star) star++;
            }
        });
        const totalDrops = equip + scroll + star;

        const sep = '━'.repeat(22);
        let text = `🎮 Artale 今日戰報｜${M}/${D} ${timeStr}\n${sep}\n`;
        text += `⚔️  擊殺：${records.length} 次\n`;
        text += `👾 Boss：${bossCounter.size} 種\n`;
        if (totalDrops > 0) {
            const parts = [];
            if (equip)  parts.push(`🛡️×${equip}`);
            if (scroll) parts.push(`📜×${scroll}`);
            if (star)   parts.push(`⭐×${star}`);
            text += `💎 爆寶：${totalDrops} 次（${parts.join(' ')}）\n`;
        } else {
            text += `💎 爆寶：0 次\n`;
        }

        text += `\n🏆 擊殺排行\n`;
        const medals = ['🥇', '🥈', '🥉'];
        const ranked = Array.from(bossCounter.entries()).sort((a, b) => b[1] - a[1]);
        ranked.forEach(([bossId, count], i) => {
            const boss = getBossById(BOSSES_JSON, bossId);
            if (!boss) return;
            const prefix = medals[i] || `${i + 1}.`;
            text += `${prefix} ${boss.name} ×${count}\n`;
        });

        text += `${sep}\n📲 Artale Boss Chaser PRO`;
        return text;
    }

    function generateShareText(selectedBossIds = null, format = 'detailed') {
        if (format === 'daily') return generateDailyReport();

        const { state } = window.App.Core.State;
        const BOSSES_JSON = window.App.Data.Bosses;
        const { calculateTimerState, formatTime } = window.App.Core.Utils;
        const { getBossById } = window.App.Core.Utils;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');

        // Group records by boss
        const bossMap = new Map();
        state.killHistory.forEach(record => {
            if (selectedBossIds && selectedBossIds.length > 0 && !selectedBossIds.includes(record.bossId)) return;
            const boss = getBossById(BOSSES_JSON, record.bossId);
            if (!boss) return;
            if (!bossMap.has(record.bossId)) bossMap.set(record.bossId, { boss, records: [] });
            const killDate = new Date(record.killTime);
            const minRespawn = new Date(killDate.getTime() + boss.minMinutes * 60000);
            const maxRespawn = new Date(killDate.getTime() + boss.maxMinutes * 60000);
            const ts = calculateTimerState(boss, record.killTime);
            bossMap.get(record.bossId).records.push({ record, ts, minRespawn, maxRespawn });
        });

        if (bossMap.size === 0) {
            return '🎮 Artale Boss Chaser\n目前選擇的 Boss 沒有任何追蹤紀錄。';
        }

        const sep = '━'.repeat(22);

        if (format === 'simple') {
            // 精簡：一行一筆，狀態 emoji 讓人掃一眼就知道
            let text = `⚡ Artale 速報｜${hh}:${mm}\n${sep}\n`;
            bossMap.forEach(({ boss, records }) => {
                records
                    .sort((a, b) => a.record.channel - b.record.channel)
                    .forEach(({ record, ts }) => {
                        let mark, statusText;
                        if (ts.status === 'alive') {
                            mark = '🟢'; statusText = '✅ 已出現';
                        } else if (ts.status === 'warning') {
                            mark = '🟡'; statusText = `⏳ 剩 ${ts.timer}`;
                        } else {
                            mark = '🔴'; statusText = '❌ 冷卻中';
                        }
                        text += `${mark} ${boss.name}  Ch.${record.channel}  ${statusText}\n`;
                    });
            });
            text += `${sep}\n📲 Artale Boss Chaser PRO`;
            return text;
        }

        // 詳細：分 Boss 段落，含擊殺時間與預估重生
        let text = `📋 Artale 狀態速報｜${hh}:${mm}\n${sep}\n`;
        bossMap.forEach(({ boss, records }) => {
            text += `\n🔥 ${boss.name}（${boss.respawn}）\n`;
            records
                .sort((a, b) => a.record.channel - b.record.channel)
                .forEach(({ record, ts, minRespawn, maxRespawn }) => {
                    const statusMark = ts.status === 'alive' ? '🟢' : ts.status === 'warning' ? '🟡' : '🔴';
                    const killStr  = formatTime(new Date(record.killTime));
                    const respawnStr = `${formatTime(minRespawn)}~${formatTime(maxRespawn)}`;
                    
                    const nowTime = Date.now();
                    const minMins = Math.ceil((minRespawn.getTime() - nowTime) / 60000);
                    const maxMins = Math.ceil((maxRespawn.getTime() - nowTime) / 60000);
                    
                    let estimateStr = '';
                    if (minMins > 0) {
                        estimateStr = `(預計 ${minMins}~${maxMins} 分鐘)`;
                    } else if (maxMins > 0) {
                        estimateStr = `(預計 ${maxMins} 分鐘內)`;
                    } else {
                        estimateStr = `(可出發)`;
                    }

                    const dropStr = (record.drops && (record.drops.equip || record.drops.scroll || record.drops.star))
                        ? ' 💎' : '';
                    text += `  ${statusMark} Ch.${String(record.channel).padEnd(4)} ⚔️${killStr}  🕐${respawnStr} ${estimateStr}${dropStr}\n`;
                });
        });
        text += `\n${sep}\n📲 Artale Boss Chaser PRO`;
        return text;
    }

    function shareBossStatus(text) {
        _copyToClipboard(text);
    }

    function openShareModal() {
        const { dom } = window.App.UI.DOM;
        const { renderShareModalOptions } = window.App.UI.Render;
        if (!dom.shareModal) return;
        renderShareModalOptions();
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
        const { state, saveSmartSort } = window.App.Core.State;
        const { renderBossCards } = window.App.UI.Render;
        saveSmartSort(!state.smartSortActive);
        renderBossCards();
        if (state.smartSortActive) showToast("已啟用智慧排序 (即將重生優先)", { timeout: 1000 });
        else showToast("已還原預設排序", { timeout: 1000 });
    }

    function shareDailyReport() {
        _copyToClipboard(generateDailyReport(), '今日戰報已複製 📋 貼到 LINE / Discord 分享吧！');
    }

    // ============================================================
    // P0-01 · Backup / Restore
    // ============================================================
    function exportData() {
        const { getAllPersistData, saveSettings } = window.App.Core.State;
        try {
            const payload = getAllPersistData();
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const d = new Date();
            const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            a.href = url;
            a.download = `artale-boss-${stamp}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
            saveSettings({ lastBackupAt: new Date().toISOString() });
            updateLastBackupMeta();
            showToast('已匯出 JSON 備份', { timeout: 1800 });
        } catch (e) {
            showToast('匯出失敗：' + e.message, { timeout: 2500 });
        }
    }

    function updateLastBackupMeta() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.lastBackupMeta) return;
        const t = state.settings.lastBackupAt;
        if (!t) { dom.lastBackupMeta.textContent = '尚未備份'; return; }
        const d = new Date(t);
        dom.lastBackupMeta.textContent = `最近備份：${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    function importDataFromFile(file) {
        if (!file) return;
        const { applyImportData } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        let mode = 'merge';
        if (dom.importModeRadios) {
            dom.importModeRadios.forEach(r => { if (r.checked) mode = r.value; });
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const payload = JSON.parse(e.target.result);
                const result = applyImportData(payload, mode);
                if (result.mode === 'merge') {
                    showToast(`已合併 ${result.added} 筆紀錄，重新載入...`, { timeout: 1500 });
                } else {
                    showToast('已取代為備份內容，重新載入...', { timeout: 1500 });
                }
                setTimeout(() => { location.reload(); }, 1000);
            } catch (err) {
                showToast('匯入失敗：' + err.message, { timeout: 3000 });
            }
        };
        reader.onerror = () => showToast('讀取檔案失敗', { timeout: 2000 });
        reader.readAsText(file);
    }

    function openSettings() {
        const { dom } = window.App.UI.DOM;
        const { state } = window.App.Core.State;
        if (!dom.settingsModal) return;
        if (dom.settingsDesktopNotification) dom.settingsDesktopNotification.checked = !!state.settings.desktopNotification;
        if (dom.settingsSoundType) dom.settingsSoundType.value = state.settings.soundType || 'ding';
        updateLastBackupMeta();
        dom.settingsModal.style.display = 'flex';
    }

    function closeSettings() {
        const { dom } = window.App.UI.DOM;
        if (dom.settingsModal) dom.settingsModal.style.display = 'none';
    }

    // ============================================================
    // P0-02 · Onboarding
    // ============================================================
    const ONB_STEPS = [
        {
            target: '#boss-monitoring-list',
            title: '點擊任一張 Boss 卡片',
            desc: '畫面下方會展開「獵殺專注面板」，所有操作集中在那裡。'
        },
        {
            target: '#action-bar',
            title: '輸入頻道，按 Enter 紀錄',
            desc: '頻道下方有「最近 / 幸運」chip，可一鍵填入。Enter 即送出。',
            requiresLock: true
        },
        {
            target: '#action-auto-inc',
            title: '系統會自動 +1 跳到下一頻道',
            desc: '勾選「自動+1」後，紀錄完直接前往下一頻道，連按 Enter 秒速跑頻。'
        }
    ];
    let onbStep = 0;

    function startOnboarding(forceRestart) {
        const { state, saveSettings } = window.App.Core.State;
        const { dom } = window.App.UI.DOM;
        if (!dom.onboardingOverlay) return;
        if (!forceRestart && state.settings.onboarded) return;
        if (!forceRestart && state.killHistory.length > 0) {
            // user already has data; mark as onboarded silently
            saveSettings({ onboarded: true });
            return;
        }
        onbStep = 0;
        dom.onboardingOverlay.style.display = 'flex';
        renderOnboardingStep();
    }

    function renderOnboardingStep() {
        const { dom } = window.App.UI.DOM;
        const step = ONB_STEPS[onbStep];
        if (!step) { finishOnboarding(); return; }

        if (dom.onbStepNum) dom.onbStepNum.textContent = `STEP ${String(onbStep+1).padStart(2,'0')} / 03`;
        if (dom.onbTitle) dom.onbTitle.textContent = step.title;
        if (dom.onbDesc) dom.onbDesc.textContent = step.desc;
        if (dom.onbDots && dom.onbDots.length) {
            dom.onbDots.forEach((d, i) => d.classList.toggle('active', i <= onbStep));
        }
        if (dom.onbNext) dom.onbNext.textContent = onbStep === ONB_STEPS.length - 1 ? '完成 ✓' : '下一步 →';

        // Position spotlight on target
        const tgt = document.querySelector(step.target);
        if (tgt && dom.onboardingSpotlight) {
            const rect = tgt.getBoundingClientRect();
            const pad = 8;
            const top = Math.max(0, rect.top - pad);
            const left = Math.max(0, rect.left - pad);
            const width = rect.width + pad * 2;
            const height = rect.height + pad * 2;
            dom.onboardingSpotlight.style.top = top + 'px';
            dom.onboardingSpotlight.style.left = left + 'px';
            dom.onboardingSpotlight.style.width = width + 'px';
            dom.onboardingSpotlight.style.height = height + 'px';
        }
    }

    function nextOnboardingStep() {
        onbStep++;
        if (onbStep >= ONB_STEPS.length) {
            finishOnboarding();
        } else {
            renderOnboardingStep();
        }
    }

    function finishOnboarding() {
        const { dom } = window.App.UI.DOM;
        const { saveSettings } = window.App.Core.State;
        if (dom.onboardingOverlay) dom.onboardingOverlay.style.display = 'none';
        saveSettings({ onboarded: true });
    }

    // ============================================================
    // P3-10 · Cheatsheet
    // ============================================================
    function openCheatsheet() {
        const { dom } = window.App.UI.DOM;
        if (dom.cheatsheetModal) dom.cheatsheetModal.style.display = 'flex';
    }
    function closeCheatsheet() {
        const { dom } = window.App.UI.DOM;
        if (dom.cheatsheetModal) dom.cheatsheetModal.style.display = 'none';
    }

    // ============================================================
    // P2-08 · Mini PiP
    // ============================================================
    let pipWindow = null;
    let pipTimer = null;

    function _renderPipContent(doc) {
        const { state } = window.App.Core.State;
        const { calculateTimerState, formatDuration } = window.App.Core.Utils;
        const BOSSES = window.App.Data.Bosses;
        const list = [];
        BOSSES.forEach(boss => {
            const records = state.killHistory.filter(k => k.bossId === boss.id);
            if (records.length === 0) return;
            let best = null;
            records.forEach(r => {
                const ts = calculateTimerState(boss, r.killTime);
                if (!best || ts.secondsToMin < best.secondsToMin) best = { ts, boss, channel: r.channel };
            });
            if (best && best.ts.status !== 'cooldown') list.push(best);
        });
        list.sort((a,b) => a.ts.secondsToMin - b.ts.secondsToMin);
        const top = list.slice(0, 8);

        const root = doc.getElementById('pip-root');
        if (!root) return;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        let html = `<div class="pip-mini">
          <div class="pip-head"><span class="pip-title">即將重生 (${top.length})</span><span class="pip-clock">${hh}</span></div>`;
        if (top.length === 0) {
            html += '<div class="pip-empty">目前沒有即將重生的 Boss</div>';
        } else {
            top.forEach(item => {
                const cls = item.ts.status === 'alive' ? 'good' : 'warn';
                const t = item.ts.status === 'alive' ? '可擊殺' : formatDuration(item.ts.secondsToMin);
                html += `<div class="pip-row" data-boss-id="${item.boss.id}">
                  <span class="pip-l"><i class="pip-dot ${cls}"></i>${item.boss.name} <em>Ch.${item.channel}</em></span>
                  <span class="pip-time ${cls}">${t}</span>
                </div>`;
            });
        }
        html += '<div class="pip-foot">點擊鎖定 →</div></div>';
        root.innerHTML = html;
        root.querySelectorAll('.pip-row').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.bossId;
                try { window.focus(); } catch (e) {}
                selectBoss(id);
            });
        });
    }

    async function togglePip() {
        if (pipWindow && !pipWindow.closed) {
            try { pipWindow.close(); } catch (e) {}
            return;
        }

        const setupContent = (doc) => {
            // Copy stylesheets so PiP content matches main theme
            try {
                Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
                    doc.head.appendChild(node.cloneNode(true));
                });
            } catch (e) {}
            doc.body.innerHTML = '<div id="pip-root"></div>';
            doc.body.style.margin = '0';
            doc.body.style.background = 'var(--color-bg, #121212)';
            doc.body.style.color = 'var(--color-text-primary, #e0e0e0)';
            doc.body.classList.add(document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode');
            _renderPipContent(doc);
            pipTimer = setInterval(() => {
                if (!pipWindow || pipWindow.closed) { clearInterval(pipTimer); return; }
                _renderPipContent(doc);
            }, 1000);
        };

        if ('documentPictureInPicture' in window) {
            try {
                pipWindow = await window.documentPictureInPicture.requestWindow({ width: 260, height: 360 });
                pipWindow.addEventListener('pagehide', () => {
                    clearInterval(pipTimer); pipTimer = null; pipWindow = null;
                });
                setupContent(pipWindow.document);
                return;
            } catch (e) {
                console.warn('Document PiP failed, falling back to window.open', e);
            }
        }

        // Fallback: window.open
        pipWindow = window.open('', 'abt-pip', 'width=280,height=380,resizable=yes,alwaysRaised=yes');
        if (!pipWindow) {
            showToast('瀏覽器封鎖了彈出視窗', { timeout: 2000 });
            return;
        }
        pipWindow.document.title = 'Artale Boss · 迷你';
        const checkClose = setInterval(() => {
            if (pipWindow.closed) {
                clearInterval(checkClose);
                clearInterval(pipTimer); pipTimer = null; pipWindow = null;
            }
        }, 500);
        setupContent(pipWindow.document);
    }

    // ============================================================
    // Original toggleTodaySummary
    // ============================================================
    function toggleTodaySummary() {
        const { dom } = window.App.UI.DOM;
        if (!dom.todaySummary) return;
        const collapsed = dom.todaySummary.classList.toggle('collapsed');
        if (dom.todaySummaryToggleIcon) {
            dom.todaySummaryToggleIcon.textContent = collapsed ? 'expand_more' : 'expand_less';
        }
        try { localStorage.setItem('todaySummaryCollapsed', String(collapsed)); } catch (e) {}
    }

    window.App.Logic.Actions = {
        recordKillQuick, handleFocusSubmit, selectBoss, loadEntryToForm, deleteHistoryEntry, clearAllHistory,
        saveInlineChannel, saveInlineNotes,
        updateChannel, setChannel, showToast, showUndoToast,
        toggleViewMode, toggleSound, toggleSmartSort,
        toggleFavorite, generateShareText, generateDailyReport, openShareModal, shareBossStatus,
        shareDailyReport, toggleTodaySummary,
        switchTab,
        // New
        exportData, importDataFromFile, openSettings, closeSettings, updateLastBackupMeta,
        startOnboarding, nextOnboardingStep, finishOnboarding,
        openCheatsheet, closeCheatsheet,
        togglePip
    };
})();
