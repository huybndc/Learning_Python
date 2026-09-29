import { $, el } from './dom.js';
import { t as T, getLang } from '../i18n/index.js';
import { EXAM_MINUTES, planExam, gradeItem, tally, secondsLeft, clock, isBlank } from '../logic/exam.js';
import { seededRandom } from '../logic/shuffle.js';
import { load, save, drop, loadEvents, subjectOf } from './store.js';
import { questionCode } from '../logic/question-pool.js';
import { go } from './router.js';
import { chNo, chapterTitle, accCell, row, leadCard, practiceTabs, studied } from './choices.js';
import { questionView } from './question.js';
import { reviewOf } from './lesson.js';
import { loadExam, itemsOf, examChapters, verdict, escapeHtml, renderExamRun } from './exam-run.js';

/* ---------------------------------------------------------------
   BÀI FULL 60–90 PHÚT (RESEARCH U-R4, D17):
     #/exam         chọn đề: chương (mặc định phạm vi giữa kỳ) · 60/75/90 phút ·
                    Thi thử (tính giờ, chấm khi nộp) hoặc Bài tập dài (chấm từng câu)
     #/exam/run     phòng thi (exam-run.js)
     #/exam/result  điểm, theo chương, dạng còn sai, xem lại câu sai
   Ít lựa chọn (D19): 3 hàng, một nút Bắt đầu; bài đang dở thì chỉ hiện "Làm tiếp".
   --------------------------------------------------------------- */

const banked = cfg => cfg.chapters.filter(c => c.bank);
const listOf = ids => ids.map(chNo).join(', ');

/** Phạm vi mặc định: các chương Huy đã học (có câu tự sinh); chưa học chương nào thì mọi chương (D43). */
function studiedScope(cfg) {
  const taught = studied(cfg, loadEvents());
  const ids = banked(cfg).map(c => c.id).filter(id => taught.includes(id));
  return ids.length ? ids : banked(cfg).map(c => c.id);
}

/* ---------------- chọn đề ---------------- */
let seed = 0;          // hạt giống của đề sắp tạo — số câu hiện trên màn khớp đúng đề sẽ làm

function renderSetup(cfg) {
  const head = [el('h1', { text: T('nav.practice') }), practiceTabs('exam')];
  const host = $('#screen-exam');
  if (!banked(cfg).length) {
    host.replaceChildren(...head, leadCard({ title: T('exam.none'), note: T('exam.noneNote'), href: '#/practice', cta: T('nav.practice') }));
    return T('nav.exam');
  }

  const cur = loadExam();
  if (cur && !cur.submittedAt) {             // bài đang dở: một việc duy nhất là làm tiếp
    const n = itemsOf(cfg, cur).length;
    const done = cur.given.filter(g => !isBlank(g)).length;
    const note = [T(cur.mode === 'exam' ? 'exam.modeExam' : 'exam.modeLong'), T('exam.minutes', { m: cur.minutes }),
      T('exam.done', { a: done, n }), cur.mode === 'exam' && T('exam.left', { t: clock(secondsLeft(cur, Date.now())) })].filter(Boolean).join(' · ');
    host.replaceChildren(...head, leadCard({
      title: T('exam.inProgress'), note, href: '#/exam/run', cta: T('exam.resume'),
      alt: el('span', { class: 'alt' }, el('a', { href: '#/exam', onClick: e => { e.preventDefault(); drop('exam'); renderSetup(cfg); }, text: T('exam.discard') })),
    }), ...pastList());
    return T('nav.exam');
  }

  const pref = load('exam-pref', {});
  const S = {
    chapters: (pref.chapters ?? studiedScope(cfg)).filter(id => banked(cfg).some(c => c.id === id)),
    minutes: EXAM_MINUTES.includes(pref.minutes) ? pref.minutes : 90,
    mode: pref.mode === 'long' ? 'long' : 'exam',
  };
  if (!S.chapters.length) S.chapters = midScope(cfg);
  seed ||= Math.floor(Math.random() * 2 ** 31);

  const form = el('div', { class: 'exam-setup' });
  const draw = () => {
    const chs = examChapters(cfg, S.chapters);
    const count = chs.length ? planExam(chs, S.minutes, seededRandom(seed)).length : 0;
    const seg = (items, on, act, label) => el('div', { class: 'chapter-bar', role: 'group' },
      items.map(x => el('button', { type: 'button', 'aria-pressed': String(on(x)), onClick: () => { act(x); draw(); } }, label(x))));
    const field = (label, control, note) => el('div', { class: 'exam-field' }, [el('span', { class: 'exam-label', text: label }), el('div', {}, [control, note && el('small', { text: note })])]);

    form.replaceChildren(
      field(T('exam.chapters'), el('div', { class: 'exam-chips', role: 'group' }, banked(cfg).map(c => el('button', {
        type: 'button', class: 'exam-chip', 'aria-pressed': String(S.chapters.includes(c.id)),
        onClick: () => { S.chapters = S.chapters.includes(c.id) ? S.chapters.filter(x => x !== c.id) : [...S.chapters, c.id].sort(); draw(); },
      }, [el('b', { text: chNo(c.id) }), T('nav.' + c.id)]))), T('exam.scopeNote')),
      field(T('exam.length'), seg(EXAM_MINUTES, m => m === S.minutes, m => { S.minutes = m; }, m => T('exam.minutes', { m }))),
      field(T('exam.how'), el('div', { class: 'exam-modes' }, ['exam', 'long'].map(m => el('button', {
        type: 'button', class: 'exam-mode', 'aria-pressed': String(S.mode === m), onClick: () => { S.mode = m; draw(); },
      }, [el('b', { text: T(m === 'exam' ? 'exam.modeExam' : 'exam.modeLong') }), el('small', { text: T(m === 'exam' ? 'exam.modeExamNote' : 'exam.modeLongNote') })])))),
      el('div', { class: 'exam-go' }, [
        el('span', { text: chs.length ? T('exam.summary', { n: count, list: listOf(S.chapters), m: S.minutes }) : T('exam.pickOne') }),
        el('button', { type: 'button', class: 'btn primary', 'data-icon': 'next', disabled: !chs.length, onClick: () => start(S) }, el('span', { text: T('exam.start') })),
      ]),
    );
  };
  draw();
  host.replaceChildren(...head, form, ...pastList());
  return T('nav.exam');
}

function start({ chapters, minutes, mode }) {
  save('exam-pref', { chapters, minutes, mode });
  save('exam', { seed, minutes, order: 'mixed', mode, chapters, startedAt: Date.now(), at: 0, given: [], flags: [], checked: [], hideClock: false, submittedAt: null });
  seed = 0;
  go({ view: 'exam', step: 'run' });
}

/** Năm lần gần nhất: ngày · cách làm · điểm. Lần mới nhất mở lại được màn kết quả. */
function pastList() {
  const hist = load('exam-history', []).slice(0, 5);
  if (!hist.length) return [];
  const date = ts => new Date(ts).toLocaleString(getLang() === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const last = loadExam()?.submittedAt;
  return [el('h2', { class: 'section-label', text: T('exam.history') }), el('div', { class: 'list' }, hist.map(h => row({
    href: h.ts === last ? '#/exam/result' : '#/exam',
    title: `${T(h.mode === 'exam' ? 'exam.modeExam' : 'exam.modeLong')} · ${T('exam.minutes', { m: h.minutes })}`,
    sub: `${date(h.ts)} · ${T('exam.chapters')} ${listOf(h.chapters)}`,
    num: `${h.right}/${h.n}`,
    acc: accCell({ accuracy: h.n ? h.right / h.n : null, attempts: h.n, scope: 'all' }),
  })))];
}

/* ---------------- kết quả ---------------- */
function renderResult(cfg) {
  const st = loadExam();
  if (!st?.submittedAt) { go({ view: 'exam' }); return T('nav.exam'); }
  const items = itemsOf(cfg, st);
  const res = items.map((it, i) => gradeItem(it, st.given[i]));
  const right = res.filter(r => r.ok).length;
  const blank = res.filter(r => r.blank).length;
  const pct = Math.round((right / items.length) * 100);
  const kindKey = it => `${it.prefix}.${it.q.kind}`;
  const weak = tally(items, res, kindKey).filter(k => k.ok < k.n).sort((a, b) => a.ok / a.n - b.ok / b.n);
  const acc = v => accCell({ accuracy: v.ok / v.n, attempts: v.n, scope: 'all' });

  const facts = [st.mode === 'exam' && (st.timeout ? T('exam.timeout') : T('exam.used', { m: Math.max(1, Math.round((st.submittedAt - st.startedAt) / 60000)) })),
    blank && T('exam.blank', { n: blank })].filter(Boolean).join(' · ');

  const review = items.map((it, i) => ({ it, i, r: res[i] })).filter(x => !x.r.ok).map(({ it, i, r }) => {
    const d = el('details', { class: 'review' }, el('summary', {}, [
      el('b', { class: 'mono', text: String(i + 1) }),
      el('span', { text: `${T(kindKey(it))} · ${T('shell.chapter', { n: chNo(it.ch) })}` }),
      el('span', { class: r.blank ? 'tag now' : 'tag bad', text: T(r.blank ? 'exam.blankOne' : 'exam.wrongOne') }),
      el('span', { class: 'run-code', title: T('run.code'), text: questionCode(subjectOf(), it.prefix, it.q) ?? '' }),   // hub D33
    ]));
    // vẽ khi mở ra: widget khoá, tô ô đúng/sai ngay trên hình như lúc làm
    d.addEventListener('toggle', () => {
      if (d.childElementCount > 1) return;
      const qv = questionView(it.q, { figures: cfg.figures, widgets: cfg.widgets, given: st.given[i] ?? '', locked: true });
      const typed = !r.blank && it.q.format !== 'choice' && !it.q.input;
      d.append(el('div', { class: 'review-body' }, [...qv.nodes, typed && el('p', { class: 'small muted', html: T('exam.yours', { given: escapeHtml(st.given[i]) }) }), verdict(it, st.given[i])]));
    });
    return d;
  });

  $('#screen-exam').replaceChildren(...[
    el('a', { class: 'back', href: '#/exam', 'data-icon': 'prev', text: T('nav.exam') }),
    el('p', { class: 'crumb', text: `${T(st.mode === 'exam' ? 'exam.modeExam' : 'exam.modeLong')} · ${T('exam.minutes', { m: st.minutes })} · ${T('exam.chapters')} ${listOf(st.chapters)}` }),
    el('h1', { text: T('exam.result') }),
    el('div', { class: 'exam-score' }, [
      el('b', {}, [String(right), el('span', { text: `/${items.length}` })]),
      el('div', {}, [el('strong', { text: `${pct}%` }), facts && el('small', { text: facts })]),
      el('div', { class: 'spacer' }),
      weak[0] && el('a', { class: 'btn', href: `#/practice/${weak[0].item.ch}/${weak[0].item.q.kind}` }, T('exam.drill')),
      el('a', { class: 'btn primary', href: '#/exam' }, T('exam.again')),
    ]),
    el('h2', { class: 'section-label', text: T('exam.byChapter') }),
    el('div', { class: 'list' }, tally(items, res, it => it.ch).map(v => row({
      href: `#/practice/${v.key}`, title: chapterTitle(v.key), num: `${v.ok}/${v.n}`, acc: acc(v),
    }))),
    el('h2', { class: 'section-label', text: T('exam.weakKinds') }),
    // dạng còn sai → mở đúng thẻ bài học để ôn (thẻ có câu thử của dạng đó); luyện riêng thì dùng nút phía trên
    weak.length ? el('div', { class: 'list' }, weak.map(v => {
      const rv = reviewOf(cfg, v.item.prefix, v.item.q.kind, v.item.q.review);
      // có gốc tiên quyết đang yếu ⇒ dòng mở thẳng thẻ gốc (ôn gốc trước rồi mới tới dạng này)
      const go = rv?.root ?? rv;
      const a = row({
        href: go?.href ?? `#/practice/${v.item.ch}/${v.item.q.kind}`, title: T(v.key),
        sub: rv?.root ? T('run.rootFirst', { root: rv.root.title, title: rv.title })
          : rv ? T('run.review', { title: rv.title }) : chapterTitle(v.item.ch),
        num: `${v.ok}/${v.n}`, acc: acc(v),
      });
      if (go) a.addEventListener('click', go.open);
      return a;
    })) : el('p', { class: 'muted', text: T('exam.noWeak') }),
    review.length ? [el('h2', { class: 'section-label', text: T('exam.review') }), el('div', { class: 'reviews' }, review)] : [],
  ].flat());
  return T('exam.result');
}

export function renderExam(r, cfg) {
  if (r.step === 'run') return renderExamRun(cfg);
  if (r.step === 'result') return renderResult(cfg);
  return renderSetup(cfg);
}
