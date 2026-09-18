# Number systems & binary codes

*Digital Design 6th ed., §1.1–1.11.*

## 1. Digital systems and signals

Digital circuits work with **discrete signals**: only two voltage levels, written
`0` and `1`. One binary digit is a **bit**.

Why two levels instead of ten? Because a circuit only has to tell "powered" from
"not powered" ⇒ good noise immunity, simple parts, and Boolean algebra
(Chapter 2) describes its behaviour exactly.

## 2. Numbers in base r

A number in **base r** (radix r) uses digits `0 … r−1`, and its value comes from
**powers of r** as weights:

```
a₂a₁a₀ . a₋₁a₋₂  (base r)  =  a₂·r² + a₁·r¹ + a₀·r⁰ + a₋₁·r⁻¹ + a₋₂·r⁻²
```

Example: `(101001.1011)₂ = 32 + 8 + 1 + 0.5 + 0.125 + 0.0625 = 41.6875`

| Base | Name | Digits |
|---|---|---|
| 2 | Binary | 0, 1 |
| 8 | Octal | 0–7 |
| 10 | Decimal | 0–9 |
| 16 | Hexadecimal | 0–9, A–F |

> Notation: `(1010)₂`, `(752)₈`, `(2C6B)₁₆` — always state the base when it could
> be ambiguous. `(11)₂ = 3`, not "eleven".

## 3. Base r → decimal

Multiply each digit by its weight and add — exactly the formula above.

```
(630)₈ = 6·8² + 3·8¹ + 0·8⁰ = 384 + 24 + 0 = 408
(F3)₁₆ = 15·16 + 3 = 243
```

## 4. Decimal → base r

This is where mistakes happen, because the **integer and fractional parts use
opposite operations**.

### Integer part — divide by r repeatedly, keep the **remainders**

Read the remainders **bottom-up**.

```
41 ÷ 2 = 20  rem 1   ← LSB
20 ÷ 2 = 10  rem 0
10 ÷ 2 =  5  rem 0
 5 ÷ 2 =  2  rem 1
 2 ÷ 2 =  1  rem 0
 1 ÷ 2 =  0  rem 1   ← MSB

⇒ (41)₁₀ = (101001)₂
```

Why the remainder? Because `41 = 2·20 + 1`: the remainder *is* the units digit
(weight `r⁰`), and the quotient `20` is what is left once you shift right by one
digit.

### Fractional part — multiply by r repeatedly, keep the **integer parts**

Read the integer parts **top-down**.

```
0.6875 × 2 = 1.375  → take 1, keep 0.375
0.375  × 2 = 0.75   → take 0, keep 0.75
0.75   × 2 = 1.5    → take 1, keep 0.5
0.5    × 2 = 1.0    → take 1, keep 0  ⇒ stop

⇒ (0.6875)₁₀ = (0.1011)₂
```

Together: `(41.6875)₁₀ = (101001.1011)₂`

> **Warning:** a decimal fraction does **not** always terminate in binary.
> `0.1` becomes `0.000110011001…`, repeating forever — which is exactly why
> computers cannot represent `0.1` exactly.

## 5. Binary ↔ octal / hex: group the bits

Since `8 = 2³` and `16 = 2⁴`, these conversions **never go through decimal**:
just group bits by 3 (octal) or 4 (hex), counting **outward from the point**.

```
       10 110 001 101 011 . 111 100 000 110   (groups of 3)
        2   6   1   5   3 .  7   4   0   6
⇒ (10110001101011.111100000110)₂ = (26153.7406)₈

     10 1100 0110 1011 . 1111 0010            (groups of 4)
      2    C    6    B .    F    2
⇒ (10110001101011.11110010)₂ = (2C6B.F2)₁₆
```

Short of bits? **Pad with 0**: on the **left** for the integer part, on the
**right** for the fraction — padding there does not change the value.

Going back: each octal digit expands to exactly 3 bits, each hex digit to 4.

This is why hex is used to write long bit strings compactly: `1111 1111` is hard
to read, `FF` is not.

## 6. BCD and other decimal codes (§1.7)

People use decimal, machines use binary. A **decimal code** encodes **each
decimal digit** as a group of bits, instead of converting the whole number.

| Digit | BCD (8421) | 2421 | Excess-3 |
|---|---|---|---|
| 0 | 0000 | 0000 | 0011 |
| 1 | 0001 | 0001 | 0100 |
| 2 | 0010 | 0010 | 0101 |
| 3 | 0011 | 0011 | 0110 |
| 4 | 0100 | 0100 | 0111 |
| 5 | 0101 | 1011 | 1000 |
| 6 | 0110 | 1100 | 1001 |
| 7 | 0111 | 1101 | 1010 |
| 8 | 1000 | 1110 | 1011 |
| 9 | 1001 | 1111 | 1100 |

> **BCD is not binary.** `(185)₁₀` in BCD is `0001 1000 0101` (12 bits); in
> binary it is `10111001` (8 bits). They are completely different things.

Each 4-bit group has 16 combinations but only 10 are used; the other 6 are **invalid**.

**2421 and Excess-3 are self-complementing:** the code for `d` and the code for
`9 − d` are **1's complements** of each other, which makes decimal subtraction
circuits much simpler. BCD does **not** have this property.

### BCD addition: the +6 correction

Add two BCD digits as ordinary binary. If the sum is **greater than 9** it lands
in the 6 invalid combinations, so you must **add 0110 (+6)** and carry into the
next digit.

```
   184 + 576 = 760

   units: 4 + 6 = 10 > 9  ⇒ +6 ⇒ digit 0, carry 1
   tens:  8 + 7 + 1 = 16 > 9  ⇒ +6 ⇒ digit 6, carry 1
   hundreds: 1 + 5 + 1 = 7 ≤ 9 ⇒ unchanged ⇒ digit 7
```

Why 6? Because 4 bits count 16 values but decimal uses only 10 — adding 6
compensates for exactly that gap of 16 − 10.

## 7. ASCII (§1.8)

ASCII encodes characters in **7 bits** (128 characters): upper and lower case
letters, digits, punctuation and control characters.

```
'A' = 1000001 (65)      '0' = 0110000 (48)
'a' = 1100001 (97)      ' ' = 0100000 (32)
```

Handy: `'a' − 'A' = 32`, and `'0'` starts at 48, so converting a digit character
to its value is just subtracting 48.

## 8. Parity — error detection (§1.9)

Append **one bit** so the total number of `1`s is always even (**even parity**)
or always odd (**odd parity**).

```
'A' = 1000001  (two 1s ⇒ already even)
even parity ⇒ 1000001|0
odd  parity ⇒ 1000001|1
```

The receiver recounts the 1s; a mismatch means an error.

> **Important limit:** parity only detects an **odd** number of bit errors
> (1, 3, 5…). Two flipped bits change the count by an even amount, so parity
> still matches and the error goes **undetected**. Parity also only *detects*
> errors — it cannot *correct* them.

## 9. Registers and binary logic (§1.10–1.11)

An n-bit **register** is a group of n storage elements, one bit each. The same
register contents can be **interpreted** in many ways; only context decides:

```
01000001  →  unsigned binary 65
          →  2's complement 65
          →  the ASCII character 'A'
          →  as BCD it is invalid (0100 = 4, 0001 = 1)
```

This is the key idea of the chapter: **bits carry no meaning by themselves** —
the meaning comes from the convention you choose for reading them.

## 10. Common mistakes

- Reading the remainders **top-down** instead of bottom-up for the integer part.
- Using division on the **fractional** part (it needs multiplication).
- Forgetting to pad when grouping bits, or padding the wrong side of the fraction.
- Assuming every decimal fraction converts exactly to binary.
- Reading `(10)₂` as "ten" — it is `2`.
- Confusing **BCD with binary** (`185` needs 12 bits in BCD, only 8 in binary).
- Forgetting the **+6** correction when a BCD sum exceeds 9.
- Believing parity catches **every** error (only an odd number of bit flips).
