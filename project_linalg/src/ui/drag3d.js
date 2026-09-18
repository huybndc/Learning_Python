import { orbit, zoom, dragOnScreenPlane, pick3d } from '../geometry/space3d.js';

/* Điều khiển cảnh 3D bằng chuột/cảm ứng:
   - kéo trên nền trống  -> xoay góc nhìn
   - kéo trúng đầu mũi tên -> di chuyển vector đó trong không gian
   - lăn chuột            -> phóng to / thu nhỏ
   Toàn bộ phần toán nằm ở geometry/space3d.js, đây chỉ nối sự kiện DOM. */

const ORBIT_SPEED = 0.008;

/**
 * @param canvas      thẻ canvas của bảng vẽ 3D
 * @param api.camera  () => camera hiện tại
 * @param api.setCamera (cam) => void
 * @param api.handles () => [[x,y,z], …] các điểm kéo được
 * @param api.moveHandle (index, point) => void
 * @param api.onHover (index|-1) => void
 * @param api.snap    bước bắt lưới khi kéo (0 = không bắt)
 */
export function enableOrbit(canvas, api) {
  const st = { mode: null, index: -1, last: null, hover: -1 };
  const snapStep = api.snap ?? 0.5;

  const at = ev => {
    const r = canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  };

  const snap = p => (snapStep > 0 ? p.map(x => Math.round(x / snapStep) * snapStep) : p);

  const setHover = i => {
    if (i === st.hover) return;
    st.hover = i;
    if (api.onHover) api.onHover(i);
  };

  canvas.addEventListener('pointerdown', ev => {
    const pt = at(ev);
    const i = api.handles ? pick3d(api.camera(), pt, api.handles()) : -1;
    st.mode = i >= 0 ? 'handle' : 'orbit';
    st.index = i;
    st.last = pt;
    setHover(i);
    canvas.setPointerCapture(ev.pointerId);
    canvas.parentElement?.classList.add('dragging');
    ev.preventDefault();
  });

  canvas.addEventListener('pointermove', ev => {
    const pt = at(ev);
    if (!st.mode) {
      setHover(api.handles ? pick3d(api.camera(), pt, api.handles()) : -1);
      return;
    }
    if (st.mode === 'orbit') {
      const [dx, dy] = [pt[0] - st.last[0], pt[1] - st.last[1]];
      // kéo sang phải thì cảnh quay theo chiều thuận với cảm giác của tay
      api.setCamera(orbit(api.camera(), -dx * ORBIT_SPEED, dy * ORBIT_SPEED));
      st.last = pt;
    } else {
      const moved = dragOnScreenPlane(api.camera(), pt, api.handles()[st.index]);
      if (moved) api.moveHandle(st.index, snap(moved));
    }
    ev.preventDefault();
  });

  const end = ev => {
    if (!st.mode) return;
    st.mode = null;
    st.index = -1;
    canvas.parentElement?.classList.remove('dragging');
    if (ev.pointerId != null && canvas.hasPointerCapture?.(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => setHover(-1));

  canvas.addEventListener('wheel', ev => {
    ev.preventDefault();
    api.setCamera(zoom(api.camera(), ev.deltaY > 0 ? 1.1 : 0.9));
  }, { passive: false });

  return st;
}
