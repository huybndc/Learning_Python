# Chapter 3 — Vector spaces

Chapter 1 asked *what the span of a few vectors looks like*. Chapter 2 gave the
tool to answer it with numbers. This chapter names what we have been seeing:
**subspace**, **column space**, **null space**, **basis**, **dimension** — and
discovers that all of them can be read off one familiar thing: where the pivots
land after elimination.

## What a subspace is

A subset `S` of `R³` is a **subspace** if it is closed under the two operations
from Chapter 1:

1. if `u, v ∈ S` then `u + v ∈ S`
2. if `v ∈ S` and `c` is any number then `c·v ∈ S`

Take `c = 0` in condition 2 and it follows immediately: **every subspace must
contain the zero vector**. That is the fastest test there is — if a set misses
the origin, you can stop right there.

In `R³` there are exactly four kinds of subspace:

| Dimension | Shape | Example |
|---|---|---|
| 0 | a point — the origin itself | `{(0,0,0)}` |
| 1 | a line **through the origin** | span of `(1,2,1)` |
| 2 | a plane **through the origin** | span of `(1,0,0)` and `(0,1,0)` |
| 3 | all of `R³` | span of three independent vectors |

The words "through the origin" are the ones people drop. The plane `z = 1` is
not a subspace: it misses the origin, and adding two of its points gives a point
with `z = 2`, which falls outside.

The convenient fact: **the span of any set of vectors is always a subspace**.
Adding two linear combinations gives a linear combination, and so does scaling
one. So to build a subspace, just take the span of a few vectors.

## Column space: when Ax = b is solvable

Recall the column picture from Chapter 2: `Ax` is a **linear combination of the
columns of A**, with `x` holding the coefficients. So as `x` ranges over
everything, `Ax` sweeps out exactly the span of the columns. That set is the
**column space** `C(A)`.

> `Ax = b` has a solution ⇔ `b` lies in `C(A)`.

This turns an algebraic question ("does the system have a solution") into a
geometric one ("is the point `b` on that plane"), and back again. The three
solution cases of Chapter 2, reread in the new language:

- `b` outside `C(A)` → no solution
- `b` in `C(A)`, columns independent → exactly one solution
- `b` in `C(A)`, columns dependent → infinitely many solutions

**A basis for `C(A)` is the set of pivot columns of `A`** — those columns of the
*original* matrix, not of the eliminated one. Elimination is only used to *point
out* which columns are pivot columns; elimination itself does change the column
space.

## Null space: the solutions of Ax = 0

The **null space** `N(A)` is the set of all `x` with `Ax = 0`. It is always a
subspace (if `Ax = 0` and `Ay = 0` then `A(x+y) = 0`), and it always contains
`x = 0`.

A basis for `N(A)` is exactly the set of **special solutions** built in Chapter
2: one per free variable, obtained by setting that variable to 1 and the other
free variables to 0.

```
dim N(A) = number of free variables = number of columns − rank(A)
```

The null space answers "is the solution unique": the solution of `Ax = b` is
unique **exactly when** `N(A)` contains nothing but the zero vector. And if
`N(A)` is a line, every solution has the form "one particular solution plus any
point on that line" — the same `x_particular + t·s` structure as Chapter 2, now
with a name.

Note the two spaces live in different places: for `A` of size `m×n`,
`C(A) ⊆ Rᵐ` (rows) while `N(A) ⊆ Rⁿ` (columns).

## Linear independence

Vectors `v₁, …, vₖ` are **linearly independent** if

```
c₁v₁ + … + cₖvₖ = 0   happens only when   c₁ = … = cₖ = 0
```

In other words: no vector can be written using the others — none is redundant.
If some nonzero set of coefficients produces the zero vector, the set is
**dependent**.

The mechanical test: put the vectors in the **columns** of a matrix `A` and
eliminate.

```
independent ⇔ rank(A) = number of vectors ⇔ every column is a pivot column ⇔ N(A) = {0}
```

Several facts follow immediately:

- A set containing the zero vector is **always** dependent (give it coefficient 1).
- In `R³`, **four or more vectors are always dependent** — the rank cannot exceed
  3, the number of rows.
- Two vectors are independent ⇔ they are not on the same line.

## Basis and dimension

A **basis** for a subspace is a set of vectors that is both **independent** and
**spans** the whole subspace. The two conditions pull in opposite directions:
more vectors make spanning easier but independence harder, fewer vectors the
other way round. A basis is the balance point — just enough, nothing spare.

A subspace has **infinitely many different bases**, but every basis of it has
**the same number of vectors**. That shared count is the **dimension**.

In `R³`, `(1,0,0), (0,1,0), (0,0,1)` is the familiar basis, but
`(1,1,0), (0,1,1), (1,0,1)` is an equally valid one — still exactly three
vectors.

To extract a basis from any set of vectors: eliminate and **keep the pivot
columns**. The remaining columns are the ones expressible from the pivot
columns, so dropping them leaves the span unchanged.

## The rank theorem

Everything collects into a single identity, true for every `m×n` matrix `A`:

```
rank(A) + dim N(A) = n        (n = number of columns)
```

In words: each column is either a pivot column (contributing one dimension to
the column space) or a free column (contributing one dimension to the null
space). No column does both, and none sits out.

One more surprise: **the dimension of the row space always equals the dimension
of the column space**, even though the two spaces live in different places and
look nothing alike. Both equal `rank(A)` — which is why the rank is the single
most important number attached to a matrix.

## Common mistakes

- **Forgetting "through the origin".** A line or plane that misses the origin is
  not a subspace, however flat it looks.
- **Using pivot columns of the eliminated matrix as a basis for `C(A)`.** Take
  the corresponding columns of the **original** matrix; elimination preserves
  which *positions* are pivots but not the column space itself.
- **Confusing `C(A)` with `N(A)`.** For `A` of size `m×n`: `C(A)` lives in `Rᵐ`,
  `N(A)` lives in `Rⁿ`. Usually they are not even in spaces of the same size.
- **Thinking more vectors means a bigger span.** Adding a dependent vector
  changes the span **not at all**.
- **Confusing the number of vectors with the dimension.** Four vectors in `R³`
  may still span only a line — the dimension is the `rank`, not the head count.
- **Forgetting the zero vector.** Any set containing it is dependent, and `{0}`
  by itself is still a perfectly valid subspace (of dimension 0).
