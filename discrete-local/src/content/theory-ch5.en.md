# Invariants & strong induction

*Following MCS §5.2–5.3 and chapter 6 (state machines); Rosen §5.2.*

**After this chapter you can:**
- Find an invariant to prove a state is **impossible** to reach.
- Use strong induction for "every number from some threshold on" problems.

## State machines and invariants

A process has **states** and **transitions**. An **invariant** is a property that:

1. holds in the start state, and
2. if it holds before a step, it still holds after it.

Then it holds in **every** reachable state (this is induction on the number of steps). A state that breaks the invariant can **never** be reached.

## The Die Hard water jugs

Two jugs of a and b litres. Allowed: fill one, empty one, pour one into the other until it is full or empty.

**Invariant:** the water in each jug is always a **multiple of gcd(a, b)**. (True at the start: 0; each step only adds or removes a or b, or moves water between the jugs.)

Conversely, every multiple of the gcd up to the big jug can be measured. E.g. jugs of 3 and 5: the gcd is 1, so 4 litres is possible.

<div data-check="c5q:jugs" data-needs="c6q:gcd"></div>

## Strong induction

Like ordinary induction, but in the inductive step you may assume **P(0), P(1), …, P(k) all hold** (not just P(k)) to prove P(k + 1).

Use it when P(k + 1) needs a case **much smaller**, not the one right before — e.g. factoring a number into primes.

## Postage stamps

With only 3-cent and 5-cent stamps you can pay every amount **from 8 cents on**.

- Base: 8 = 3 + 5, 9 = 3 + 3 + 3, 10 = 5 + 5 — three consecutive amounts.
- Step: for n ≥ 11, n − 3 ≥ 8 can be paid (strong hypothesis); add one 3-cent stamp.

In general, for relatively prime a and b the largest amount that **cannot** be paid is **a·b − a − b**.

<div data-check="c5q:stamps" data-needs="c4q:step"></div>

## Common mistakes

- Picking an "invariant" that fails in the start state, or that some step breaks.
- Believing every amount up to the big jug can be measured — only multiples of the gcd.
- Strong induction with a single base case when the step reaches back to k − 2 or k − 3 and needs several.
- Concluding "impossible" because you could not find a way — proving impossibility needs an invariant.
