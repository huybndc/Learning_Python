/* ---------------------------------------------------------------
   LƯỢNG TỪ TRÊN MIỀN HỮU HẠN (MCS 3.6; Rosen 1.4–1.5) — thuần.
   Cây: { t: 'all'|'ex', v, body } | { t: 'atom', p, args: ['x','y'] } | { t: 'not'|'and'|'or'|'imp', a, b }
   Diễn giải (interp): { domain: [..], preds: { P: (x, y) => bool } } — tính đúng/sai bằng vét cạn,
   nên mọi đáp án (đúng/sai, phủ định) đều KIỂM được trên máy, không dựa vào nhãn soạn tay.
   --------------------------------------------------------------- */

export const all = (v, body) => ({ t: 'all', v, body });
export const ex = (v, body) => ({ t: 'ex', v, body });
export const atom = (p, ...args) => ({ t: 'atom', p, args });
export const not = a => ({ t: 'not', a });
export const and = (a, b) => ({ t: 'and', a, b });
export const or = (a, b) => ({ t: 'or', a, b });
export const imp = (a, b) => ({ t: 'imp', a, b });

export function evalQ(f, interp, env = {}) {
  switch (f.t) {
    case 'all': return interp.domain.every(d => evalQ(f.body, interp, { ...env, [f.v]: d }));
    case 'ex': return interp.domain.some(d => evalQ(f.body, interp, { ...env, [f.v]: d }));
    case 'atom': return !!interp.preds[f.p](...f.args.map(a => env[a]));
    case 'not': return !evalQ(f.a, interp, env);
    case 'and': return evalQ(f.a, interp, env) && evalQ(f.b, interp, env);
    case 'or': return evalQ(f.a, interp, env) || evalQ(f.b, interp, env);
    case 'imp': return !evalQ(f.a, interp, env) || evalQ(f.b, interp, env);
    default: throw new Error('quant: ' + f.t);
  }
}

/** Phủ định đẩy vào trong: ¬∀ = ∃¬, ¬∃ = ∀¬, DeMorgan, ¬(A → B) = A ∧ ¬B, ¬¬A = A. */
export function negate(f) {
  switch (f.t) {
    case 'all': return ex(f.v, negate(f.body));
    case 'ex': return all(f.v, negate(f.body));
    case 'not': return f.a;
    case 'and': return or(negate(f.a), negate(f.b));
    case 'or': return and(negate(f.a), negate(f.b));
    case 'imp': return and(f.a, negate(f.b));
    default: return not(f);
  }
}

const SYM = { imp: '→', or: '∨', and: '∧' };
const isQ = f => f.t === 'all' || f.t === 'ex';

/** In như sách: ∀x ∃y (P(x, y) → ¬Q(y)). Ngoặc khi hai phép nhị phân khác nhau lồng nhau, hoặc lượng từ nằm trong một vế. */
export function formatQ(f) {
  switch (f.t) {
    case 'all': case 'ex': {
      const q = `${f.t === 'all' ? '∀' : '∃'}${f.v}`;
      return f.body.t in SYM ? `${q} (${formatQ(f.body)})` : `${q} ${formatQ(f.body)}`;
    }
    case 'atom': return `${f.p}(${f.args.join(', ')})`;
    case 'not': return '¬' + (f.a.t === 'atom' || f.a.t === 'not' ? formatQ(f.a) : `(${formatQ(f.a)})`);
    default: {
      const w = (c, left) => ((c.t in SYM && (c.t !== f.t || (f.t === 'imp' && left))) || (isQ(c) && left) ? `(${formatQ(c)})` : formatQ(c));
      return `${w(f.a, true)} ${SYM[f.t]} ${w(f.b, false)}`;
    }
  }
}

/**
 * Tương đương "trên máy": so giá trị qua nhiều diễn giải ngẫu nhiên trên miền nhỏ.
 * Hai công thức khác nhau về nghĩa gần như chắc chắn lộ ra ở một diễn giải nào đó.
 */
export function sameOnSamples(f, g, rnd, preds = { P: 1, Q: 1 }, tries = 200) {
  for (let i = 0; i < tries; i++) {
    const domain = [0, 1, 2].slice(0, 2 + Math.floor(rnd() * 2));
    const tables = Object.fromEntries(Object.entries(preds).map(([p]) => [p, new Map()]));
    const interp = {
      domain,
      preds: Object.fromEntries(Object.keys(preds).map(p => [p, (...xs) => {
        const k = xs.join(',');
        if (!tables[p].has(k)) tables[p].set(k, rnd() < 0.5);
        return tables[p].get(k);
      }])),
    };
    if (evalQ(f, interp) !== evalQ(g, interp)) return false;
  }
  return true;
}
