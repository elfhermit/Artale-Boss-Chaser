
(function () {
    function setupEventListeners() {
        // Shortcuts
        const { dom } = window.App.UI.DOM;
        const { state, saveTheme, savePresets } = window.App.Core.State;
        const { renderHistoryTable, updateSortIcons, updateCardVisibility, renderPresets, renderBossCards } = window.App.UI.Render;
        const actions = window.App.Logic.Actions;

        // 1. 點擊 Boss 卡片
        dom.bossListContainer.addEventListener('click', (e) => {
            // 阻止 quick-ch-input 觸發卡片選取
            if (e.target.classList.contains('quick-ch-input')) {
                e.stopPropagation();
                return;
            }
            // 最愛按鈕
            const favBtn = e.target.closest('.fav-toggle-btn');
            if (favBtn) {
                e.stopPropagation();
                actions.toggleFavorite(favBtn.dataset.bossId);
                return;
            }
            // 快速紀錄按鈕（使用內嵌頻道輸入）
            const quickBtn = e.target.closest('.quick-kill-btn');
            if (quickBtn) {
                e.stopPropagation();
                const bid = quickBtn.dataset.bossId;
                const panel = quickBtn.closest('[data-quick-panel]');
                const chInput = panel ? panel.querySelector('.quick-ch-input') : null;
                const ch = chInput ? (parseInt(chInput.value) || 1) : (parseInt(dom.channelInput.value) || 1);
                actions.recordKillQuick(bid, ch, { autoinc: false });
                // 自動遞增內嵌輸入
                if (chInput) chInput.value = Math.min(3000, ch + 1);
                return;
            }
            const card = e.target.closest('.boss-card');
            if (card) {
                actions.selectBoss(card.dataset.bossId);
            }
        });



        // 4. 篩選
        dom.filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                state.currentFilter = chip.dataset.filter;
                dom.filterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === state.currentFilter));
                updateCardVisibility();
            });
        });

        // 5. 搜尋 (consolidated — only one input now)
        if (dom.searchInput) {
            dom.searchInput.addEventListener('input', (e) => {
                state.currentSearch = e.target.value;
                renderBossCards();
            });
        }

        // 6. 排序標題點擊
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

        // 7. 點擊歷史紀錄列 (編輯模式)
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

        // 8. 刪除按鈕 (事件委派)
        dom.historyTableBody.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.delete-btn');
            if (delBtn) {
                e.stopPropagation();
                const historyId = delBtn.closest('tr').dataset.historyId;
                actions.deleteHistoryEntry(historyId);
            }
        });

        // 9. 其他
        dom.themeToggleBtn.addEventListener('click', toggleTheme);
        dom.clearHistoryBtn.addEventListener('click', actions.clearAllHistory);
        document.addEventListener('keydown', handleGlobalKeydown);

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


        // New Features
        if (dom.viewToggleBtn) dom.viewToggleBtn.addEventListener('click', actions.toggleViewMode);
        if (dom.soundToggleBtn) dom.soundToggleBtn.addEventListener('click', actions.toggleSound);
        if (dom.smartSortBtn) {
            dom.smartSortBtn.addEventListener('click', () => {
                actions.toggleSmartSort();
            });
        }

        // Desktop 最愛芯片點擊（事件委派）
        if (dom.favChipsContainer) {
            dom.favChipsContainer.addEventListener('click', (e) => {
                const chip = e.target.closest('.fav-boss-chip');
                if (chip) {
                    actions.selectBoss(chip.dataset.bossId);
                }
            });
        }

        // Desktop 下拉選單快選 Boss
        if (dom.bossSelectorDropdown) {
            dom.bossSelectorDropdown.addEventListener('change', (e) => {
                if (e.target.value) {
                    actions.selectBoss(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // 分享按鈕
        if (dom.shareStatusBtn) {
            dom.shareStatusBtn.addEventListener('click', actions.openShareModal);
        }

        // 分享 Modal 事件
        if (dom.shareModalClose) {
            dom.shareModalClose.addEventListener('click', () => { dom.shareModal.style.display = 'none'; });
        }
        if (dom.shareCloseBtn2) {
            dom.shareCloseBtn2.addEventListener('click', () => { dom.shareModal.style.display = 'none'; });
        }
        
        function updateSharePreview() {
            if (!dom.shareTextContent) return;
            let format = 'detailed';
            dom.shareFormatRadios.forEach(r => { if (r.checked) format = r.value; });
            
            const selectedBossIds = [];
            if (dom.shareBossList) {
                const checkboxes = dom.shareBossList.querySelectorAll('.share-boss-checkbox');
                checkboxes.forEach(cb => {
                    if (cb.checked) selectedBossIds.push(cb.value);
                });
            }
            
            dom.shareTextContent.textContent = actions.generateShareText(selectedBossIds, format);
        }

        if (dom.shareFormatRadios) {
            dom.shareFormatRadios.forEach(radio => {
                radio.addEventListener('change', updateSharePreview);
            });
        }
        
        if (dom.shareBossList) {
            dom.shareBossList.addEventListener('change', updateSharePreview);
        }

        if (dom.shareSelectAllBtn) {
            dom.shareSelectAllBtn.addEventListener('click', () => {
                if (!dom.shareBossList) return;
                const checkboxes = dom.shareBossList.querySelectorAll('.share-boss-checkbox');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !allChecked);
                updateSharePreview();
            });
        }

        if (dom.shareCopyBtn) {
            dom.shareCopyBtn.addEventListener('click', () => {
                const text = dom.shareTextContent ? dom.shareTextContent.textContent : '';
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text)
                        .then(() => actions.showToast('已複製到剪貼簿！', { timeout: 1500 }))
                        .catch(() => actions.showToast('複製失敗，請手動選取', { timeout: 2000 }));
                } else {
                    const el = document.createElement('textarea');
                    el.value = text;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    actions.showToast('已複製到剪貼簿！', { timeout: 1500 });
                }
            });
        }
        
        if (dom.shareModal) {
            dom.shareModal.addEventListener('click', (e) => {
                if (e.target === dom.shareModal) dom.shareModal.style.display = 'none';
            });
            // Update preview right after the modal becomes visible
            const observer = new MutationObserver((mutations) => {
                 mutations.forEach((mutation) => {
                     if (mutation.attributeName === 'style') {
                         if (dom.shareModal.style.display !== 'none') {
                             updateSharePreview();
                         }
                     }
                 });
             });
             observer.observe(dom.shareModal, { attributes: true });
        }

        // === Unified Action Bar Events ===
        if (dom.actionUnlockBtn) {
            dom.actionUnlockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.selectBoss(null);
            });
        }
        if (dom.actionShareBtn) {
            dom.actionShareBtn.addEventListener('click', (e) => {
               e.stopPropagation();
               if (!state.focusedBossId) return;
               const text = actions.generateShareText([state.focusedBossId], 'simple');
               actions.shareBossStatus(text);
            });
        }
        if (dom.actionSubmitBtn) {
            dom.actionSubmitBtn.addEventListener('click', () => actions.handleFocusSubmit());
        }
        if (dom.actionChSubBtn) {
            dom.actionChSubBtn.addEventListener('click', () => actions.updateChannel(-1));
        }
        if (dom.actionChAddBtn) {
            dom.actionChAddBtn.addEventListener('click', () => actions.updateChannel(1));
        }
        if (dom.actionChannelInput) {
            dom.actionChannelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') actions.handleFocusSubmit();
            });
        }

        // === 今日戰況 ===
        if (dom.todayShareBtn) {
            dom.todayShareBtn.addEventListener('click', actions.shareDailyReport);
        }
        if (dom.todaySummaryToggle) {
            dom.todaySummaryToggle.addEventListener('click', actions.toggleTodaySummary);
        }

        // === Bottom Nav Tab Switching ===
        if (dom.bottomNav) {
            dom.bottomNav.addEventListener('click', (e) => {
                const btn = e.target.closest('.bottom-nav-btn');
                if (btn && btn.dataset.tab) {
                    actions.switchTab(btn.dataset.tab);
                }
            });
        }

        // ==========================================================
        // Settings Modal (P0-01 + P1-05)
        // ==========================================================
        if (dom.settingsBtn) {
            dom.settingsBtn.addEventListener('click', actions.openSettings);
        }
        if (dom.settingsModalClose) {
            dom.settingsModalClose.addEventListener('click', actions.closeSettings);
        }
        if (dom.settingsModal) {
            dom.settingsModal.addEventListener('click', (e) => {
                if (e.target === dom.settingsModal) actions.closeSettings();
            });
        }
        if (dom.exportDataBtn) {
            dom.exportDataBtn.addEventListener('click', actions.exportData);
        }
        if (dom.importDropZone) {
            dom.importDropZone.addEventListener('click', () => {
                if (dom.importFileInput) dom.importFileInput.click();
            });
            ['dragenter', 'dragover'].forEach(ev =>
                dom.importDropZone.addEventListener(ev, (e) => {
                    e.preventDefault(); e.stopPropagation();
                    dom.importDropZone.classList.add('drag-active');
                })
            );
            ['dragleave', 'drop'].forEach(ev =>
                dom.importDropZone.addEventListener(ev, (e) => {
                    e.preventDefault(); e.stopPropagation();
                    dom.importDropZone.classList.remove('drag-active');
                })
            );
            dom.importDropZone.addEventListener('drop', (e) => {
                const f = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
                if (f) actions.importDataFromFile(f);
            });
        }
        if (dom.importFileInput) {
            dom.importFileInput.addEventListener('change', (e) => {
                const f = e.target.files && e.target.files[0];
                if (f) actions.importDataFromFile(f);
                e.target.value = '';
            });
        }
        if (dom.settingsDesktopNotification) {
            dom.settingsDesktopNotification.addEventListener('change', async (e) => {
                const { saveSettings } = window.App.Core.State;
                const { requestDesktopNotification } = window.App.Core.Utils;
                if (e.target.checked) {
                    const perm = await requestDesktopNotification();
                    if (perm === 'granted') {
                        saveSettings({ desktopNotification: true });
                        actions.showToast('已啟用桌面通知', { timeout: 1500 });
                    } else {
                        e.target.checked = false;
                        saveSettings({ desktopNotification: false });
                        actions.showToast(perm === 'denied' ? '通知權限已被封鎖，請至瀏覽器設定開啟' : '此瀏覽器不支援通知', { timeout: 2500 });
                    }
                } else {
                    saveSettings({ desktopNotification: false });
                }
            });
        }
        if (dom.settingsSoundType) {
            dom.settingsSoundType.addEventListener('change', (e) => {
                const { saveSettings } = window.App.Core.State;
                saveSettings({ soundType: e.target.value });
            });
        }
        if (dom.settingsTestSound) {
            dom.settingsTestSound.addEventListener('click', () => {
                const { state } = window.App.Core.State;
                const { playNotificationSound } = window.App.Core.Utils;
                playNotificationSound(state.settings.soundType);
            });
        }
        if (dom.settingsTestNotification) {
            dom.settingsTestNotification.addEventListener('click', async () => {
                const { showDesktopNotification, requestDesktopNotification } = window.App.Core.Utils;
                const perm = await requestDesktopNotification();
                if (perm === 'granted') {
                    showDesktopNotification('Artale Boss Chaser', '這是一則測試通知 ✅', null);
                } else {
                    actions.showToast('未取得通知權限', { timeout: 2000 });
                }
            });
        }
        if (dom.settingsRestartOnboarding) {
            dom.settingsRestartOnboarding.addEventListener('click', () => {
                actions.closeSettings();
                actions.startOnboarding(true);
            });
        }
        if (dom.settingsClearAll) {
            dom.settingsClearAll.addEventListener('click', () => {
                actions.closeSettings();
                actions.clearAllHistory();
            });
        }

        // ==========================================================
        // Onboarding (P0-02)
        // ==========================================================
        if (dom.helpBtn) {
            dom.helpBtn.addEventListener('click', () => actions.startOnboarding(true));
        }
        if (dom.onbNext) dom.onbNext.addEventListener('click', actions.nextOnboardingStep);
        if (dom.onbSkip) dom.onbSkip.addEventListener('click', actions.finishOnboarding);

        // ==========================================================
        // Cheatsheet (P3-10)
        // ==========================================================
        if (dom.cheatsheetClose) dom.cheatsheetClose.addEventListener('click', actions.closeCheatsheet);
        if (dom.cheatsheetModal) {
            dom.cheatsheetModal.addEventListener('click', (e) => {
                if (e.target === dom.cheatsheetModal) actions.closeCheatsheet();
            });
        }

        // ==========================================================
        // PiP (P2-08)
        // ==========================================================
        if (dom.pipBtn) dom.pipBtn.addEventListener('click', actions.togglePip);

        // ==========================================================
        // Recent / Lucky channel chips (P1-06)
        // ==========================================================
        if (dom.actionChannelChips) {
            let pressTimer = null;
            dom.actionChannelChips.addEventListener('click', (e) => {
                const btn = e.target.closest('.rc');
                if (!btn) return;
                const ch = parseInt(btn.dataset.channel);
                if (!isNaN(ch)) {
                    actions.setChannel(ch);
                    if (dom.actionChannelInput) dom.actionChannelInput.focus();
                }
            });
            dom.actionChannelChips.addEventListener('pointerdown', (e) => {
                const btn = e.target.closest('.rc');
                if (!btn) return;
                pressTimer = setTimeout(() => {
                    const ch = parseInt(btn.dataset.channel);
                    if (!isNaN(ch)) {
                        const { saveLastChannel } = window.App.Core.State;
                        saveLastChannel(ch);
                        actions.showToast(`已設為起始頻道：Ch.${ch}`, { timeout: 1500 });
                    }
                    pressTimer = null;
                }, 600);
            });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
                dom.actionChannelChips.addEventListener(ev, () => {
                    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                })
            );
        }

        // ==========================================================
        // Resize: re-render history when crossing breakpoint
        // ==========================================================
        let _lastMobile = null;
        window.addEventListener('resize', () => {
            const { isMobileWidth } = window.App.UI.Render;
            const m = isMobileWidth();
            if (_lastMobile !== null && _lastMobile !== m) {
                window.App.UI.Render.renderHistoryTable();
            }
            _lastMobile = m;
        });

        // ==========================================================
        // Auto-fade keyboard hint
        // ==========================================================
        if (dom.kbdHint) {
            setTimeout(() => {
                dom.kbdHint.classList.add('fade-out');
                setTimeout(() => { if (dom.kbdHint) dom.kbdHint.style.display = 'none'; }, 500);
            }, 4000);
        }
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

        // Target Lock Mode Shortcuts (Non-typing)
        if (!isTyping && state.focusedBossId) {
            const dropEquip = dom.actionDropEquip;
            const dropScroll = dom.actionDropScroll;
            const dropStar = dom.actionDropStar;

            if (e.key === '1' && dropEquip) { e.preventDefault(); dropEquip.checked = !dropEquip.checked; return; }
            if (e.key === '2' && dropScroll) { e.preventDefault(); dropScroll.checked = !dropScroll.checked; return; }
            if (e.key === '3' && dropStar) { e.preventDefault(); dropStar.checked = !dropStar.checked; return; }
        }

        if (!isTyping && /^[1-9]$/.test(e.key)) {
            actions.setChannel(parseInt(e.key));
            return;
        }

        if (!isTyping && (e.key === 'ArrowUp' || e.key === 'ArrowRight')) { actions.updateChannel(1); return; }
        if (!isTyping && (e.key === 'ArrowDown' || e.key === 'ArrowLeft')) { actions.updateChannel(-1); return; }

        if (e.key === 'Enter' && !isTyping) {
            if (state.focusedBossId) {
                actions.handleFocusSubmit();
            }
            return;
        }

        if (!isTyping && (e.key === 'k' || e.key === 'K')) {
            if (state.focusedBossId) {
                const ch = dom.actionChannelInput ? (parseInt(dom.actionChannelInput.value) || 1) : 1;
                actions.recordKillQuick(state.focusedBossId, ch, { autoinc: true, viaKeyboard: true });
            }
            return;
        }

        // ===== New shortcuts (P3-10) =====
        // ? -> cheatsheet (Shift+/ on US keyboards yields '?')
        if (!isTyping && e.key === '?') {
            e.preventDefault();
            actions.openCheatsheet();
            return;
        }
        // / -> focus search
        if (!isTyping && e.key === '/') {
            e.preventDefault();
            if (dom.searchInput) {
                dom.searchInput.focus();
                dom.searchInput.select();
            }
            return;
        }
        // L -> toggle view mode
        if (!isTyping && (e.key === 'l' || e.key === 'L')) {
            actions.toggleViewMode();
            return;
        }
        // T -> toggle theme
        if (!isTyping && (e.key === 't' || e.key === 'T')) {
            toggleTheme();
            return;
        }
        // N -> jump to next-respawning boss
        if (!isTyping && (e.key === 'n' || e.key === 'N')) {
            const { calculateTimerState } = window.App.Core.Utils;
            const BOSSES = window.App.Data.Bosses;
            let target = null, minSec = Infinity;
            BOSSES.forEach(boss => {
                const records = state.killHistory.filter(k => k.bossId === boss.id);
                if (!records.length) return;
                records.forEach(r => {
                    const ts = calculateTimerState(boss, r.killTime);
                    if (ts.secondsToMin > 0 && ts.secondsToMin < minSec) {
                        minSec = ts.secondsToMin; target = boss.id;
                    }
                });
            });
            if (target) actions.selectBoss(target);
            else actions.showToast('沒有即將重生的 Boss', { timeout: 1500 });
            return;
        }
        // Esc -> unlock
        if (!isTyping && e.key === 'Escape') {
            // close modals first
            if (dom.cheatsheetModal && dom.cheatsheetModal.style.display === 'flex') { actions.closeCheatsheet(); return; }
            if (dom.settingsModal && dom.settingsModal.style.display === 'flex') { actions.closeSettings(); return; }
            if (dom.shareModal && dom.shareModal.style.display === 'flex') { dom.shareModal.style.display = 'none'; return; }
            if (state.focusedBossId) {
                actions.selectBoss(null);
            }
            return;
        }
    }

    window.App.UI.Events = { setupEventListeners };
})();
