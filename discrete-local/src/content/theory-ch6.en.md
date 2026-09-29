# Divisibility & gcd

*Following MCS §9.1–9.4; Rosen §4.1, 4.3.*

**After this chapter you can:**
- Find a gcd with the Euclidean algorithm, line by line.
- Write the gcd as a combination s·a + t·b with the Pulverizer.
- Find an lcm; use prime factorisation.

## Divisibility

**a | b** ("a divides b") when b = k·a for some integer k. E.g. 3 | 12, 5 ∤ 12.

Useful facts:

- a | b and a | c ⇒ a | (s·b + t·c) for all integers s, t.
- a | b and b | c ⇒ a | c.

<details><summary>Why the first fact matters</summary>

It says a common divisor of a and b also divides **every** combination s·a + t·b — the key to Euclid and the Pulverizer.

</details>

## Division with remainder

For b > 0, every integer a can be written **uniquely** as

```
a = q·b + r,    0 ≤ r < b
```

q is the quotient, r = **a rem b** the remainder. Careful with negatives: −7 = (−2)·5 + 3, so −7 rem 5 = 3, not −2.

## The Euclidean algorithm

Key idea: **gcd(a, b) = gcd(b, a rem b)** — a common divisor of a, b is also one of b and a − q·b.

```
gcd(259, 70):
259 = 3·70 + 49
 70 = 1·49 + 21
 49 = 2·21 + 7
 21 = 3·7  + 0     ⇒ gcd = 7
```

The last nonzero remainder is the gcd. It takes very few steps (about 2·log₂ of the larger number).

<div data-check="c6q:gcd"></div>

## The Pulverizer: gcd = s·a + t·b

gcd(a, b) can always be written as **s·a + t·b** (s, t integers — the *Bezout coefficients*). The Pulverizer runs Euclid but writes **each remainder as s·a + t·b**:

```
a = 259, b = 70
 49 = 259 − 3·70           =  1·259 − 3·70
 21 =  70 − 1·49           = −1·259 + 4·70
  7 =  49 − 2·21           =  3·259 − 11·70
```

Check: 3·259 − 11·70 = 777 − 770 = 7. ✓

<div data-check="c6q:bezout" data-needs="c6q:gcd"></div>

## The gcd is the smallest positive combination

**Theorem (MCS 9.2.2):** gcd(a, b) is the **smallest positive** number of the form s·a + t·b.

Consequences you will use:

- s·a + t·b = 1 is solvable ⇔ gcd(a, b) = 1 (a and b are *relatively prime*).
- Every common divisor of a and b divides gcd(a, b).

The next chapter uses exactly this to find **modular inverses**.

## Primes & lcm

**Fundamental theorem of arithmetic:** every number > 1 factors **uniquely** into primes, e.g. 360 = 2³·3²·5.

From the factorisations: the gcd takes the **smaller** exponent, the lcm the **larger**. And always

```
gcd(a, b) · lcm(a, b) = a · b
```

<div data-check="c6q:lcm" data-needs="c6q:gcd"></div>

## Common mistakes

- Stopping Euclid at the wrong line: the gcd is the **last nonzero** remainder, not the zero.
- Sign slips in the Pulverizer: check s·a + t·b with a real multiplication.
- Assuming the pair (s, t) is unique — there are infinitely many.
- Negative remainders: r is always in 0 … b − 1.
- lcm = a·b only when the gcd is 1.
