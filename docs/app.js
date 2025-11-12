// Runtime helpers (shared, available immediately)
// LocalStorage helper (schema v1, single key abt_records_v1)
const STORAGE_KEY = 'abt_records_v1';
const MAX_PER_BOSS = 300;

function loadStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { records: [], meta: { schemaVersion: 'v1' } };
		return JSON.parse(raw);
	} catch (e) {
		console.error('loadStorage error', e);
		return { records: [], meta: { schemaVersion: 'v1' } };
	}
}

function saveStorage(obj) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
		return true;
	} catch (e) {
		console.error('saveStorage error', e);
		return false;
	}
}

function addRecord(partial) {
	const { bossId, timestamp, channel, looted } = partial;
	if (!bossId || !timestamp || !channel || looted == null) throw new Error('validation');
	const st = loadStorage();
	const now = new Date().toISOString();
	const record = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
		bossId,
		timestamp,
		channel: Number(channel),
		looted: !!looted,
		note: partial.note || '',
		createdAt: now,
		updatedAt: now,
		version: 'v1'
	};
	st.records.push(record);
	saveStorage(st);
	purgeOldRecordsIfNeeded(bossId);
	return record;
}

function updateRecord(id, changes) {
	const st = loadStorage();
	const idx = st.records.findIndex(r => r.id === id);
	if (idx === -1) throw new Error('not found');
	const rec = st.records[idx];
	const updated = Object.assign({}, rec, changes, { updatedAt: new Date().toISOString() });
	st.records[idx] = updated;
	saveStorage(st);
	return updated;
}

function deleteRecord(id) {
	const st = loadStorage();
	const before = st.records.length;
	st.records = st.records.filter(r => r.id !== id);
	const ok = saveStorage(st);
	return ok && st.records.length < before;
}

function getRecords({ bossId, date } = {}) {
	const st = loadStorage();
	let rows = st.records.slice();
	if (bossId) rows = rows.filter(r => r.bossId === bossId);
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
}

function purgeOldRecordsIfNeeded(bossId) {
	const st = loadStorage();
	const forBoss = st.records.filter(r => r.bossId === bossId);
	if (forBoss.length <= MAX_PER_BOSS) return;
	const sorted = forBoss.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
	const toRemove = sorted.slice(0, sorted.length - MAX_PER_BOSS).map(r => r.id);
	st.records = st.records.filter(r => !toRemove.includes(r.id));
	st.meta = st.meta || {};
	st.meta.lastPurgeAt = new Date().toISOString();
	saveStorage(st);
}

function exportJSON() { return JSON.stringify(loadStorage(), null, 2); }

function importJSON(json) {
	try {
		const obj = typeof json === 'string' ? JSON.parse(json) : json;
		if (!obj || !Array.isArray(obj.records)) throw new Error('invalid');
		saveStorage(obj);
		return true;
	} catch (e) {
		console.error('importJSON failed', e);
		return false;
	}
}

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
			el('label', {}, '頻道：'), el('input', {id: 'record-channel', type: 'number', min: 1, max: 3000}), el('br'),
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

	// set default time to now
	document.getElementById('record-time').value = local;

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
			if (errors.length) { alert(errors.join('\n')); return; }
			try {
				if (editId) {
					// update
					const updated = updateRecord(editId, { bossId, timestamp: new Date(t).toISOString(), channel: chNum, looted, note });
					renderRecords(bossId, new Date(t));
					clearRecordForm();
					alert('已儲存修改');
				} else {
					const rec = addRecord({ bossId, timestamp: new Date(t).toISOString(), channel: chNum, looted, note });
					renderRecords(bossId, new Date(t));
					// clear note / channel
					document.getElementById('record-note').value = '';
					document.getElementById('record-channel').value = '';
					alert('新增完成');
				}
			} catch (e) {
				alert('操作失敗：' + e.message);
			}
		});
	}

	function renderRecords(bossId, date) {
		recordsRoot.innerHTML = '';
		const title = el('h5', {}, `紀錄 — ${bossId || '全部'}`);
		recordsRoot.appendChild(title);
		const rows = getRecords({ bossId, date });
		if (!rows.length) { recordsRoot.appendChild(el('p', {}, '無紀錄')); return; }
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
					el('button', {type: 'button', 'data-id': r.id, class: 'btn-small'}, '刪除')
				)
			);
			tr.querySelector('button').addEventListener('click', (ev) => {
				const id = ev.target.getAttribute('data-id');
				if (confirm('確定刪除此紀錄？')) {
					deleteRecord(id);
					renderRecords(bossId, date);
				}
			});
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
			// search filters the dropdown and compact list
			searchInput.addEventListener('input', () => {
				const q = searchInput.value.trim().toLowerCase();
				if (!q) return renderBosses(bosses);
				const filtered = bosses.filter(b => (b.name || '').toLowerCase().includes(q) || ((b.respawn||'') + (b.minMinutes||'')).toString().toLowerCase().includes(q));
				renderBosses(filtered);
			});
			// initial render of records (none selected)
			renderRecords();
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

