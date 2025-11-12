// Per-boss LocalStorage helper (schema v1, per-boss key)
// Key format: abt_records_v1:<bossId>
const PERBOSS_PREFIX = 'abt_records_v1:';
const MAX_PER_BOSS = 300;

function bossKey(bossId) {
  return `${PERBOSS_PREFIX}${bossId}`;
}

function loadBossStorage(bossId) {
  try {
    const raw = localStorage.getItem(bossKey(bossId));
    if (!raw) return { records: [], meta: { schemaVersion: 'v1', bossId } };
    const obj = JSON.parse(raw);
    obj.meta = obj.meta || { schemaVersion: 'v1', bossId };
    return obj;
  } catch (e) {
    console.error('loadBossStorage error', e);
    return { records: [], meta: { schemaVersion: 'v1', bossId } };
  }
}

function saveBossStorage(bossId, obj) {
  try {
    localStorage.setItem(bossKey(bossId), JSON.stringify(obj));
    return true;
  } catch (e) {
    console.error('saveBossStorage error', e);
    return false;
  }
}

function addRecordForBoss(bossId, partial) {
  const { timestamp, channel, looted } = partial;
  if (!bossId || !timestamp || channel == null || looted == null) throw new Error('validation');
  const st = loadBossStorage(bossId);
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
  saveBossStorage(bossId, st);
  purgeOldRecordsIfNeeded(bossId);
  return record;
}

function updateRecordForBoss(bossId, id, changes) {
  const st = loadBossStorage(bossId);
  const idx = st.records.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('not found');
  const rec = st.records[idx];
  const updated = Object.assign({}, rec, changes, { updatedAt: new Date().toISOString() });
  st.records[idx] = updated;
  saveBossStorage(bossId, st);
  return updated;
}

function deleteRecordForBoss(bossId, id) {
  const st = loadBossStorage(bossId);
  const before = st.records.length;
  st.records = st.records.filter(r => r.id !== id);
  const ok = saveBossStorage(bossId, st);
  return ok && st.records.length < before;
}

function getRecordsForBoss({ bossId, date } = {}) {
  if (!bossId) return [];
  const st = loadBossStorage(bossId);
  let rows = st.records.slice();
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
  const st = loadBossStorage(bossId);
  if (!st.records || st.records.length <= MAX_PER_BOSS) return;
  const sorted = st.records.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const toRemove = sorted.slice(0, sorted.length - MAX_PER_BOSS).map(r => r.id);
  st.records = st.records.filter(r => !toRemove.includes(r.id));
  st.meta = st.meta || {};
  st.meta.lastPurgeAt = new Date().toISOString();
  saveBossStorage(bossId, st);
}

// export/import across all per-boss keys
function exportAllPerBoss() {
  const out = { recordsByBoss: {}, meta: { exportedAt: new Date().toISOString(), schemaVersion: 'v1' } };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PERBOSS_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      const obj = JSON.parse(raw);
      const bossId = key.slice(PERBOSS_PREFIX.length);
      out.recordsByBoss[bossId] = obj;
    } catch (e) { console.warn('exportAllPerBoss parse error', key, e); }
  }
  return JSON.stringify(out, null, 2);
}

function importAllPerBoss(json) {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    if (!obj || !obj.recordsByBoss) throw new Error('invalid');
    Object.keys(obj.recordsByBoss).forEach(bossId => {
      const val = obj.recordsByBoss[bossId];
      saveBossStorage(bossId, val);
    });
    return true;
  } catch (e) {
    console.error('importAllPerBoss failed', e);
    return false;
  }
}

// migrationTool: convert single-key storage (abt_records_v1 with records array) -> per-boss keys
function migrationToolFromSingleKey(singleKeyName = 'abt_records_v1', options = { dryRun: false }) {
  try {
    const raw = localStorage.getItem(singleKeyName);
    if (!raw) return { ok: false, reason: 'no single key found' };
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.records)) return { ok: false, reason: 'invalid format' };
    const summary = {};
    obj.records.forEach(r => {
      const bid = r.bossId || 'unknown';
      summary[bid] = summary[bid] || [];
      summary[bid].push(r);
    });
    if (options.dryRun) return { ok: true, summary }; // return structure without writing
    // write per-boss
    Object.keys(summary).forEach(bossId => {
      const records = summary[bossId];
      // ensure records array items have version/createdAt
      const fixed = records.map(rec => Object.assign({ version: 'v1', createdAt: rec.createdAt || new Date().toISOString(), updatedAt: rec.updatedAt || rec.createdAt || new Date().toISOString(), note: rec.note || '' }, rec));
      saveBossStorage(bossId, { records: fixed, meta: { schemaVersion: 'v1', bossId, migratedAt: new Date().toISOString() } });
    });
    return { ok: true, migratedBosses: Object.keys(summary), counts: Object.fromEntries(Object.keys(summary).map(b => [b, summary[b].length])) };
  } catch (e) {
    console.error('migration failed', e);
    return { ok: false, reason: e.message };
  }
}

// expose module to window for console access
window.PerBossStorage = {
  loadBossStorage, saveBossStorage,
  addRecordForBoss, updateRecordForBoss, deleteRecordForBoss, getRecordsForBoss,
  purgeOldRecordsIfNeeded, exportAllPerBoss, importAllPerBoss, migrationToolFromSingleKey,
  _internal: { PERBOSS_PREFIX }
};

// EOF
