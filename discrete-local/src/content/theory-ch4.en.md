# Induction

*Following MCS §5.1; Rosen §5.1.*

**After this chapter you can:**
- Write a complete induction proof with both steps in the right shape.
- Say exactly which equation the inductive step must prove.
- Use proven sum formulas; rule out wrong formulas by trying values.

## The induction principle

To prove P(n) for **every n ≥ 0** (or ≥ 1):

1. **Base case:** prove P(0).
2. **Inductive step:** for every k, **assume P(k)** (the induction hypothesis) and prove P(k + 1).

Like dominoes: knock over the first, and each falling domino knocks over the next ⇒ they all fall.

## The proof template

```
Proof by induction on n. Let P(n): "…".
Base case: P(1) holds because …
Inductive step: assume P(k) holds for some k ≥ 1.
   … (use P(k) here) …
   so P(k + 1) holds.
By the induction principle, P(n) holds for all n ≥ 1.
```

Always point out **where the induction hypothesis is used** — it is the heart of the proof.

## Example: 1 + 2 + … + n = n(n + 1)/2

**Base case:** n = 1: left side 1, right side 1·2/2 = 1. ✓

**Inductive step:** assume 1 + … + k = k(k + 1)/2. Add (k + 1) to both sides:

```
1 + … + k + (k + 1) = k(k + 1)/2 + (k + 1)
                    = (k + 1)(k + 2)/2          ← exactly the formula at k + 1 ✓
```

<div data-check="c4q:step" data-needs="c2q:truth"></div>

## Sum formulas you will use

```
1 + 2 + … + n            = n(n + 1)/2
1 + 3 + … + (2n − 1)     = n²
1² + 2² + … + n²         = n(n + 1)(2n + 1)/6
1 + 2 + 4 + … + 2ⁿ⁻¹     = 2ⁿ − 1
```

All four are proved by induction with the template above.

<div data-check="c4q:sum"></div>

## Guess a formula, then prove it

Compute a few values, guess the pattern, **then** prove it by induction.

Trying values **proves** nothing, but it can **refute**: a wrong formula breaks at some n. E.g. n² + n − 1 matches 1 + 3 + … at n = 1 but breaks from n = 2.

<div data-check="c4q:formula" data-needs="c4q:sum"></div>

## Common mistakes

- Skipping the base case — a correct inductive step with a false base case proves nothing.
- Assuming P(k + 1) (what you must prove) instead of P(k).
- Never using the induction hypothesis — usually a sign the proof went astray.
- Adding the k-th term instead of the (k + 1)-th.
- "Proving" by trying n = 1, 2, 3.
