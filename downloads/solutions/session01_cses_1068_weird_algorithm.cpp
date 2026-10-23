/**
 * RAU DEV </> Software Engineering Club
 * Session 01 - Starting Challenge Solution (C++)
 * Problem: CSES 1068 - Weird Algorithm
 * Link: https://cses.fi/problemset/task/1068
 * CSES Paste: https://cses.fi/paste/f32f1ba2c3f9e940fb63c9/
 *
 * Complexity:
 * - Time: O(steps in Collatz sequence for n)
 * - Space: O(1) auxiliary memory
 */

#include <iostream>

int main() {
    // Fast I/O for competitive programming
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // IMPORTANT: Use 64-bit integer (long long) to prevent overflow on 3*n + 1
    long long n;
    if (!(std::cin >> n)) return 0;

    while (true) {
        std::cout << n;
        if (n == 1) break;
        std::cout << ' ';
        if (n % 2 == 0) {
            n /= 2;
        } else {
            n = 3 * n + 1;
        }
    }
    std::cout << '\n';
    return 0;
}
