
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

        // 2. 表單提交
        if (dom.killForm) dom.killForm.addEventListener('submit', actions.handleFormSubmit);

        // 3. 頻道操作 (Desktop)
        if (dom.channelSubBtn) dom.channelSubBtn.addEventListener('click', () => actions.updateChannel(-1));
        if (dom.channelAddBtn) dom.channelAddBtn.addEventListener('click', () => actions.updateChannel(1));
        dom.quickChannels.forEach(chip => {
            chip.addEventListener('click', () => actions.setChannel(chip.dataset.channel));
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
        
        if (dom.shareNativeBtn) {
            dom.shareNativeBtn.addEventListener('click', () => {
                const text = dom.shareTextContent ? dom.shareTextContent.textContent : '';
                actions.shareBossStatus(text);
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

        // Desktop Target Lock Mode Events
        if (dom.unlockBossBtn) {
            dom.unlockBossBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.selectBoss(null);
            });
        }
        
        if (dom.targetShareBtn) {
            dom.targetShareBtn.addEventListener('click', (e) => {
               e.stopPropagation();
               if (!state.focusedBossId) return;
               const text = actions.generateShareText([state.focusedBossId], 'simple');
               actions.shareBossStatus(text);
            });
        }

        // Desktop Focus Mode Events
        if (dom.focusSubmitBtn) {
            dom.focusSubmitBtn.addEventListener('click', () => {
                actions.handleFocusSubmit();
            });
        }

        // Desktop channel sync
        if (dom.focusChannelInput) {
            dom.focusChannelInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (dom.channelInput) dom.channelInput.value = val;
                if (dom.mobileChannelInput) dom.mobileChannelInput.value = val;
            });
        }
        if (dom.channelInput) {
            dom.channelInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (dom.focusChannelInput) dom.focusChannelInput.value = val;
                if (dom.mobileChannelInput) dom.mobileChannelInput.value = val;
            });
        }

        if (dom.focusChSubBtn) {
            dom.focusChSubBtn.addEventListener('click', () => {
                const val = parseInt(dom.focusChannelInput.value) || 1;
                const newVal = Math.max(1, val - 1);
                dom.focusChannelInput.value = newVal;
                if (dom.mobileChannelInput) dom.mobileChannelInput.value = newVal;
            });
        }

        if (dom.focusChAddBtn) {
            dom.focusChAddBtn.addEventListener('click', () => {
                const val = parseInt(dom.focusChannelInput.value) || 1;
                const newVal = Math.min(3000, val + 1);
                dom.focusChannelInput.value = newVal;
                if (dom.mobileChannelInput) dom.mobileChannelInput.value = newVal;
            });
        }

        if (dom.focusChannelInput) {
            dom.focusChannelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    actions.handleFocusSubmit();
                }
            });
        }

        // =============================================
        // V2: Bottom Nav Tab Switching
        // =============================================
        if (dom.bottomNav) {
            dom.bottomNav.addEventListener('click', (e) => {
                const btn = e.target.closest('.bottom-nav-btn');
                if (btn && btn.dataset.tab) {
                    actions.switchTab(btn.dataset.tab);
                }
            });
        }

        // =============================================
        // V2: Mobile Record Panel Events
        // =============================================

        // Mobile 最愛芯片點擊
        if (dom.mobileFavChips) {
            dom.mobileFavChips.addEventListener('click', (e) => {
                const chip = e.target.closest('.fav-boss-chip');
                if (chip) {
                    actions.selectBoss(chip.dataset.bossId);
                }
            });
        }

        // Mobile 下拉選單
        if (dom.mobileBossDropdown) {
            dom.mobileBossDropdown.addEventListener('change', (e) => {
                if (e.target.value) {
                    actions.selectBoss(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Mobile Unlock Boss
        if (dom.mobileUnlockBtn) {
            dom.mobileUnlockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actions.selectBoss(null);
            });
        }
        
        if (dom.mobileTargetShareBtn) {
            dom.mobileTargetShareBtn.addEventListener('click', (e) => {
               e.stopPropagation();
               if (!state.focusedBossId) return;
               const text = actions.generateShareText([state.focusedBossId], 'simple');
               actions.shareBossStatus(text);
            });
        }

        // Mobile Submit
        if (dom.mobileSubmitBtn) {
            dom.mobileSubmitBtn.addEventListener('click', () => {
                actions.handleFocusSubmit();
            });
        }

        // Mobile Channel +/- buttons
        if (dom.mobileChSubBtn) {
            dom.mobileChSubBtn.addEventListener('click', () => {
                const val = parseInt(dom.mobileChannelInput.value) || 1;
                const newVal = Math.max(1, val - 1);
                dom.mobileChannelInput.value = newVal;
                if (dom.focusChannelInput) dom.focusChannelInput.value = newVal;
            });
        }
        if (dom.mobileChAddBtn) {
            dom.mobileChAddBtn.addEventListener('click', () => {
                const val = parseInt(dom.mobileChannelInput.value) || 1;
                const newVal = Math.min(3000, val + 1);
                dom.mobileChannelInput.value = newVal;
                if (dom.focusChannelInput) dom.focusChannelInput.value = newVal;
            });
        }

        // Mobile Channel input sync & Enter key
        if (dom.mobileChannelInput) {
            dom.mobileChannelInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (dom.focusChannelInput) dom.focusChannelInput.value = val;
                if (dom.channelInput) dom.channelInput.value = val;
            });
            dom.mobileChannelInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    actions.handleFocusSubmit();
                }
            });
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
            const isMobile = window.innerWidth < 900;
            const dropEquip = isMobile ? dom.mobileDropEquip : dom.focusDropEquip;
            const dropScroll = isMobile ? dom.mobileDropScroll : dom.focusDropScroll;
            const dropStar = isMobile ? dom.mobileDropStar : dom.focusDropStar;

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
            } else if (dom.killForm) {
                dom.killForm.requestSubmit();
            }
            return;
        }

        if (!isTyping && (e.key === 'k' || e.key === 'K')) {
            if (state.focusedBossId) {
                const isMobile = window.innerWidth < 900;
                const channelInput = isMobile ? dom.mobileChannelInput : dom.focusChannelInput;
                const ch = channelInput ? (parseInt(channelInput.value) || 1) : (parseInt(dom.channelInput.value) || 1);
                actions.recordKillQuick(state.focusedBossId, ch, { autoinc: true, viaKeyboard: true });
            }
        }
    }

    window.App.UI.Events = { setupEventListeners };
})();
