import { $, HUES } from './dom-helpers.js';
import { K } from './kmap-state.js';
import { drawGroups } from './kmap-common.js';
import {
  minimizeSOP, splitValues, impCovers, implicantMinterms, implicantToSOP,
} from '../logic/quine-mccluskey.js';
import { explainTerm } from '../logic/explain.js';

/* ------------- Chế độ giải thích từng bước ------------- */
export function buildSteps(values, n, sopGroups) {
  const S = minimizeSOP(values, n);
  const { ones, dcs } = splitValues(values);
  const steps = [];
  const allPIGroups = S.pis.map((p, i) => ({ id: 'q' + i, imp: p, essential: false, hue: HUES[i % HUES.length] }));

  steps.push({
    title: 'Bước 0 — Đọc đề',
    groups: [],
    html: ones.length === 0
      ? 'Không có ô nào bằng 1 ⇒ F = 0. Không cần rút gọn.'
      : 'Các minterm (ô = 1): <span class="mono">' + ones.join(', ') + '</span>.<br>' +
      (dcs.length ? 'Don\'t care: <span class="mono">' + dcs.join(', ') + '</span> — được phép dùng để <b>mở rộng</b> nhóm, nhưng <b>không bắt buộc</b> phải phủ.'
        : 'Không có don\'t care.')
  });

  if (ones.length === 0) return steps;

  steps.push({
    title: 'Bước 1 — Tìm tất cả prime implicant (Quine–McCluskey)',
    groups: allPIGroups,
    html: 'Ghép các ô khác nhau đúng 1 bit, lặp lại cho tới khi không ghép được nữa. Nhóm nào không ghép thêm được nữa là <b>prime implicant</b> (nhóm lớn nhất có thể).<br>' +
      '<ul style="margin:.4em 0 0;padding-left:1.2em">' +
      S.pis.map(p => '<li class="mono">' + implicantToSOP(p, n) + '</li>').join('') + '</ul>'
  });

  // essential
  const essList = S.essential;
  const essWhy = [];
  for (const m of ones) {
    const cov = S.pis.map((p, i) => i).filter(i => impCovers(S.pis[i], m));
    if (cov.length === 1) essWhy.push('ô <span class="mono">' + m + '</span> chỉ nằm trong <span class="mono">' + implicantToSOP(S.pis[cov[0]], n) + '</span>');
  }
  const essGroups = essList.map((pi, i) => ({ id: 'e' + i, imp: S.pis[pi], essential: true, hue: HUES[i % HUES.length] }));
  steps.push({
    title: 'Bước 2 — Essential prime implicant',
    groups: essGroups,
    html: essWhy.length
      ? 'Ô nào chỉ được <b>đúng một</b> prime implicant phủ thì PI đó <b>bắt buộc</b> phải có mặt: <br>' + essWhy.join('<br>') +
      '<br><br>⇒ Essential: <span class="mono">' + (essList.length ? essList.map(i => implicantToSOP(S.pis[i], n)).join(', ') : '(không có)') + '</span>'
      : 'Không ô nào bị phủ bởi duy nhất một PI ⇒ <b>không có</b> essential prime implicant. Phải chọn thuần tuý theo tiêu chí tối ưu.'
  });

  // các PI chọn thêm
  const extras = S.cover.filter(i => !essList.includes(i));
  let acc = essGroups.slice();
  const coveredByEss = new Set();
  essList.forEach(i => implicantMinterms(S.pis[i], n).forEach(m => coveredByEss.add(m)));
  let remaining = ones.filter(m => !coveredByEss.has(m));

  if (extras.length === 0) {
    steps.push({
      title: 'Bước 3 — Phủ phần còn lại',
      groups: acc,
      html: remaining.length === 0
        ? 'Các essential prime implicant đã phủ hết mọi ô 1 ⇒ không cần chọn thêm nhóm nào.'
        : 'Còn lại: <span class="mono">' + remaining.join(', ') + '</span>.'
    });
  } else {
    extras.forEach((pi, k) => {
      const g = { id: 'x' + k, imp: S.pis[pi], essential: false, hue: HUES[(essGroups.length + k) % HUES.length] };
      acc = acc.concat(g);
      const before = remaining.slice();
      remaining = remaining.filter(m => !impCovers(S.pis[pi], m));
      steps.push({
        title: 'Bước ' + (3 + k) + ' — Phủ phần còn lại',
        groups: acc.slice(),
        html: 'Còn chưa phủ: <span class="mono">' + before.join(', ') + '</span>.<br>' +
          'Chọn <span class="mono">' + implicantToSOP(S.pis[pi], n) + '</span> (nhóm rẻ nhất phủ được phần này).<br>' +
          (remaining.length ? 'Sau bước này còn: <span class="mono">' + remaining.join(', ') + '</span>.' : '✔ Đã phủ hết mọi ô 1.')
      });
    });
  }

  steps.push({
    title: 'Kết quả — vì sao mỗi nhóm cho ra term đó',
    groups: sopGroups,
    html: '<b class="mono">F = ' + S.expr + '</b><br><br>' +
      S.terms.map(t => '· ' + explainTerm(t.imp, n, false)).join('<br>') +
      '<br><br><span class="muted">Quy tắc: trong một nhóm, biến nào <b>giữ nguyên</b> giá trị ở mọi ô thì được giữ lại (giá trị 1 → viết thường, 0 → viết phủ định); biến nào <b>đổi</b> giá trị thì bị triệt tiêu.</span>'
  });
  return steps;
}

export function renderStep() {
  const box = $('#st-box');
  if (K.stepIdx < 0) {
    box.innerHTML = '<span class="muted">Bấm <b>Next</b> để xem quá trình rút gọn từng bước. Khi ở chế độ này, K-map phía trên sẽ vẽ đúng các nhóm của bước hiện tại.</span>';
    $('#st-count').textContent = '';
  } else {
    const st = K.steps[K.stepIdx];
    box.innerHTML = '<h4>' + st.title + '</h4><div>' + st.html + '</div>';
    $('#st-count').textContent = 'bước ' + (K.stepIdx + 1) + '/' + K.steps.length;
  }
  $('#st-prev').disabled = K.stepIdx < 0;
  $('#st-next').disabled = K.steps && K.stepIdx >= K.steps.length - 1;
}

export function stepGo(delta) {
  if (!K.steps || !K.steps.length) return;
  K.stepIdx = Math.max(-1, Math.min(K.steps.length - 1, K.stepIdx + delta));
  drawGroups(K.view, K.stepIdx >= 0 ? K.steps[K.stepIdx].groups : K.groups, K.n);
  renderStep();
}

