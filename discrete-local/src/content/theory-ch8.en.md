# Graphs

*After MCS §12.1–12.9, walk counting §10.3; Rosen §10.1–10.5, 11.1. Figures in questions: vertices a, b, c… placed on a circle.*

**After this chapter you can:**
- Use the handshake lemma; decide whether a degree sequence is graphic.
- Count walks with the adjacency matrix; find distances by BFS; count connected components.
- Recognise bipartite graphs, Euler tours, trees; prove two graphs are not isomorphic.

## Simple graphs and degree

A **simple graph** G = (V, E): V is the vertex set, E the edge set, each edge a pair of **two distinct vertices** (no loops, no repeated edges). Two vertices sharing an edge are **adjacent**.

The **degree** deg(v) = number of edges touching v.

**Handshake lemma:** Σ deg(v) = 2·|E| — each edge adds 1 to the degree of **both** ends.

Consequence: the number of odd-degree vertices is always **even**.

```
degree sequence 3, 3, 2, 2, 2  ⇒  sum 12  ⇒  |E| = 6
```

<div data-check="c8q:degree"></div>

## Which degree sequences are graphic

Question: is there a simple graph with a given degree sequence? Two steps:

1. The sum must be **even** (handshake). Odd ⇒ no.
2. **Havel–Hakimi:** remove the largest d, subtract 1 from the **d largest** remaining, re-sort; repeat. Reaching all 0 ⇒ yes; a negative entry ⇒ no.

```
(3, 3, 3, 1): sum 10, even
remove 3, subtract 1 from the next 3 → (2, 2, 0)
remove 2, subtract 1 from the next 2 → (1, −1)   ⇒ not graphic
```

An even sum is **necessary**, not **sufficient**.

<div data-check="c8q:valid" data-needs="c8q:degree"></div>

## Common graphs

| Name | Shape | Edges |
|---|---|---|
| Kₙ (complete) | every pair adjacent | n(n − 1)/2 |
| Lₙ (line) | n vertices in a line | n − 1 |
| Cₙ (cycle) | n vertices in a ring, n ≥ 3 | n |
| Kₘ,ₙ (complete bipartite) | m vertices each joined to all n on the other side | m·n |

Counting Kₙ by handshake: n vertices of degree n − 1 ⇒ |E| = n(n − 1)/2.

<div data-check="c8q:special" data-needs="c8q:degree"></div>

## Walks and the adjacency matrix

A **walk** of length k: a sequence v₀, v₁, …, vₖ with consecutive vertices adjacent — vertices and edges **may** repeat. With no repeated vertex it is a **path**.

The **adjacency matrix** A: Aᵤᵥ = 1 if u is adjacent to v, else 0 (undirected ⇒ A is symmetric).

**Theorem (MCS 10.3):** entry (u, v) of **Aᵏ** = the number of length-k walks from u to v.

Why: a length-2 walk from u to v means choosing a middle vertex w with u–w and w–v adjacent — summing over w is exactly matrix multiplication.

<div data-check="c8q:walks"></div>

## Distance and BFS

The **distance** dist(u, v) = number of edges on a **shortest** path from u to v.

**BFS** (breadth-first search) finds every distance from s:

- Layer 0 = {s}.
- Layer i + 1 = the **unvisited** vertices adjacent to some vertex in layer i.

A vertex in layer i is exactly i edges from s. Tracing back "who discovered me" gives a shortest path.

<div data-check="c8q:dist"></div>

## Connectivity

G is **connected** when every pair of vertices is joined by a path.

A **connected component** = a group of vertices that reach one another and nothing outside. To find them: BFS from an unvisited vertex gives one component; repeat.

An isolated vertex (degree 0) is **one** component by itself.

<div data-check="c8q:comp" data-needs="c8q:dist"></div>

## Bipartite graphs

G is **bipartite** when V splits as X ∪ Y so that **every edge** joins an X vertex to a Y vertex.

**Theorem (MCS 12.8):** G is bipartite ⇔ G has **no odd-length cycle**.

Test with BFS colouring: even layers into X, odd layers into Y. An edge between two same-coloured vertices yields an odd cycle ⇒ not bipartite.

E.g. Cₙ is bipartite ⇔ n is even; every tree is bipartite.

<div data-check="c8q:bipartite" data-needs="c8q:dist"></div>

## Euler tours

An **Euler tour** uses **every edge exactly once** and returns to its start; an **Euler walk** does the same without returning.

**Theorem (Euler):** for a connected G (ignoring isolated vertices):

- An Euler tour exists ⇔ **every** degree is even.
- An Euler walk (not closed) exists ⇔ **exactly 2** odd-degree vertices — the walk joins those two.

Why even: every pass **through** a vertex uses one edge in and one edge out.

<div data-check="c8q:euler" data-needs="c8q:degree c8q:comp"></div>

## Trees and forests

A **tree** = a connected graph with no cycle. A **forest** = no cycle (each component is a tree). A **leaf** = a degree-1 vertex.

Properties (MCS 12.9):

- A tree on n vertices has exactly **n − 1** edges.
- Between two vertices of a tree there is **exactly one** path.
- A tree with at least 2 vertices has at least 2 leaves.
- A forest with n vertices and c trees has **n − c** edges.

Every connected graph has a **spanning tree** (n − 1 edges) — keep deleting edges that lie on a cycle.

<div data-check="c8q:tree" data-needs="c8q:comp"></div>

## Isomorphism

G and H are **isomorphic** when there is a bijection f: V(G) → V(H) with uv an edge of G ⇔ f(u)f(v) an edge of H. In short: **drawn differently, the same graph**.

To prove **not** isomorphic: find an **invariant** that differs — number of vertices, edges, degree sequence, triangles, components, whether there is an odd cycle.

Careful: the same degree sequence does **not** guarantee isomorphism. C₆ and two disjoint triangles both have every degree 2.

To prove isomorphic: exhibit f and check every edge.

<div data-check="c8q:iso" data-needs="c8q:degree c8q:special"></div>

## Common mistakes

- Forgetting to halve when using the handshake lemma.
- Seeing an even degree sum and concluding "graphic" — Havel–Hakimi is still needed.
- Counting walks but forbidding repeated vertices — Aᵏ counts repeating walks too.
- Forgetting isolated vertices when counting components.
- Euler: confusing "all degrees even" (every **edge** once) with a Hamiltonian cycle (every **vertex** once).
- Concluding isomorphic only because the degree sequences match.
