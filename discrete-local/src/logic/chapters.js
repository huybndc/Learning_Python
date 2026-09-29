import * as ch1 from './ch1-quiz.js';
import * as ch2 from './ch2-quiz.js';
import * as ch3 from './ch3-quiz.js';
import * as ch4 from './ch4-quiz.js';
import * as ch5 from './ch5-quiz.js';
import * as ch6 from './ch6-quiz.js';
import * as ch7 from './ch7-quiz.js';
import * as ch8 from './ch8-quiz.js';
import { withConcepts } from '@shared/logic/concepts.js';
import concepts from '../content/concepts.json';

/* ---------------------------------------------------------------
   BẢNG CHƯƠNG → NGÂN HÀNG CÂU (thuần). main.js, test và script tái hiện câu (scripts/show-question.js) dùng chung
   một bảng ⇒ mã câu luôn sinh lại đúng câu người học đã thấy (hub D33). Câu khái niệm (D36) thêm một dạng mỗi chương.
   --------------------------------------------------------------- */

const withCq = (bank, id) => withConcepts(bank, concepts.filter(c => c.chapter === id));
export const CHAPTERS = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8].map((bank, i) => ({
  id: `ch${i + 1}`, prefix: `c${i + 1}q`, bank: withCq(bank, `ch${i + 1}`),
}));
