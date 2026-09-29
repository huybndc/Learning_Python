import { onLangChange, getLang } from './i18n/index.js';
import { setupShell } from '@shared/ui/shell.js';
import { mountLesson } from '@shared/ui/lesson.js';
import { truthFigure } from '@shared/ui/figures.js';
import { setupTools } from './ui/tools.js';
import { setupGraphTool } from './ui/graph-tool.js';
import { graphFigure } from './ui/graph-figure.js';
import { CHAPTERS } from './logic/chapters.js';
import theoryCh1Vi from './content/theory-ch1.vi.md?raw';
import theoryCh1En from './content/theory-ch1.en.md?raw';
import theoryCh2Vi from './content/theory-ch2.vi.md?raw';
import theoryCh2En from './content/theory-ch2.en.md?raw';
import theoryCh3Vi from './content/theory-ch3.vi.md?raw';
import theoryCh3En from './content/theory-ch3.en.md?raw';
import theoryCh4Vi from './content/theory-ch4.vi.md?raw';
import theoryCh4En from './content/theory-ch4.en.md?raw';
import theoryCh5Vi from './content/theory-ch5.vi.md?raw';
import theoryCh5En from './content/theory-ch5.en.md?raw';
import theoryCh6Vi from './content/theory-ch6.vi.md?raw';
import theoryCh6En from './content/theory-ch6.en.md?raw';
import theoryCh7Vi from './content/theory-ch7.vi.md?raw';
import theoryCh7En from './content/theory-ch7.en.md?raw';
import theoryCh8Vi from './content/theory-ch8.vi.md?raw';
import theoryCh8En from './content/theory-ch8.en.md?raw';

/* Chương mang số của syllabus D1…D8 (PLAN.md); D1–D7 là phạm vi giữa kỳ. */
const THEORY = {
  vi: { ch1: theoryCh1Vi, ch2: theoryCh2Vi, ch3: theoryCh3Vi, ch4: theoryCh4Vi, ch5: theoryCh5Vi, ch6: theoryCh6Vi, ch7: theoryCh7Vi, ch8: theoryCh8Vi },
  en: { ch1: theoryCh1En, ch2: theoryCh2En, ch3: theoryCh3En, ch4: theoryCh4En, ch5: theoryCh5En, ch6: theoryCh6En, ch7: theoryCh7En, ch8: theoryCh8En },
};
const banks = Object.fromEntries(CHAPTERS.map(c => [c.prefix, c.bank]));
const FIGURES = { truth: truthFigure, graph: graphFigure };

window.addEventListener('DOMContentLoaded', () => {
  setupShell({ chapters: CHAPTERS, figures: FIGURES, widgets: {}, lesson: ch => THEORY[getLang()][ch] });
  const mountAllTheory = () => {
    const d = THEORY[getLang()];
    Object.keys(d).forEach(ch => mountLesson(document.querySelector(`#theory-${ch}-body`), d[ch], { chapter: ch, banks, figures: FIGURES }));
  };
  mountAllTheory();
  setupTools();
  setupGraphTool();
  onLangChange(mountAllTheory);
  console.log('%cÔn tập Toán rời rạc', 'font-weight:bold');
});
