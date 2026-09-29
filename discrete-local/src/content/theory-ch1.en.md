# Propositions & logic

*Following Mathematics for Computer Science (MCS) chapters 1, 3; Rosen §1.1–1.3.*

**After this chapter you can:**
- Build the truth table of a formula.
- Recognise tautologies and contradictions; check whether two formulas are equivalent.
- Write the converse, contrapositive and inverse of an implication.

## Propositions

A **proposition** is a statement that is either true (T) or false (F), never both.

- "2 + 3 = 5" — a true proposition.
- "Every prime is odd" — a false proposition (2 is an even prime).
- "x + 1 = 2" — **not yet** a proposition: its truth depends on x. That is a *predicate* (next chapter).

We name propositions with lowercase p, q, r and combine them with connectives.

## The connectives ¬ ∧ ∨ ⊕

| p | q | ¬p | p ∧ q | p ∨ q | p ⊕ q |
|---|---|---|---|---|---|
| F | F | T | F | F | F |
| F | T | T | F | T | T |
| T | F | F | F | T | T |
| T | T | F | T | T | F |

**p ∨ q** is *inclusive* "or": both true still counts. **p ⊕ q** is *exclusive* "or": true when exactly one is true.

<div data-check="c1q:value"></div>

## Implication p → q

**p → q is false only when p is true and q is false.** A false hypothesis makes the whole statement true:
"If 1 = 2 then I am the Pope" is a **true** proposition.

| p | q | p → q |
|---|---|---|
| F | F | T |
| F | T | T |
| T | F | **F** |
| T | T | T |

<details><summary>Ways to read p → q</summary>

"if p then q", "p implies q", "q if p", "p only if q", "p is sufficient for q", "q is necessary for p".

</details>

**p ↔ q** ("if and only if") is true when p and q have the same value.

## Building a truth table

Each variable has 2 values ⇒ n variables give **2ⁿ rows**. A method that never misses a row:

1. List rows in binary counting order: FFF, FFT, FTF, …
2. Give every **subformula** a helper column, from the innermost brackets out.
3. The last column is the formula you want.

Precedence: ¬ before ∧, ∧ before ∨, then →, and ↔ last. When unsure, add brackets.

<div data-check="c1q:table" data-needs="c1q:value"></div>

## Tautology, contradiction, contingent

Look at the last column of the truth table:

- **All T** ⇒ *tautology* (also called *valid*): e.g. p ∨ ¬p.
- **All F** ⇒ *contradiction*: e.g. p ∧ ¬p.
- **Both T and F** ⇒ *contingent*: satisfiable but not valid.

A formula is **satisfiable** when at least one row is T. Every tautology is satisfiable; the converse fails.

<div data-check="c1q:classify" data-needs="c1q:table"></div>

## Logical equivalence

A ≡ B when the two truth columns **agree on every row** (that is, A ↔ B is a tautology). **One** differing row is enough to show they are not equivalent.

Common equivalences:

```
p → q        ≡  ¬p ∨ q
¬(p ∧ q)     ≡  ¬p ∨ ¬q        (DeMorgan)
¬(p ∨ q)     ≡  ¬p ∧ ¬q        (DeMorgan)
p ∧ (q ∨ r)  ≡  (p ∧ q) ∨ (p ∧ r)
¬(p → q)     ≡  p ∧ ¬q
```

<div data-check="c1q:equiv" data-needs="c1q:table"></div>

## Converse, contrapositive, inverse

From p → q:

| Name | Formula | Equivalent to p → q? |
|---|---|---|
| contrapositive | ¬q → ¬p | **yes** |
| converse | q → p | no |
| inverse | ¬p → ¬q | no |

Proof by contrapositive rests on the first row: proving ¬q → ¬p also proves p → q.

<div data-check="c1q:contra" data-needs="c1q:equiv"></div>

## Common mistakes

- Thinking p → q is **false** when p is false. No: a false hypothesis makes the implication true.
- Mixing up **converse** and **contrapositive**: only the contrapositive is equivalent to the original.
- DeMorgan without switching the operator: ¬(p ∧ q) is ¬p **∨** ¬q, not ¬p ∧ ¬q.
- Missing rows: n variables need all 2ⁿ rows.
- Reading ∨ as exclusive "or". In mathematics "or" is inclusive; exclusive is written ⊕.
