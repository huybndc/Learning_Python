# Sets & functions

*Following MCS chapter 4; Rosen §2.1–2.3.*

**After this chapter you can:**
- Compute unions, intersections, differences, symmetric differences, complements.
- Count |P(A)|, |A × B|, |A ∪ B|.
- Recognise functions, injections, surjections, bijections.

## Sets

A set is a collection of elements with **no order and no repeats**: {1, 2, 3} = {3, 1, 2} = {1, 1, 2, 3}.

- x ∈ A: x belongs to A. ∅: the empty set.
- **A ⊆ B**: every element of A is in B.
- **A = B** ⇔ A ⊆ B and B ⊆ A — the standard way to prove two sets are equal.

## Operations

| Symbol | Meaning |
|---|---|
| A ∪ B | in A **or** B |
| A ∩ B | in **both** A and B |
| A − B | in A, **not** in B |
| A ⊕ B | in **exactly one** of them |
| Aᶜ | in U, not in A |

They match the logical connectives: ∪ ↔ ∨, ∩ ↔ ∧, ᶜ ↔ ¬, ⊕ ↔ ⊕. DeMorgan holds too: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ.

<div data-check="c3q:setop" data-needs="c1q:value"></div>

## Counting elements

- The **power set** P(A) = the set of all subsets of A: |P(A)| = **2^|A|** (each element: in or out).
- The **Cartesian product** A × B = {(a, b)}: |A × B| = |A| · |B|.
- **Inclusion–exclusion:** |A ∪ B| = |A| + |B| − |A ∩ B| (the overlap was counted twice).

<div data-check="c3q:count"></div>

## Functions

f: A → B is a **function** when every element of A has **exactly one** image in B. A missing image or two images ⇒ not a function.

- **Injective:** no two elements share an image.
- **Surjective:** every element of B is the image of something.
- **Bijection:** both injective and surjective.

For finite sets: a bijection A → B exists ⇔ |A| = |B|. This is the basis of counting.

<div data-check="c3q:func"></div>

## Common mistakes

- Writing {1, 1, 2} and counting 3 elements — sets have no repeats.
- Mixing up A − B and B − A.
- |A ∪ B| = |A| + |B| when the sets overlap — forgetting to subtract the overlap.
- Thinking "injective" means every element of B is hit — that is surjective.
- Forgetting to check "is it a function at all" before asking about injective/surjective.
