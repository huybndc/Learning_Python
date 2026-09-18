# Chapter 1 — Vectors

Linear algebra starts from a very ordinary question: *what do you get when you
add two arrows?* Everything that follows — matrices, systems of equations,
subspaces — grows out of the only two operations in this chapter: **vector
addition** and **multiplication by a number**.

## What a vector is

A vector in `R²` is an ordered pair of numbers, written as a column:

```
v = [ 2 ]      w = [ -1 ]
    [ 1 ]          [  3 ]
```

There are three ways to look at the same vector `v = (2, 1)`, and all three are
correct:

| View | Meaning |
|---|---|
| A list of numbers | the ordered pair `(2, 1)` — first component 2, second 1 |
| A point | the point at `x = 2`, `y = 1` |
| An arrow | an arrow from the origin `(0, 0)` to the point `(2, 1)` |

The arrow view matters most, because it gives a vector two properties you can
read off by eye: **direction** and **length**. Position does not matter — an
arrow from `(5, 5)` to `(7, 6)` is still that same vector `(2, 1)`, just drawn
somewhere else.

In `R³` a vector has three components `(x, y, z)`. In `R⁵` it has five — you
can no longer draw it, but not one letter of the algebra changes.

## Adding vectors and scaling them

Both operations work **componentwise**:

```
v + w = [ 2 ] + [ -1 ] = [ 2 + (-1) ] = [ 1 ]
        [ 1 ]   [  3 ]   [ 1 +   3  ]   [ 4 ]

2v    = 2·[ 2 ] = [ 4 ]        -v = [ -2 ]
          [ 1 ]   [ 2 ]             [ -1 ]
```

Geometrically, `v + w` is the diagonal of the parallelogram built from `v` and
`w`. There are two ways to read the same picture, and both are worth keeping:

- **Tip to tail:** walk along `v`, then from the tip of `v` walk a stretch equal
  to `w`. Where you stop is `v + w`. Walking `w` first and `v` second lands in
  exactly the same place — that is the geometric reason behind the commutative
  law `v + w = w + v`.
- **Parallelogram:** `v` and `w` are two adjacent sides, `v + w` is the long
  diagonal.

Multiplying by a number `c` **keeps the line and only changes the length**:
`c > 1` stretches, `0 < c < 1` shrinks, `c < 0` flips by 180°, `c = 0` gives the
zero vector.

> The zero vector is the only vector with no direction. It is still a perfectly
> good vector and shows up constantly — `v + (-v) = 0` — but asking for "the
> angle of the zero vector" is meaningless.

And what about `v − w`? Rewrite it as `v + (−w)`: still addition. Geometrically
`v − w` is the arrow **from the tip of `w` to the tip of `v`** — remember it as
"whatever you subtract is where you start".

## The length of a vector

The length (norm) of `v` comes straight from Pythagoras:

```
‖v‖ = √(v₁² + v₂²)          in R²
‖v‖ = √(v₁² + v₂² + v₃²)    in R³
```

For example `‖(3, 4)‖ = √(9 + 16) = 5`. The length is never negative, and it is
zero exactly when `v` is the zero vector.

Dividing a vector by its own length gives a **unit vector** — same direction,
length 1:

```
u = v / ‖v‖        for example (3, 4)/5 = (0.6, 0.8)
```

This move is used constantly later (orthonormal bases, Gram-Schmidt in Ch.4),
so it pays to get comfortable with it early.

## The dot product

The dot product multiplies matching components and adds them up. The result is
**a number**, not a vector:

```
v · w = v₁w₁ + v₂w₂ = 2·(-1) + 1·3 = 1
```

Three properties worth memorising:

- `v · w = w · v` (symmetry)
- `v · (w + u) = v · w + v · u` (linearity)
- `v · v = ‖v‖²` — the dot product of a vector with itself is the square of its
  length. This is the bridge between the algebra and the geometry.

The most important part: **the sign of `v · w` tells you whether the two vectors
point roughly the same way.**

| `v · w` | Geometric meaning |
|---|---|
| `> 0` | acute angle — roughly the same direction |
| `= 0` | **perpendicular** (orthogonal) |
| `< 0` | obtuse angle — roughly opposite directions |

The case `v · w = 0` is the one to remember from this whole chapter: try `(1, 1)`
and `(1, −1)` and you get `1 − 1 = 0`, and sure enough those two arrows are at
right angles.

## The angle between two vectors

The formula that connects the dot product to the angle:

```
cos θ = (v · w) / (‖v‖ · ‖w‖)
```

Since `|cos θ| ≤ 1`, this implies the **Schwarz inequality**:

```
|v · w| ≤ ‖v‖ · ‖w‖
```

Equality holds exactly when `v` and `w` lie on the same line. From it follows
the **triangle inequality** `‖v + w‖ ≤ ‖v‖ + ‖w‖` — the diagonal is never longer
than going around the two sides.

Closely tied to the angle is the **projection** of `v` onto `w`:

```
proj_w(v) = ((v · w) / (w · w)) · w
```

This is the "shadow" `v` casts on the line through `w`. What is left over,
`v − proj_w(v)`, is always perpendicular to `w` — check it with a dot product
and you get exactly 0. That idea is the seed of least squares in Chapter 4.

## Linear combinations and span

Put the chapter's two operations together and you get the central idea of the
whole subject:

```
c·v + d·w        for any numbers c, d
```

is a **linear combination** of `v` and `w`. The set of *all* such combinations
is called the **span** of `v` and `w`.

In `R²`, the span of two vectors has only three possibilities:

| Case | The span is |
|---|---|
| `v`, `w` not on the same line | **the whole plane** `R²` |
| `v`, `w` on the same line (and nonzero) | **a line** through the origin |
| both are the zero vector | **a point** — the origin itself |

The question "is the vector `b` in the span of `v` and `w`?" sounds geometric,
but it is exactly the question **"does the system `c·v + d·w = b` have a
solution?"** — and that is precisely Chapter 2. The two chapters are one story
seen from two sides: Chapter 1 looks at the picture, Chapter 2 looks at the
numbers.

## Common mistakes

- **The dot product is not a vector.** `v · w` is a number. Writing
  `v · w = (2, 3)` is wrong at the level of types.
- **There is no vector division.** Never write `v / w`. You can only divide by a
  *number*.
- **`‖v + w‖ ≠ ‖v‖ + ‖w‖`** in most cases. The two sides agree only when `v` and
  `w` point the same way.
- **The zero vector has no direction**, so do not ask for the angle between it
  and another vector, and do not try to normalise it (division by zero).
- **Same line does not mean equal.** `(1, 2)` and `(2, 4)` lie on the same line
  but are different vectors; they share a span, not a value.
- **Order matters when subtracting.** `v − w` and `w − v` point opposite ways.
  Draw it once and it sticks: `v − w` goes *from* `w` *to* `v`.
