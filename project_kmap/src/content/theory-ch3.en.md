# Gray code & Karnaugh maps

## 1. What is Gray code?

Gray code (*reflected binary code*) numbers values so that **two consecutive
codes differ in exactly one bit**.

| Decimal | Binary | Gray |
|---|---|---|
| 0 | 000 | 000 |
| 1 | 001 | 001 |
| 2 | 010 | 011 |
| 3 | 011 | 010 |
| 4 | 100 | 110 |
| 5 | 101 | 111 |
| 6 | 110 | 101 |
| 7 | 111 | 100 |

The last code (100) and the first (000) also differ in one bit, so this is a
**closed cycle**, not a straight sequence.

### Conversion formulas

- **Binary → Gray:** `g[i] = b[i−1] XOR b[i]`, treating `b[−1]` as 0. The
  leftmost bit has the highest weight, so the MSB passes through unchanged.
- **Gray → Binary:** `b[i] = b[i−1] XOR g[i]`, using the **binary bit just
  computed**, not the gray bit. This is the step people get wrong most often.

### Building it by "reflect and prefix"

Gray on n bits = (Gray on n−1 bits, prefixed with **0**) followed by
(Gray on n−1 bits **reversed**, prefixed with **1**).

The two rows at the seam are copies of the same n−1 bit string, so they differ
only in the prefix bit — the one-bit rule still holds.

## 2. Why does a K-map use Gray order?

Two **adjacent** cells on a K-map must differ in exactly **one variable**;
only then does merging them cancel that variable:

```
x'yz + xyz = yz(x' + x) = yz
```

With ordinary binary labels (00, 01, **10**, 11) the step 01 → 10 flips two
bits, so those two cells *cannot* merge.

Gray order (00, 01, **11**, 10) keeps every step at one bit, and because Gray
is a closed cycle the **last column is adjacent to the first** — which is what
produces **wrap-around** groups, such as the four corners of a 4-variable map
merging into `x'z'`.

Put differently: a K-map is an **n-dimensional hypercube** flattened onto the
page, and Gray code is the flattening that preserves adjacency.

## 3. Rules for circling groups

1. A group's size must be a **power of 2**: 1, 2, 4, 8, 16…
2. A group must be a **rectangle on a torus** — it may wrap across the
   left/right and top/bottom edges.
3. A group may contain only **1** and **X** (don't care) cells, never a **0**.
4. Bigger groups mean fewer literals, so always circle the largest group you can.
5. Every **1** must be covered by at least one group. An **X** *may* be used to
   enlarge a group but does **not** have to be covered.

Reading a term off a group: a variable that keeps the **same** value in every
cell of the group is kept (value 1 → plain, value 0 → complemented); a variable
that **changes** is eliminated.

## 4. Prime and essential prime implicants

- **Implicant**: any valid group (a product of literals covering only 1/X cells).
- **Prime implicant (PI)**: an implicant that **cannot be enlarged** further.
- **Essential prime implicant (EPI)**: a PI that covers a 1 which **no other PI**
  covers, so it must appear in the answer.

The minimization procedure (Quine–McCluskey, which is what the K-map tab runs):

1. List **every** prime implicant by merging groups that differ in one bit,
   repeating until nothing more merges.
2. Take all the **essential** PIs.
3. Cover the remaining 1s with as few PIs as possible; break ties by literal count.

## 5. SOP and POS

- **SOP** (Sum of Products, Σm): cover the **1** cells; result looks like `x'y + zw + …`
- **POS** (Product of Sums, ΠM): cover the **0** cells to minimize `F'`, then
  complement with **De Morgan** — each product becomes a sum and every literal flips.

Example: if `F' = x'z'` then `F = (x + z)`.

Both forms describe the same function, but their term and literal counts can
differ — pick whichever is cheaper for the problem at hand.

## 6. Common mistakes

- Forgetting that a K-map **wraps around**, and missing the four-corner group.
- Circling 3 or 6 cells (not a power of 2).
- Using the **gray** `b[i-1]` instead of the **binary** one when converting Gray → Binary.
- Believing every don't care must be covered (they are optional).
- Stopping at a correct but **non-minimal** answer: always check whether a group
  can still be enlarged.
