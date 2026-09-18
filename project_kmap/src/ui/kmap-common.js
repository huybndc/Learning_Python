import { el, GAP } from './dom-helpers.js';
import { mapLayout, cellMinterm, implicantRects } from '../logic/kmap-layout.js';

/* =====================================================================
   BỘ VẼ K-MAP DÙNG CHUNG (cho cả tab K-map và tab Luyện tập)
   ===================================================================== */

/**
 * Dựng DOM cho K-map n biến vào `host`.
 * Trả về { L, cells:Map(minterm->el), overlays:[el theo sheet] }.
 */
export function buildMap(host, n, onCell, onHoverCell) {
  const L = mapLayout(n);
  const R = L.rowCodes.length, C = L.colCodes.length;
  host.innerHTML = '';
  const cells = new Map(), overlays = [];

  L.sheetCodes.forEach((sc, s) => {
    const box = el('div', 'mapbox');
    if (L.sheetVars.length) box.appendChild(el('h4', null, L.sheetVars[0] + ' = ' + sc));

    const tbl = el('div', 'ktable');
    tbl.appendChild(el('div', 'kcorner', L.rowVars.join('') + ' \\ ' + L.colVars.join('')));

    const colBar = el('div', 'kcols');
    colBar.style.gridTemplateColumns = 'repeat(' + C + ',minmax(0,1fr))';
    L.colCodes.forEach(cc => colBar.appendChild(el('div', 'klab', cc)));
    tbl.appendChild(colBar);

    const rowBar = el('div', 'krows');
    rowBar.style.gridTemplateRows = 'repeat(' + R + ',minmax(0,1fr))';
    L.rowCodes.forEach(rc => rowBar.appendChild(el('div', 'klab', rc)));
    tbl.appendChild(rowBar);

    const area = el('div', 'karea');
    const grid = el('div', 'kcells');
    grid.style.gridTemplateColumns = 'repeat(' + C + ',minmax(0,1fr))';
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const m = cellMinterm(L, s, r, c);
      const cell = el('div', 'kcell');
      cell.dataset.m = m; cell.dataset.s = s; cell.dataset.r = r; cell.dataset.c = c;
      cell.appendChild(el('span', 'v', '0'));
      if (onCell) cell.addEventListener('click', ev => onCell(m, ev, cell));
      if (onHoverCell) {
        cell.addEventListener('mouseenter', () => onHoverCell(m));
        cell.addEventListener('mouseleave', () => onHoverCell(null));
      }
      cells.set(m, cell);
      grid.appendChild(cell);
    }
    area.appendChild(grid);
    const ov = el('div', 'overlay');
    area.appendChild(ov);
    overlays.push(ov);
    // lớp chỉ số minterm vẽ SAU overlay để không bị viền nhóm che mất
    const idx = el('div', 'kidx');
    idx.style.gridTemplateColumns = 'repeat(' + C + ',minmax(0,1fr))';
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++)
      idx.appendChild(el('span', 'mi', String(cellMinterm(L, s, r, c))));
    area.appendChild(idx);
    tbl.appendChild(area);
    box.appendChild(tbl);
    host.appendChild(box);
  });
  return { L, cells, overlays, R, C };
}

/** Cập nhật giá trị hiển thị của từng ô. */
export function paintValues(view, values) {
  view.cells.forEach((cell, m) => {
    const v = values[m];
    cell.dataset.v = v;
    cell.querySelector('.v').textContent = v === 2 ? 'X' : String(v);
  });
}

/** Toạ độ CSS của một mảnh hình chữ nhật trong vùng ô (đơn vị % + px, khớp gap). */
export function rectStyle(rect, R, C, pad) {
  const gc = (C - 1) * GAP, gr = (R - 1) * GAP;
  const left = 'calc((100% - ' + gc + 'px) / ' + C + ' * ' + rect.c + ' + ' + (GAP * rect.c + pad) + 'px)';
  const width = 'calc((100% - ' + gc + 'px) / ' + C + ' * ' + rect.w + ' + ' + (GAP * (rect.w - 1) - 2 * pad) + 'px)';
  const top = 'calc((100% - ' + gr + 'px) / ' + R + ' * ' + rect.r + ' + ' + (GAP * rect.r + pad) + 'px)';
  const height = 'calc((100% - ' + gr + 'px) / ' + R + ' * ' + rect.h + ' + ' + (GAP * (rect.h - 1) - 2 * pad) + 'px)';
  return { left, width, top, height };
}

/**
 * Vẽ danh sách nhóm lên overlay.
 * group = {id, imp, essential, hue, hidden}
 */
export function drawGroups(view, groups, n) {
  view.overlays.forEach(o => o.innerHTML = '');
  groups.forEach((g, gi) => {
    const pad = 3 + (gi % 4) * 3;                       // lệch nhau để nhóm chồng nhau vẫn thấy được
    implicantRects(g.imp, n).forEach(rect => {
      const d = el('div', 'grp' + (g.essential ? ' ess' : '') + (g.hidden ? ' posgrp' : ''));
      d.style.setProperty('--gh', g.hue);
      d.dataset.gid = g.id;
      const st = rectStyle(rect, view.R, view.C, pad);
      Object.assign(d.style, st);
      view.overlays[rect.s].appendChild(d);
    });
  });
}

/** Bật/tắt highlight cho một tập id nhóm. */
export function setHot(root, ids) {
  const on = ids && ids.size;
  root.querySelectorAll('.grp').forEach(g => {
    const hit = on && ids.has(g.dataset.gid);
    g.classList.toggle('hot', !!hit);
    g.classList.toggle('dim', !!on && !hit);
  });
  document.querySelectorAll('.term').forEach(t => t.classList.toggle('hot', !!(on && ids.has(t.dataset.gid))));
}
