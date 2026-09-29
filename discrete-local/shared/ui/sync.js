import { reconcile, trackLocal, validEntries, isSyncKey } from '../logic/sync.js';
import { t as T, onLangChange } from '../i18n/index.js';

/* ---------------------------------------------------------------
   ĐỒNG BỘ TỰ ĐỘNG GIỮA CÁC MÁY (D37) — phía trình duyệt.
   - Mở trang / quay lại tab: lấy bản của máy khác từ /__sync, gộp vào
     localStorage; có gì mới thì tải lại trang một lần để mọi màn đọc dữ liệu mới.
   - Mỗi 10 giây và lúc rời tab: có thay đổi thì gửi bản chụp của máy này lên.
   - Nút mây cạnh nút sáng/tối: trạng thái; bấm = đồng bộ ngay.
   Máy chủ không có /__sync (mở từ file build) ⇒ coi như tắt, app chạy như cũ.
   --------------------------------------------------------------- */

const META = 'sync:meta';          // { device, base } — base: bản chụp lần trước (xem logic/sync.js)
const RELOADED = 'sync:reloaded';  // sessionStorage: chống tải lại liên tục
const PUSH_EVERY = 10000;

let meta = null;
let lastSent = '';
let info = { state: 'wait' };      // wait | ok | off | err
let btn = null;
let busy = null;

function readLocal() {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!isSyncKey(k)) o[k] = localStorage.getItem(k);
  }
  return o;
}

function loadMeta() {
  let m = null;
  try { m = JSON.parse(localStorage.getItem(META)); } catch { /* hỏng thì làm lại */ }
  if (!m?.device || typeof m.base !== 'object') {
    m = { device: 'b' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), base: {} };
  }
  return m;
}

const saveMeta = () => { try { localStorage.setItem(META, JSON.stringify(meta)); } catch { /* đầy */ } };

/** Đọc lại meta trước mỗi lượt: tab khác cùng máy có thể vừa đồng bộ (giữ bản cũ trong bộ nhớ sẽ đè mất). */
function refreshMeta() {
  const m = loadMeta();
  if (m.device === meta.device) meta = m;
}

function setInfo(next) {
  info = { ...info, ...next };
  if (!btn) return;
  btn.dataset.state = info.state;
  const time = info.at ? new Date(info.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–';
  const text = info.state === 'ok' ? T('sync.ok', { label: info.label, dir: info.dir, time, n: info.devices })
    : info.state === 'off' ? T('sync.off')
      : info.state === 'err' ? T('sync.err', { msg: info.msg }) : T('sync.wait');
  btn.title = text;
  btn.setAttribute('aria-label', text);
}

/** Gửi bản chụp của máy này (chỉ khi có đổi, trừ khi `force`). */
async function push({ force = false, leaving = false } = {}) {
  if (info.state !== 'ok' && info.state !== 'err') return;
  refreshMeta();
  const tracked = trackLocal(meta.base, readLocal(), Date.now());
  meta.base = tracked.base;
  if (tracked.changed) saveMeta();
  const body = JSON.stringify({ device: meta.device, entries: meta.base });
  if (!force && body === lastSent) return;
  // keepalive giới hạn 64 KB — lúc đóng tab mà bản chụp lớn thì nhờ lần gửi 10 giây trước
  const res = await fetch('/__sync', {
    method: 'PUT', body, headers: { 'Content-Type': 'application/json' }, keepalive: leaving && body.length < 60000,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.status);
  lastSent = body;
  setInfo({ state: 'ok', at: Date.now() });
}

/** Lấy bản các máy khác, gộp, gửi lại bản đã gộp. Trả về true nếu localStorage vừa đổi. */
async function pull() {
  const res = await fetch('/__sync', { cache: 'no-store' });
  const data = res.ok ? await res.json().catch(() => null) : null;
  if (!data?.dir) { setInfo({ state: 'off' }); return false; }
  refreshMeta();
  const others = data.snapshots.filter(s => s.device !== meta.device).map(validEntries).filter(Boolean);
  const { base, writes } = reconcile(meta.base, readLocal(), others, Date.now());
  for (const [k, v] of Object.entries(writes)) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* đầy */ }
  }
  meta.base = base;
  saveMeta();
  const devices = new Set([meta.device, ...data.snapshots.map(s => s.device)]).size;
  setInfo({ state: 'ok', label: data.label, dir: data.dir, devices });
  await push({ force: !lastSent });
  return Object.keys(writes).length > 0;
}

/** Một lượt đồng bộ; có dữ liệu mới thì tải lại trang (tối đa một lần mỗi 10 giây). */
function syncNow() {
  busy ||= pull()
    .then(changed => {
      if (!changed) return;
      let last = 0;
      try { last = Number(sessionStorage.getItem(RELOADED)) || 0; sessionStorage.setItem(RELOADED, String(Date.now())); } catch { /* riêng tư */ }
      if (Date.now() - last > 10000) location.reload();
    })
    .catch(e => setInfo({ state: 'err', msg: String(e.message || e) }))
    .finally(() => { busy = null; });
  return busy;
}

const pushQuiet = opts => push(opts).catch(e => setInfo({ state: 'err', msg: String(e.message || e) }));

/** Gọi một lần lúc mở trang (setupShell của app, home.js của trang tổng quan). */
export function startSync() {
  try { meta = loadMeta(); } catch { return; }       // chế độ riêng tư: không có localStorage
  saveMeta();
  const anchor = document.getElementById('theme-toggle');
  if (anchor) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sync-btn';
    btn.addEventListener('click', () => syncNow());
    anchor.after(btn);
  }
  setInfo({});
  onLangChange(() => setInfo({}));
  syncNow();
  setInterval(() => { if (!busy) pushQuiet(); }, PUSH_EVERY);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow(); else pushQuiet();
  });
  window.addEventListener('pagehide', () => pushQuiet({ leaving: true }));
}
