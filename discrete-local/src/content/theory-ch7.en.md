# Congruences & RSA

*Following MCS §9.6–9.11; Rosen §4.4, 4.6. RSA steps follow the lecturer's template.*

**After this chapter you can:**
- Compute a mod n, and add/multiply modulo n.
- Find modular inverses; compute modular powers by repeated squaring.
- Compute φ(n); generate keys, encrypt and decrypt with small-number RSA.

## Congruence

**a ≡ b (mod n)** when n | (a − b), i.e. a and b leave the **same remainder** on division by n.

E.g. 17 ≡ 2 (mod 5), −3 ≡ 7 (mod 10).

Congruence **respects addition and multiplication**: if a ≡ b and c ≡ d (mod n) then a + c ≡ b + d and a·c ≡ b·d. So you can reduce mod n **in the middle** of a calculation and the numbers never grow.

**a mod n** is the remainder in 0 … n − 1 (even when a is negative).

<div data-check="c7q:mod"></div>

## Modular inverses

x is an **inverse** of a modulo n when a·x ≡ 1 (mod n).

**It exists ⇔ gcd(a, n) = 1.** To find it: the Pulverizer gives s·n + t·a = 1; reduce both sides mod n ⇒ t·a ≡ 1, so **x = t mod n**.

```
inverse of 7 mod 26:
26 = 3·7 + 5     5 = 1·26 − 3·7
 7 = 1·5 + 2     2 = −1·26 + 4·7
 5 = 2·2 + 1     1 = 3·26 − 11·7   ⇒ x = −11 mod 26 = 15
```

Check: 7·15 = 105 = 4·26 + 1. ✓ With an inverse you can **divide** modulo n.

<div data-check="c7q:inverse" data-needs="c7q:mod c6q:bezout"></div>

## Modular powers: repeated squaring

Compute 3¹³ mod 7 without computing 3¹³:

```
13 = 8 + 4 + 1 = (1101)₂
3¹ ≡ 3,  3² ≡ 2,  3⁴ ≡ 4,  3⁸ ≡ 2      (each entry = square of the previous, mod 7)
3¹³ = 3⁸·3⁴·3¹ ≡ 2·4·3 = 24 ≡ 3
```

About 2·log₂k multiplications — how RSA encrypts numbers with hundreds of digits.

<div data-check="c7q:power" data-needs="c7q:mod"></div>

## φ, Euler's theorem and Fermat

**φ(n)** = how many numbers in 1 … n are relatively prime to n.

- p prime: φ(p) = p − 1; φ(pᵉ) = pᵉ⁻¹(p − 1).
- gcd(a, b) = 1 ⇒ φ(a·b) = φ(a)·φ(b). E.g. φ(36) = φ(4)·φ(9) = 2·6 = 12.

**Euler's theorem:** gcd(a, n) = 1 ⇒ a^φ(n) ≡ 1 (mod n). The case n = p prime is **Fermat's little theorem**: aᵖ⁻¹ ≡ 1 (mod p).

<div data-check="c7q:phi" data-needs="c6q:gcd"></div>

## RSA

**Key generation:** pick primes p, q; n = p·q; φ = (p − 1)(q − 1); pick e with gcd(e, φ) = 1; **d = e⁻¹ mod φ**.
Public key (n, e), private key d.

**Encrypt:** c = mᵉ mod n. **Decrypt:** m = cᵈ mod n.

**Why it works:** e·d = 1 + kφ, so (mᵉ)ᵈ = m·(mᵠ)ᵏ ≡ m (Euler). It is secure because knowing n **without** its factors p·q you cannot get φ, hence not d.

<div data-check="c7q:rsa" data-needs="c7q:inverse c7q:power c7q:phi"></div>

## Common mistakes

- Negative remainders: −7 mod 5 = 3, not −2.
- Looking for an inverse when gcd ≠ 1 — there is none.
- Taking t from the Pulverizer and forgetting to bring it into 0 … n − 1.
- RSA: computing d modulo **n** instead of modulo **φ**.
- Computing mᵉ in full before reducing — far too big; reduce after **every** multiplication.
