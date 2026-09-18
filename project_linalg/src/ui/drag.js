import { hitTest, snap } from '../geometry/plane2d.js';

/* Kéo–thả trên canvas: đổi toạ độ con trỏ sang toạ độ toán học, tìm điểm
   đang bị nắm, và gọi lại onChange. Dùng Pointer Events nên chạy được cả
   chuột lẫn cảm ứng. */

/**
 * @param board       bảng vẽ từ createBoard()
 * @param getPoints   () => [[x, y], …] các điểm kéo được (thứ tự cố định)
 * @param onChange    (index, newPoint) => void
 * @param opt.step    bước bắt lưới khi kéo (0 = không bắt)
 * @param opt.onHover (index|-1) => void
 */
export function enableDrag(board, getPoints, onChange, { step = 0.25, onHover } = {}) {
  const { canvas } = board;
  const state = { active: -1, hover: -1 };

  const toPixel = ev => {
    const r = canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  };

  const pick = ev => hitTest(board.view, toPixel(ev), getPoints(), 16);

  const setHover = i => {
    if (i === state.hover) return;
    state.hover = i;
    if (onHover) onHover(i);
  };

  canvas.addEventListener('pointerdown', ev => {
    const i = pick(ev);
    if (i < 0) return;
    state.active = i;
    setHover(i);
    canvas.setPointerCapture(ev.pointerId);
    canvas.parentElement?.classList.add('dragging');
    ev.preventDefault();
  });

  canvas.addEventListener('pointermove', ev => {
    if (state.active < 0) { setHover(pick(ev)); return; }
    const w = board.view.toWorld(toPixel(ev));
    onChange(state.active, snap(w, step));
    ev.preventDefault();
  });

  const end = ev => {
    if (state.active < 0) return;
    state.active = -1;
    canvas.parentElement?.classList.remove('dragging');
    if (ev.pointerId != null && canvas.hasPointerCapture?.(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => setHover(-1));

  return state;
}

/**
 * Vòng lặp animation ngắn: gọi step(t) với t chạy 0 → 1 trong `ms` mili giây.
 * Trả về hàm huỷ để dừng giữa chừng khi người dùng bấm lại.
 */
export function animate(ms, step, done) {
  let raf = 0, stopped = false;
  const t0 = performance.now();
  const tick = now => {
    if (stopped) return;
    const t = Math.min(1, (now - t0) / ms);
    step(t);
    if (t < 1) raf = requestAnimationFrame(tick);
    else if (done) done();
  };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
