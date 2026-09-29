import { $, el } from './dom.js';
import { t as T } from '../i18n/index.js';
import { splitCards } from '../logic/cards.js';
import { pointsSummary, pointKeys, cardPassed } from '../logic/knowledge.js';
import { nextPoint } from '../logic/prereq.js';
import { loadEvents, load, save } from './store.js';
import { chNo, tag, studied } from './choices.js';
import { seekLesson, lessonGraph } from './lesson.js';

/* ---------------------------------------------------------------
   HỌC = MỤC LỤC DẠNG CÂY, THU GỌN (D29) — như cây note của Obsidian:
     chương (bấm để mở) → các thẻ, mỗi thẻ một dòng: ✓ đã nắm · ● đã xem · ○ chưa
   Mặc định chỉ mở chương đang học (D43); chương đang mở được nhớ theo môn.
   Ví dụ giải sẵn + công cụ bấm thử nằm ở mục Công cụ (không nhắc lại ở đây — D30).
   Nhãn "học tiếp" = điểm kiến thức đầu tiên theo thứ tự tiên quyết (sắp xếp tô-pô
   đồ thị data-needs) mà chưa nắm và mọi điểm cần đã nắm — shared/logic/prereq.js.
   --------------------------------------------------------------- */

export function renderLearn(r, cfg) {
  const events = loadEvents();
  const now = studied(cfg, events)[0];                   // chương đang học = chương làm gần nhất
  const g = lessonGraph(cfg);
  const next = nextPoint(g, events);
  const nextAt = next && g.get(next);                    // { ch, card } của thẻ nên học tiếp
  const open = new Set(load('learn-open', null) ?? [nextAt?.ch ?? now ?? cfg.chapters[0].id]);

  const rows = cfg.chapters.map(c => {
    const md = cfg.lesson?.(c.id);
    const cards = md ? splitCards(md).cards : [];
    const pts = pointsSummary(events, cards);
    const at = Math.min(load('lesson-' + c.id, 0), Math.max(0, cards.length - 1));

    const items = cards.map((card, k) => {
      const passed = cardPassed(events, card.body);
      const state = passed ? 'passed' : k <= at && load('lesson-' + c.id, null) != null ? 'seen' : '';
      const isNext = nextAt && nextAt.ch === c.id && nextAt.card === k;
      return el('li', { class: state }, el('a', {
        href: `#/learn/${c.id}/theory`, onClick: () => seekLesson(c.id, k),
        title: pointKeys(card.body).length ? T('learn.hasPoint') : undefined,
      }, [el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: card.title }), isNext && tag(T('learn.next'), 'now')]));
    });

    const box = el('details', { class: 'ch-tree', 'data-ch': c.id }, [
      el('summary', {}, [
        el('span', { class: 'ch-no', text: chNo(c.id) }),
        el('span', { class: 'ch-main' }, [
          el('b', {}, [T('nav.' + c.id), c.id === now && tag(T('learn.current'), 'now')]),
          el('small', { text: T('learn.cardsShort', { n: cards.length })
            + (pts.total ? ` · ${T('learn.points', { p: pts.passed, n: pts.total })}` : '') }),
        ]),
        el('span', { class: 'ch-bar', title: pts.total ? `${pts.passed}/${pts.total}` : '' },
          el('i', { style: `width:${pts.total ? Math.round((pts.passed / pts.total) * 100) : 0}%` })),
      ]),
      el('ol', { class: 'tree-cards' }, items),
    ]);
    box.open = open.has(c.id);
    box.addEventListener('toggle', () => {
      if (box.open) open.add(c.id); else open.delete(c.id);
      save('learn-open', [...open]);
    });
    return box;
  });

  const lead = nextAt && el('a', {
    class: 'btn primary tree-next', href: `#/learn/${nextAt.ch}/theory`, 'data-icon': 'next',
    onClick: () => seekLesson(nextAt.ch, nextAt.card),
  }, el('span', { text: T('learn.nextCard', { title: nextAt.title }) }));

  $('#screen-learn').replaceChildren(
    el('h1', { text: T('nav.learn') }),
    el('p', { class: 'subtitle', text: T('learn.sub') }),
    lead || '',
    el('div', { class: 'tree' }, rows),
  );
  return T('nav.learn');
}
