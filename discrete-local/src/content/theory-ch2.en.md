# Quantifiers & proofs

*Following MCS chapters 1–3 (§3.6); Rosen §1.4–1.8.*

**After this chapter you can:**
- Read and evaluate statements with ∀, ∃, including nested quantifiers.
- Negate quantified statements.
- Pick a suitable proof method and spot common mistakes.

## Predicates and quantifiers

A **predicate** P(x) is a statement with a variable; it becomes a proposition once x has a value. E.g. P(x): "x > 3".

- **∀x P(x)**: P holds for **every** x in the domain.
- **∃x P(x)**: P holds for **at least one** x.

The **domain** matters: ∃x (x² = 2) is true over the reals, false over the integers.

To show a ∀ is false, one **counterexample** is enough. To show a ∃ is true, exhibit one **witness**.

<div data-check="c2q:truth"></div>

## Nested quantifiers: order is meaning

- **∀x ∃y (x + y = 0)**: for each x there is a y (y = −x, depending on x) — true over the integers.
- **∃y ∀x (x + y = 0)**: **one** y that works for every x — false.

Read left to right; a later variable may depend on the earlier ones.

<details><summary>Checking on a small domain</summary>

Make a table: one row per value of the outer variable. An outer ∀ needs every row ✓; an outer ∃ needs one row ✓. Inside each row, an inner ∃ needs a witness, an inner ∀ needs no counterexample.

</details>

## Negating quantifiers

```
¬∀x P(x)  ≡  ∃x ¬P(x)
¬∃x P(x)  ≡  ∀x ¬P(x)
¬(A → B)  ≡  A ∧ ¬B
```

Work **outside in**: flip each quantifier, then negate the body.

E.g. ¬∀x (P(x) → Q(x)) ≡ ∃x (P(x) ∧ ¬Q(x)): "not every P is a Q" means "some P is not a Q".

<div data-check="c2q:negate" data-needs="c2q:truth c1q:equiv"></div>

## Proof methods

To prove **p → q**:

- **Direct:** assume p, derive q.
- **Contrapositive:** assume ¬q, derive ¬p.
- **Contradiction:** assume p and ¬q, reach a contradiction.
- **Cases:** split p into cases that cover everything, prove each one.

To prove **p ↔ q**: prove both p → q and q → p.

<details><summary>Example: √2 is irrational (contradiction)</summary>

Suppose √2 = a/b in lowest terms. Then a² = 2b², so a is even, a = 2c; hence b² = 2c², so b is even too — contradicting "lowest terms".

</details>

## The well ordering principle

**Every nonempty set of natural numbers has a smallest element.**

Use it to prove "every n has property P": suppose the set of counterexamples is nonempty, take the **smallest** counterexample m, then find a counterexample smaller than m — a contradiction.

This is induction written as a proof by contradiction (chapter D4).

## Common mistakes

- Swapping ∀∃ and thinking the meaning stays the same.
- Negating ∀x (P → Q) as ∃x (P → ¬Q) — it must be ∃x (P ∧ ¬Q).
- "Proving" a ∀ with a few true examples. Examples can only **refute** a ∀.
- Proving q → p (the converse) instead of p → q.
- A proof by contradiction that never names a concrete contradiction.
