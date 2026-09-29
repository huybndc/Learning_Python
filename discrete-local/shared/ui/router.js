import { parseRoute, routeOf } from '../logic/route.js';

/* ---------------------------------------------------------------
   ĐIỀU HƯỚNG: trạng thái nằm trên địa chỉ (#/practice/ch3/sop) nên Back/Forward,
   tải lại trang và link chép ra đều mở đúng chỗ. Địa chỉ cũ (#/ch3/interactive)
   được đổi sang dạng mới; địa chỉ lạ thì về Tổng quan. Nút nhảy chéo trong
   trang chương vẫn khai báo bằng data-goto="ch3:interactive".
   --------------------------------------------------------------- */

let current = { view: 'home' };
export const currentRoute = () => current;

/** Mở một địa chỉ: chuỗi '#/…' hoặc đối tượng route. */
export function go(r) {
  window.location.hash = typeof r === 'string' ? r : routeOf(r);
}

/** @param {string[]} chapters  @param {(route: object) => void} onChange */
export function startRouter(chapters, onChange) {
  const apply = animate => {
    const r = parseRoute(window.location.hash, chapters) ?? { view: 'home' };
    const canon = routeOf(r);
    if (window.location.hash !== canon) history.replaceState(null, '', canon);
    const run = () => { current = r; onChange(r); window.scrollTo(0, 0); };
    if (!animate || !document.startViewTransition) { run(); return; }
    // chuyển màn bị huỷ (bấm liên tục, tab bị ẩn) thì các promise bị từ chối — không phải lỗi
    const vt = document.startViewTransition(run);
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p?.catch(() => {}));
  };
  window.addEventListener('hashchange', () => apply(true));
  document.addEventListener('click', e => {
    const b = e.target.closest?.('[data-goto]');
    if (!b) return;
    const r = parseRoute('#/' + b.dataset.goto.replace(':', '/'), chapters);
    if (r) go(r);
  });
  apply(false);
}
