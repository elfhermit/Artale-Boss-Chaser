// Storage wrappers: delegate to PerBossStorage (per-boss keys)
// Ensure PerBossStorage is available (docs/js/storage.js must be loaded before this script)
function addRecord(partial) {
    const { bossId } = partial;
    if (!bossId) throw new Error('validation: bossId required');
    return PerBossStorage.addRecordForBoss(bossId, partial);
}

function updateRecord(id, changes) {
    // changes must include bossId for per-boss update
    const bossId = changes && changes.bossId ? changes.bossId : null;
    if (!bossId) {
        // try to find bossId by scanning per-boss storages (fallback)
        // this is rare; prefer passing bossId in changes when calling update
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(PerBossStorage._internal.PERBOSS_PREFIX)) continue;
            const bid = key.slice(PerBossStorage._internal.PERBOSS_PREFIX.length);
            const rows = PerBossStorage.getRecordsForBoss({ bossId: bid });
            if (rows.find(r => r.id === id)) return PerBossStorage.updateRecordForBoss(bid, id, changes);
        }
        throw new Error('bossId required for update');
    }
    return PerBossStorage.updateRecordForBoss(bossId, id, changes);
}

function deleteRecord(id) {
    // find and delete across per-boss keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(PerBossStorage._internal.PERBOSS_PREFIX)) continue;
        const bid = key.slice(PerBossStorage._internal.PERBOSS_PREFIX.length);
        const rows = PerBossStorage.getRecordsForBoss({ bossId: bid });
        if (rows.find(r => r.id === id)) return PerBossStorage.deleteRecordForBoss(bid, id);
    }
    return false;
}

function getRecords({ bossId, date } = {}) {
    if (bossId) return PerBossStorage.getRecordsForBoss({ bossId, date });
    // aggregate all per-boss records
    try {
        const allJson = PerBossStorage.exportAllPerBoss();
        const obj = JSON.parse(allJson);
        const aggregated = [];
        Object.keys(obj.recordsByBoss || {}).forEach(bid => {
            const val = obj.recordsByBoss[bid];
            if (val && Array.isArray(val.records)) aggregated.push(...val.records);
        });
        let rows = aggregated;
        if (date) {
            const d = new Date(date);
            if (!isNaN(d)) {
                const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
                const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
                rows = rows.filter(r => {
                    const t = new Date(r.timestamp);
                    return t >= start && t <= end;
                });
            }
        }
        rows.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        return rows;
    } catch (e) {
        console.error('getRecords aggregate failed', e);
        return [];
    }
}

function purgeOldRecordsIfNeeded(bossId) {
    return PerBossStorage.purgeOldRecordsIfNeeded(bossId);
}

function exportJSON() { return PerBossStorage.exportAllPerBoss(); }

function importJSON(json) { return PerBossStorage.importAllPerBoss(json); }

function calculateRespawnTimes(killISO, bossRule) {
	const kill = new Date(killISO);
	if (isNaN(kill)) return { type: 'invalid', times: [], humanReadable: '無效時間' };
	const type = bossRule.type || (bossRule.minMinutes != null && bossRule.maxMinutes != null ? 'rangeMinutes' : 'fixedMinutes');
	if (type === 'fixedMinutes') {
		const minutes = bossRule.minMinutes || 0;
		const t = new Date(kill.getTime() + minutes*60000);
		return { type, times: [t.toISOString()], humanReadable: `${t.toLocaleString()}` };
	}
	if (type === 'rangeMinutes') {
		const min = bossRule.minMinutes;
		const max = bossRule.maxMinutes;
		if (min == null || max == null) return { type: 'invalid', times: [], humanReadable: '缺少 min/max' };
		const tmin = new Date(kill.getTime() + min*60000);
		const tmax = new Date(kill.getTime() + max*60000);
		return { type, times: [tmin.toISOString(), tmax.toISOString()], humanReadable: `${tmin.toLocaleString()} ～ ${tmax.toLocaleString()}` };
	}
	if (type === 'hourlyOffset') {
		const offset = Number(bossRule.offsetMinute);
		if (isNaN(offset)) return { type: 'invalid', times: [], humanReadable: '缺少 offsetMinute' };
		const next = new Date(kill.getTime());
		next.setSeconds(0,0);
		if (next.getMinutes() >= offset) next.setHours(next.getHours()+1);
		next.setMinutes(offset);
		return { type, times: [next.toISOString()], humanReadable: `${next.toLocaleString()}` };
	}
	return { type: 'unknown', times: [], humanReadable: '' };
}


	// --- UI init and render helpers ---
	function init() {
		const container = document.getElementById('app');
		const searchInput = document.getElementById('search');
		const calculatorRoot = document.getElementById('calculator');
		const calcResult = document.getElementById('calc-result');
		const recordFormRoot = document.getElementById('record-form-root');
		const recordsRoot = document.getElementById('records-root');
		let BOSSES = [];

		// helper to show non-blocking notifications (uses Materialize M.toast when available)
		function showToast(msg, opts = {}) {
			try {
				if (window.M && typeof M.toast === 'function') {
					M.toast(Object.assign({ html: msg, displayLength: 4000 }, opts));
					return;
				}
			} catch (e) {
				// fallthrough to alert
			}
			// fallback
			alert(typeof msg === 'string' ? msg : String(msg));
		}

		// small helper to create elements
		function el(tag, props = {}, ...children) {
			const e = document.createElement(tag);
			for (const k in props) {
				if (k === 'class') e.className = props[k];
				else if (k === 'html') e.innerHTML = props[k];
				else e.setAttribute(k, props[k]);
			}
			children.flat().forEach(c => { if (c == null) return; e.append(typeof c === 'string' ? document.createTextNode(c) : c); });
			return e;
		}

		// --- render helpers ---
		function renderBosses(list) {
			// Populate compact dropdown and list (if present) instead of large grid
			const dropdown = document.getElementById('boss-dropdown');
			const compact = document.getElementById('boss-list-compact');
			if (dropdown) {
				dropdown.innerHTML = '';
				list.forEach(b => {
					dropdown.appendChild(el('option', {value: b.id}, b.name + (b.minMinutes != null ? ` (${b.minMinutes}~${b.maxMinutes}分)` : '')));
				});
			}
			// also update the record form boss select if present
			const recordBossSel = document.getElementById('record-boss');
			if (recordBossSel) {
				recordBossSel.innerHTML = '';
				list.forEach(b => recordBossSel.appendChild(el('option', {value: b.id}, b.name)));
			}
			if (compact) {
				compact.innerHTML = '';
				if (!list.length) {
					compact.appendChild(el('p', {}, '找不到符合條件的 Boss'));
					return;
				}
				list.forEach(b => {
					const item = el('div', {class: 'compact-boss-item', style: 'padding:6px;border-bottom:1px solid #eee;cursor:pointer'}, `${b.name} ${b.minMinutes!=null ? '('+b.minMinutes+'~'+b.maxMinutes+'分)':''}`);
					item.addEventListener('click', () => {
						const sel = document.getElementById('boss-dropdown');
						if (sel) sel.value = b.id;
						prefillCalculator(b);
					});
					compact.appendChild(item);
				});
			}
			// hide legacy boss-grid if present
			const grid = document.getElementById('boss-grid');
			if (grid) grid.style.display = 'none';
	}

	function prefillCalculator(boss) {
		// populate calculator form with selected boss
		const sel = document.getElementById('calc-boss');
		if (sel) sel.value = boss.id;
		// show sample result (if calculator exists)
		if (calcResult) calcResult.innerHTML = `<strong>已選：</strong>${boss.name}（${boss.respawn || ''}）`;
		// also set record form boss select if present
		const rf = document.getElementById('record-boss');
		if (rf) rf.value = boss.id;
	}

	function buildCalculatorAndRecordUI(bosses) {
		// calculator
		if (calculatorRoot) calculatorRoot.innerHTML = '';
		// prepare default local time
		const now = new Date();
		const padded = (n) => n.toString().padStart(2, '0');
		const local = `${now.getFullYear()}-${padded(now.getMonth()+1)}-${padded(now.getDate())}T${padded(now.getHours())}:${padded(now.getMinutes())}`;
		// optional calculator UI: only build if calculatorRoot exists
		if (calculatorRoot) {
			const bossSelect = el('select', {id: 'calc-boss'});
			bosses.forEach(b => bossSelect.appendChild(el('option', {value: b.id}, b.name)));
			const timeInput = el('input', {id: 'calc-time', type: 'datetime-local'});
			// default now (local tz, drop seconds)
			timeInput.value = local;

			const calcBtn = el('button', {type: 'button'}, '計算復活時間');
			calcBtn.addEventListener('click', () => {
				const bossId = document.getElementById('calc-boss').value;
				const boss = bosses.find(b => b.id === bossId);
				if (!boss) { calcResult.innerText = '請先選擇 Boss'; return; }
				const tval = document.getElementById('calc-time').value;
				if (!tval) { calcResult.innerText = '請輸入擊殺時間'; return; }
				const killISO = new Date(tval).toISOString();
				const result = calculateRespawnTimes(killISO, boss);
				if (calcResult) calcResult.innerHTML = `<strong>${boss.name}</strong><br/>${result.humanReadable}`;
			});

			const wrapper = el('div', {},
				el('label', {}, 'Boss：'), bossSelect,
				el('br'),
				el('label', {}, '擊殺時間：'), timeInput,
				el('div', {style: 'margin-top:8px'}, calcBtn)
			);
			calculatorRoot.appendChild(wrapper);
		}

		// --- record form ---
		recordFormRoot.innerHTML = '';
		const rf = el('div', {class: 'card', style: 'padding:12px'},
			el('h5', {}, '新增擊殺紀錄'),
			el('label', {}, 'Boss：'), el('select', {id: 'record-boss'}, bosses.map(b => el('option', {value: b.id}, b.name))), el('br'),
			el('label', {}, '擊殺時間：'), el('input', {id: 'record-time', type: 'datetime-local'}), el('br'),
			el('label', {}, '頻道：'), el('input', {id: 'record-channel', type: 'number', min: 1, max: 3000, step: 1}), el('br'),
			el('label', {}, '是否出貨：')
		);

		// radio inputs wrapped in labels (Materialize-friendly and reliably clickable)
		const lootedWrapper = el('div', {style: 'margin-top:8px'});
		const yesLabel = el('label', {},
			el('input', {type: 'radio', id: 'looted-yes', name: 'looted', value: 'yes'}),
			el('span', {}, '是')
		);
		const noLabel = el('label', {},
			el('input', {type: 'radio', id: 'looted-no', name: 'looted', value: 'no'}),
			el('span', {}, '否')
		);
		lootedWrapper.appendChild(yesLabel);
		lootedWrapper.appendChild(noLabel);
		rf.appendChild(lootedWrapper);
		rf.appendChild(el('br'));

		rf.appendChild(el('label', {}, '備註：'));
		rf.appendChild(el('textarea', {id: 'record-note', rows: 2, maxlength: 200}));
		rf.appendChild(el('br'));
		rf.appendChild(el('button', {id: 'record-add', type: 'button'}, '新增紀錄'));
		recordFormRoot.appendChild(rf);

		// build filters UI placeholder (will be filled by buildFiltersUI)
		const filtersRoot = document.getElementById('filters-root');
		if (filtersRoot) filtersRoot.innerHTML = '';

	// set default time to now
	document.getElementById('record-time').value = local;
	// default looted to '否' to reduce accidental validation failures
	try { document.getElementById('looted-no').checked = true; } catch (e) { /* ignore if not present */ }

		// restore last selected boss if present
		const lastBoss = localStorage.getItem('abt_lastBoss');
		const recordBossSel = document.getElementById('record-boss');
		if (lastBoss && recordBossSel) {
			try { recordBossSel.value = lastBoss; } catch (e) { /* ignore */ }
		}

		// record add / edit handling
		const recordAddBtn = document.getElementById('record-add');
		const recordIdInput = el('input', {type: 'hidden', id: 'record-id'});
		rf.appendChild(recordIdInput);

		function clearRecordForm() {
			document.getElementById('record-id').value = '';
			document.getElementById('record-note').value = '';
			document.getElementById('record-channel').value = '';
			document.getElementById('looted-yes').checked = false;
			document.getElementById('looted-no').checked = false;
			document.getElementById('record-add').innerText = '新增紀錄';
		}

		recordAddBtn.addEventListener('click', () => {
			const bossId = document.getElementById('record-boss').value;
			const t = document.getElementById('record-time').value;
			const channel = document.getElementById('record-channel').value;
			const looted = document.getElementById('looted-yes').checked ? true : (document.getElementById('looted-no').checked ? false : null);
			const note = document.getElementById('record-note').value.trim();
			const editId = document.getElementById('record-id').value;
			// validation
			const errors = [];
			if (!bossId) errors.push('請選擇 Boss');
			if (!t) errors.push('請輸入擊殺時間');
			const chNum = Number(channel);
			if (!channel || isNaN(chNum) || !Number.isInteger(chNum) || chNum < 1 || chNum > 3000) errors.push('頻道請輸入 1..3000 的整數');
			if (looted == null) errors.push('請選擇是否出貨');
			if (note.length > 200) errors.push('備註不可超過 200 字');
			if (errors.length) { showToast(errors.join('<br/>'), { classes: 'red darken-1 white-text' }); return; }
			try {
				if (editId) {
					// update
					const updated = updateRecord(editId, { bossId, timestamp: new Date(t).toISOString(), channel: chNum, looted, note });
					renderRecords(bossId, new Date(t));
					clearRecordForm();
					showToast('已儲存修改', { classes: 'green darken-1' });
				} else {
					const rec = addRecord({ bossId, timestamp: new Date(t).toISOString(), channel: chNum, looted, note });
					renderRecords(bossId, new Date(t));
					// clear note / channel
					document.getElementById('record-note').value = '';
					document.getElementById('record-channel').value = '';
					// remember last boss
					try { localStorage.setItem('abt_lastBoss', bossId); } catch (e) {}
					showToast('新增完成', { classes: 'green darken-1' });
				}
			} catch (e) {
				showToast('操作失敗：' + e.message, { classes: 'red darken-1 white-text' });
			}
		});

		// build filters UI and wire handlers
		function buildFiltersUI(bosses) {
			const root = document.getElementById('filters-root');
			if (!root) return;
			root.innerHTML = '';
			const wrapper = el('div', {class: 'card', style: 'padding:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center'},
				el('label', {style: 'margin-right:6px'}, '頻道：'), el('input', {type: 'number', id: 'filter-channel', placeholder: '全部', min:1, max:3000, style: 'width:90px'}),
				el('label', {style: 'margin-right:6px'}, '是否出貨：'),
				(el('select', {id: 'filter-looted'}, el('option', {value: ''}, '全部'), el('option', {value: 'yes'}, '是'), el('option', {value: 'no'}, '否'))),
				el('label', {style: 'margin-right:6px'}, '起始日期：'), el('input', {type: 'date', id: 'filter-start', style: 'width:150px'}),
				el('label', {style: 'margin-right:6px'}, '結束日期：'), el('input', {type: 'date', id: 'filter-end', style: 'width:150px'}),
				el('button', {id: 'filter-apply', type: 'button', class: 'btn'}, '套用篩選'),
				el('button', {id: 'filter-clear', type: 'button', class: 'btn grey'}, '清除')
			);
			root.appendChild(wrapper);

			document.getElementById('filter-apply').addEventListener('click', () => {
				// render with current filters
				const bossSel = document.getElementById('record-boss');
				const bossId = bossSel ? bossSel.value : null;
				renderRecords(bossId);
			});

			document.getElementById('filter-clear').addEventListener('click', () => {
				document.getElementById('filter-channel').value = '';
				document.getElementById('filter-looted').value = '';
				document.getElementById('filter-start').value = '';
				document.getElementById('filter-end').value = '';
				const bossSel = document.getElementById('record-boss');
				const bossId = bossSel ? bossSel.value : null;
				renderRecords(bossId);
			});
		}

		// helper to read current filter values from UI
		function readFiltersFromUI() {
			const ch = document.getElementById('filter-channel');
			const lo = document.getElementById('filter-looted');
			const st = document.getElementById('filter-start');
			const ed = document.getElementById('filter-end');
			const result = {};
			if (ch && ch.value) {
				const n = Number(ch.value);
				if (!isNaN(n) && Number.isInteger(n)) result.channel = n;
			}
			if (lo && lo.value) result.looted = lo.value === 'yes' ? true : (lo.value === 'no' ? false : undefined);
			if (st && st.value) result.startDate = st.value; // yyyy-mm-dd
			if (ed && ed.value) result.endDate = ed.value;
			return result;
		}

		// expose buildFiltersUI to be called after bosses load
		window.__abt_buildFiltersUI = buildFiltersUI;
	}

	function renderRecords(bossId, date) {
		recordsRoot.innerHTML = '';
		const title = el('h5', {}, `紀錄 — ${bossId || '全部'}`);
		recordsRoot.appendChild(title);
		// get all records for boss (or all if no bossId)
		let rows = getRecords({ bossId });
		// gather filters from UI
		const filters = readFiltersFromUI ? readFiltersFromUI() : {};
		// if a specific date is passed, override start/end filters to that date
		if (date) {
			const d = new Date(date);
			if (!isNaN(d)) {
				const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
				filters.startDate = `${y.toString().padStart(4,'0')}-${(m+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
				filters.endDate = filters.startDate;
			}
		}
		// apply channel filter
		if (filters.channel != null) rows = rows.filter(r => Number(r.channel) === Number(filters.channel));
		// apply looted filter
		if (filters.looted === true) rows = rows.filter(r => r.looted === true);
		if (filters.looted === false) rows = rows.filter(r => r.looted === false);
		// apply date range filter (startDate/endDate are yyyy-mm-dd strings)
		if (filters.startDate || filters.endDate) {
			let start = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : new Date(0);
			let end = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999') : new Date(8640000000000000);
			rows = rows.filter(r => {
				const t = new Date(r.timestamp);
				return t >= start && t <= end;
			});
		}
		if (!rows.length) { recordsRoot.appendChild(el('p', {}, '無紀錄')); return; }

		// show active filters badges
		const active = [];
		if (filters.channel != null) active.push(`頻道: ${filters.channel}`);
		if (filters.looted === true) active.push('出貨: 是');
		if (filters.looted === false) active.push('出貨: 否');
		if (filters.startDate || filters.endDate) {
			if (filters.startDate === filters.endDate) active.push(`日期: ${filters.startDate}`);
			else active.push(`日期: ${filters.startDate || '開始'} → ${filters.endDate || '結束'}`);
		}
		if (active.length) {
			const af = el('div', {style: 'margin-bottom:8px'});
			active.forEach(a => af.appendChild(el('span', {class: 'chip', style: 'margin-right:6px'}, a)));
			recordsRoot.appendChild(af);
		}
		const table = el('table', {class: 'striped'});
		const thead = el('thead', {}, el('tr', {}, el('th', {}, 'Time'), el('th', {}, 'Channel'), el('th', {}, 'Looted'), el('th', {}, 'Note'), el('th', {}, '預計復活'), el('th', {}, 'Actions')));
		table.appendChild(thead);
		const tbody = el('tbody');
		rows.forEach(r => {
			// compute respawn using boss rule if available
			const boss = BOSSES.find(b => b.id === r.bossId);
			const resp = boss ? calculateRespawnTimes(r.timestamp, boss) : { humanReadable: '—' };
			const tr = el('tr', {},
				el('td', {}, new Date(r.timestamp).toLocaleString()),
				el('td', {}, String(r.channel)),
				el('td', {}, r.looted ? '是' : '否'),
				el('td', {}, r.note || ''),
				el('td', {}, resp.humanReadable || '—'),
				el('td', {},
					el('button', {type: 'button', 'data-id': r.id, class: 'btn-small delete-btn'}, '刪除'),
					el('button', {type: 'button', 'data-id': r.id, class: 'btn-small edit-btn', style: 'margin-left:6px'}, '編輯')
				)
			);
			// attach delete handler
			tr.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (ev) => {
				const id = ev.target.getAttribute('data-id');
				if (confirm('確定刪除此紀錄？')) {
					deleteRecord(id);
					renderRecords(bossId, date);
				}
			}));
			// attach edit handler
			tr.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (ev) => {
				const id = ev.target.getAttribute('data-id');
				const rec = rows.find(x => x.id === id);
				if (!rec) return showToast('找不到紀錄');
				try {
					document.getElementById('record-id').value = rec.id;
					document.getElementById('record-boss').value = rec.bossId;
					const dt = new Date(rec.timestamp);
					const pad = (n)=>String(n).padStart(2,'0');
					const localVal = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
					document.getElementById('record-time').value = localVal;
					document.getElementById('record-channel').value = String(rec.channel);
					if (rec.looted) document.getElementById('looted-yes').checked = true; else document.getElementById('looted-no').checked = true;
					document.getElementById('record-note').value = rec.note || '';
					document.getElementById('record-add').innerText = '儲存修改';
					showToast('已載入紀錄供編輯');
				} catch (e) { showToast('編輯失敗：' + e.message, { classes: 'red darken-1 white-text' }); }
			}));
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);
		recordsRoot.appendChild(table);
	}

	// --- fetch bosses and initialize UI ---
	fetch('bosses/bosses.json')
		.then(r => r.json())
		.then(bosses => {
			BOSSES = bosses;
			renderBosses(bosses);
			buildCalculatorAndRecordUI(bosses);
				// build filters UI now that DOM exists
				if (window.__abt_buildFiltersUI) window.__abt_buildFiltersUI(bosses);
			// search filters the dropdown and compact list
			searchInput.addEventListener('input', () => {
				const q = searchInput.value.trim().toLowerCase();
				if (!q) return renderBosses(bosses);
				const filtered = bosses.filter(b => (b.name || '').toLowerCase().includes(q) || ((b.respawn||'') + (b.minMinutes||'')).toString().toLowerCase().includes(q));
				renderBosses(filtered);
			});
			// initial render of records (none selected)
			renderRecords();

			// export/import handlers
			const exportBtn = document.getElementById('export-btn');
			const importBtn = document.getElementById('import-btn');
			const importFile = document.getElementById('import-file');
			if (exportBtn) exportBtn.addEventListener('click', () => {
				const blob = new Blob([PerBossStorage.exportAllPerBoss()], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url; a.download = 'abt_records_export.json';
				document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
			});
			if (importBtn && importFile) {
				importBtn.addEventListener('click', () => importFile.click());
				importFile.addEventListener('change', (ev) => {
					const f = ev.target.files && ev.target.files[0];
					if (!f) return;
					const reader = new FileReader();
					reader.onload = () => {
						try {
							const ok = PerBossStorage.importAllPerBoss(reader.result);
							showToast(ok ? '匯入成功' : '匯入失敗', { classes: ok ? 'green darken-1' : 'red darken-1 white-text' });
							renderRecords();
						} catch (e) { showToast('匯入錯誤：' + e.message, { classes: 'red darken-1 white-text' }); }
					};
					reader.readAsText(f);
				});
			}
		})
		.catch(err => {
			console.error('載入 bosses.json 失敗', err);
			container.innerHTML = '<p style="color:crimson">無法載入 boss 資料 (請確認 docs/bosses/bosses.json 存在)</p>';
		});

}

// ensure init runs even if script is loaded after DOMContentLoaded (e.g. tests.html dynamic load)
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

