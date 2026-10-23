"""
RAU DEV </> Software Engineering Club
Session 01 - Starting Challenge Solution
Problem: CSES 1068 - Weird Algorithm
Link: https://cses.fi/problemset/task/1068
CSES Paste: https://cses.fi/paste/f32f1ba2c3f9e940fb63c9/

Problem Summary:
Given a positive integer n:
- If n is even, divide it by 2 (n = n // 2)
- If n is odd, multiply by 3 and add 1 (n = 3 * n + 1)
Repeat until n becomes 1. Print all values of n in the sequence.

Key Engineering Takeaway:
- Even for starting inputs up to n = 10^6, intermediate values of 3n + 1 can exceed
  the 32-bit signed integer limit (2^31 - 1 ≈ 2.14 * 10^9).
- Python handles arbitrarily large integers automatically, while in C++/Java you must
  use a 64-bit integer (`long long` in C++).
"""

import sys


def solve() -> None:
    input_data = sys.stdin.read().strip()
    if not input_data:
        return

    n = int(input_data)
    sequence = [str(n)]

    while n != 1:
        if n % 2 == 0:
            n //= 2
        else:
            n = 3 * n + 1
        sequence.append(str(n))

    print(" ".join(sequence))


if __name__ == "__main__":
    solve()
