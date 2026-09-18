# Chapter 2 — Solving linear systems (Ax = b)

Chapter 1 asked *"is b in the span of these vectors?"*. This chapter answers that
question with a mechanical procedure you can run by hand and that always
terminates: **Gaussian elimination**.

## From a system to Ax = b

A system of two equations in two unknowns:

```
 x + 2y = 5
3x + 4y = 6
```

splits into three parts: the coefficient table `A`, the column of unknowns `x`,
and the right-hand side `b`.

```
A = [ 1  2 ]     x = [ x ]     b = [ 5 ]
    [ 3  4 ]         [ y ]         [ 6 ]
```

Written compactly, that is `Ax = b`. When solving by hand we glue `A` and `b`
into the **augmented matrix** `[A | b]` so we stop rewriting the variable names:

```
[ 1  2 | 5 ]
[ 3  4 | 6 ]
```

From here on, everything is just operations on this table of numbers.

## Two ways to read it: rows and columns

The same system can be read two ways, and you need both:

**The row picture.** Each equation is a line in the plane (with 3 unknowns, a
plane in space). The solution is the **intersection**. Two lines in `R²` have
only three possibilities: they cross at one point, they are parallel (no
intersection), or they coincide (the intersection is a whole line). Those three
possibilities are exactly the three solution cases below.

**The column picture.** Rewrite `Ax = b` as

```
x·[ 1 ] + y·[ 2 ] = [ 5 ]
  [ 3 ]     [ 4 ]   [ 6 ]
```

Now the question becomes: *which linear combination of the columns produces
`b`?* That is precisely the span question from Chapter 1. The column picture is
the more important one in the long run — it leads straight to the column space
in Chapter 3.

## The three row operations

Only three moves are allowed, and what they share is that **none of them changes
the solution set** (each one is reversible):

| Operation | Notation | Why no solution is lost |
|---|---|---|
| Swap two rows | `R2 <-> R3` | the order the equations are written in does not matter |
| Multiply a row by a nonzero number | `R2 <- 3R2` | multiplying both sides of one equation by a nonzero number |
| Add a multiple of another row | `R3 <- R3 - 2R1` | adding both sides of two true equations |

The one classic mistake: **never multiply a row by 0**. That turns an equation
into `0 = 0`, destroys information, and cannot be undone.

## Elimination: reaching echelon form

The idea: use the third operation to create zeros below the diagonal, working
left to right.

```
[ 1  2  3 | 6 ]                      [ 1   2   3 |  6 ]
[ 2  5  2 | 4 ]  R2 <- R2 - 2R1  ->  [ 0   1  -4 | -8 ]
[ 6 -3  1 | 2 ]  R3 <- R3 - 6R1      [ 0 -15 -17 |-34 ]

                 R3 <- R3 + 15R2 ->  [ 1   2   3 |  6 ]
                                     [ 0   1  -4 | -8 ]
                                     [ 0   0 -77 |-154 ]
```

The first nonzero entry of each row is called a **pivot**. The shape we reach —
each pivot to the right of the pivot in the row above, zero rows at the bottom —
is **row echelon form**.

If the pivot position holds a 0, **swap** with a row below that has a nonzero
entry there. If the whole column from that point down is zero, that column has
**no pivot** — its unknown will be a free variable.

From echelon form, solve upward (**back substitution**): `-77z = -154` gives
`z = 2`, substitute into the row above to get `y`, then `x`.

Go one step further — divide each row by its pivot so every pivot becomes 1,
then also clear the entries **above** each pivot — and you reach **reduced row
echelon form** (RREF), where the solution is read straight off the last column
with no back substitution at all.

## Pivots, rank and free variables

The **rank** of `A` is the **number of pivots** — equivalently, the number of
nonzero rows after elimination. This is the number that says how many genuinely
independent equations the system has, which is not the same as how many
equations are written on the page.

An unknown whose column has a pivot is a **pivot variable**; an unknown whose
column has none is a **free variable**. The relation always holds:

```
number of free variables = number of unknowns − rank(A)
```

Free variables are exactly what the name says: give them any value you like and
the pivot variables adjust to match. Each free variable is one "degree of
freedom" in the solution set.

## The three solution cases

Compare `rank(A)` with `rank([A | b])` and with the number of unknowns `n`:

| Condition | Result | Sign during elimination |
|---|---|---|
| `rank(A) < rank([A｜b])` | **no solution** | a row `0 0 0 ｜ 5` appears |
| `rank(A) = rank([A｜b]) = n` | **exactly one solution** | every unknown has a pivot |
| `rank(A) = rank([A｜b]) < n` | **infinitely many solutions** | at least one free variable |

A row reading `0 = 5` is a flat contradiction — no numbers satisfy it, so the
system has no solution. A row reading `0 = 0` is harmless: it only says that
equation repeated information already present in the others.

> More equations than unknowns does **not** mean no solution, and fewer does
> **not** mean infinitely many. Only the rank decides.

## General solution = particular + homogeneous

When a system has infinitely many solutions, write the solution set in two
parts:

```
x = x_particular + t₁·s₁ + t₂·s₂ + …
```

- **Particular solution** `x_particular`: set every free variable to 0 and read
  the pivot variables off the RREF.
- **Special solutions** `sᵢ`: set free variable number `i` to 1, all other free
  variables to 0, and solve `Ax = 0`.

For example with `x + 2y = 3`: the particular solution is `(3, 0)`, the special
solution is `(-2, 1)`, so the solution set is `(3, 0) + t·(-2, 1)` — exactly one
line in the plane, matching the row picture above.

This structure, "one particular solution plus all solutions of the homogeneous
system", comes back in Chapter 3 under the name **null space**.

## Common mistakes

- **Multiplying a row by 0.** Solutions are lost and it cannot be undone. Never.
- **Adding a row to itself** in the third operation. `R2 <- R2 - 2R2` is really
  multiplying the row by `-1` and invites confusion — always add a multiple of a
  *different* row.
- **Forgetting the right-hand side.** Every row operation must be applied to the
  `b` column too. That is exactly why we use the augmented matrix `[A | b]` from
  the start.
- **Confusing `0 = 0` with `0 = 5`.** The first is a redundant row (harmless),
  the second is a contradiction (no solution).
- **Concluding from the number of equations.** Only the rank decides, not the
  number of lines on the page.
- **Skipping the check.** Substituting the solution back into the original
  system takes seconds and catches nearly every arithmetic slip.
