# Boolean algebra & logic gates

*Digital Design 6th ed., §2.1–2.8.*

## 1. Huntington's postulates

Boolean algebra is an algebraic structure on `{0, 1}` with two operations,
`+` (OR) and `·` (AND), satisfying six groups of postulates:

| | Sum form (+) | Product form (·) |
|---|---|---|
| **P1** Closure | `x + y` is in the set | `x · y` is in the set |
| **P2** Identity | `x + 0 = x` | `x · 1 = x` |
| **P3** Commutative | `x + y = y + x` | `xy = yx` |
| **P4** Distributive | `x(y + z) = xy + xz` | `x + yz = (x + y)(x + z)` |
| **P5** Complement | `x + x′ = 1` | `x · x′ = 0` |
| **P6** | at least two distinct elements exist | |

> **Where this differs from ordinary algebra:** `P4` holds **both ways**. In
> ordinary arithmetic `x + yz ≠ (x+y)(x+z)`, but in Boolean algebra it does.
> Boolean algebra also has **no subtraction and no division**.

### The duality principle

Every postulate comes in a pair. Swapping `+ ↔ ·` and `0 ↔ 1` in a true
statement yields another true statement, its **dual**. Proving one side
therefore gives you the other for free.

## 2. Basic theorems

| | Sum form | Product form |
|---|---|---|
| **T1** Idempotent | `x + x = x` | `x · x = x` |
| **T2** Absorbing element | `x + 1 = 1` | `x · 0 = 0` |
| **T3** Involution | `(x′)′ = x` | |
| **T4** Associative | `x + (y + z) = (x + y) + z` | `x(yz) = (xy)z` |
| **T5** DeMorgan | `(x + y)′ = x′y′` | `(xy)′ = x′ + y′` |
| **T6** Absorption | `x + xy = x` | `x(x + y) = x` |

**Consensus**: `xy + x′z + yz = xy + x′z` — the `yz` term is redundant, because
every case where `yz = 1` is already covered by one of the other two.

## 3. Boolean functions

A Boolean function of n variables can be described three equivalent ways:

1. **Algebraic expression:** `F = x + y′z`
2. **Truth table:** all `2ⁿ` rows with F's value on each.
3. **Circuit diagram:** the corresponding gates wired together.

The truth table is **unique** for a function; the expression is **not** — the
same function can be written many ways, and finding the **cheapest** one is the
subject of Chapter 3.

That is the link to Chapter 3: algebraic simplification here is done by hand and
depends on spotting which theorem applies; a K-map does the same job
**systematically**.

## 4. Simplifying with theorems (Example 2.1)

```
(a) x(x′ + y) = xx′ + xy = 0 + xy = xy
(b) x + x′y  = (x + x′)(x + y) = 1·(x + y) = x + y
(c) (x + y)(x + y′) = x + yy′ = x + 0 = x
(d) xy + x′z + yz = xy + x′z            (consensus)
(e) (x + y)(x′ + z)(y + z) = (x + y)(x′ + z)   (dual of (d))
```

(b) and (c) are worth remembering: they show that adding a variable does not
always cost extra literals.

## 5. Complementing a function

There are two ways to get `F′`, and they always agree:

**Way 1 — generalized DeMorgan (Example 2.2):** swap every `+` with `·` and
every `·` with `+`, and complement each literal.

```
F  = x + y′z
F′ = x′(y + z′)
```

**Way 2 — via the dual (Example 2.3):** take the **dual** of F (swap `+ ↔ ·`
only, keeping the variables), then complement each literal.

```
F      = x + y′z
dual F = x(y′ + z)
F′     = x′(y + z′)      ← complement each literal
```

> **Very easy to get wrong:** respect the **precedence**. `y′z` is a product, so
> its dual is `(y′ + z)` — **with parentheses**. Flipping symbols on the raw
> character string without them gives `x · y′ + z`, which is simply wrong.

## 6. Minterms, maxterms and canonical forms

For n variables:

- **Minterm** `mᵢ`: a product of all n literals, equal to 1 on **exactly one**
  row. A variable that is 0 appears complemented. For n = 3, `m₅ = xy′z` (5 = 101).
- **Maxterm** `Mᵢ`: a sum of all n literals, equal to 0 on **exactly one** row.
  The convention is **reversed**: a variable that is 1 appears complemented, so
  `M₅ = x′ + y + z′`.

Relationship: `Mᵢ = (mᵢ)′`.

**Canonical forms:**

- **Canonical SOP** = sum of the minterms where F = 1 ⇒ written `F = Σm(…)`
- **Canonical POS** = product of the maxterms where F = 0 ⇒ written `F = ΠM(…)`

Their index sets are complementary: if `F = Σm(1,3,5,7)` with n = 3, then
`F = ΠM(0,2,4,6)`.

A canonical form is always **unique** but usually **not minimal** — which is why
K-maps exist (Chapter 3).

## 7. The 16 two-variable functions & the 8 standard gates

Two variables admit `2^(2²) = 16` possible functions, from `F0 = 0` to
`F15 = 1`. They fall into three groups:

- **Constant:** `F0 = 0`, `F15 = 1`
- **Unary:** transfer `x`, `y` and complement `x′`, `y′`
- **Binary operators:** AND, OR, NAND, NOR, XOR, XNOR, plus inhibition and
  implication

Of these, **8 are manufactured as standard parts**: AND, OR, NOT (inverter),
Buffer (transfer), NAND, NOR, XOR, XNOR.

### Three things people get wrong about multi-input gates

1. AND, OR and XOR **are associative**, so they extend to many inputs naturally.
2. NAND and NOR are **NOT associative**: `(x↑y)↑z ≠ x↑(y↑z)`. A 3-input NAND is
   therefore **redefined** as `(xyz)′`, not built from two 2-input NANDs.
3. NAND and NOR are **universal**: either one alone can build any Boolean
   function. That is why real circuits often convert a whole AND-OR network into
   NANDs only.

## 8. Common mistakes

- Forgetting that `P4` works **both ways** (`x + yz = (x+y)(x+z)`).
- Taking a dual or complement on the character string and dropping parentheses.
- Mixing up the complement convention between minterms and maxterms — they are **opposite**.
- Assuming a multi-input NAND is a chain of 2-input NANDs (it is not — no associativity).
- Stopping at a canonical form and calling it minimal.
