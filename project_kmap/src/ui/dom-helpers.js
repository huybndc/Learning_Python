/* Tiện ích DOM dùng chung cho mọi trang. */

export const $ = sel => document.querySelector(sel);

export const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

export const GAP = 4;                            // khoảng cách giữa các ô K-map (px), phải khớp CSS
export const HUES = [212, 145, 28, 320, 265, 6, 178, 50, 240, 100, 195, 330];
