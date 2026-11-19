## Why types matter

Every variable lives in memory as a row of **bits** (0s and 1s); 8 bits make a **byte**. The **type** decides how many bytes a variable gets and how those bits are read: as a whole number, a decimal number, a letter or true/false.

With `n` bits you can store 2ⁿ different values. An `int` usually has 32 bits, so it can hold 2³² ≈ 4.3 billion values, split between negatives and positives. That is why an `int` stops at about **2.1 billion**: not a lot when you add up a million numbers.

```cpp
#include <iostream>

int main()
{
    std::cout << sizeof(int) << '\n';        // 4 (bytes) on most computers
    std::cout << sizeof(long long) << '\n';  // 8
    std::cout << sizeof(char) << '\n';       // always 1
    return 0;
}
```

Choosing the wrong type rarely gives a compile error. It gives **wrong answers** that look fine on small tests, which is why it's one of the most common reasons for a "Wrong answer" verdict ([USACO Guide](https://usaco.guide/general/data-types)).

## Integers

| Type | Size (typical) | Range (typical) | Use it for |
| ---- | -------------- | --------------- | ---------- |
| `short` | 2 bytes | −32,768 to 32,767 | rarely needed |
| `int` | 4 bytes | about ±2.1·10⁹ | counts, indices, most values |
| `long long` | 8 bytes | about ±9.2·10¹⁸ | sums, products, anything above 2·10⁹ |

`long` is 4 bytes on Windows but 8 on Linux, so don't rely on it: use `long long` when you need 64 bits ([learncpp 4.4](https://www.learncpp.com/cpp-tutorial/signed-integers/)). The exact sizes are listed on [cppreference](https://en.cppreference.com/w/cpp/language/types); `<cstdint>` also has fixed-size types such as `std::int64_t` ([learncpp 4.6](https://www.learncpp.com/cpp-tutorial/fixed-width-integers-and-size-t/)).

### Overflow

When a result doesn't fit in its type, it **overflows**. For signed types like `int`, that's *undefined behaviour*: in practice you usually get a nonsense value, often negative.

```cpp
int a{ 50000 };
int square = a * a;              // 2,500,000,000 doesn't fit: typically prints -1794967296

long long b{ 50000 };
long long ok = b * b;            // 2500000000
```

> [!WARNING]
> `long long x = a * a;` is **still wrong** when `a` is an `int`: the multiplication happens in `int` first and only the (already broken) result is stored in `x`. Make one operand `long long` *before* multiplying: `1LL * a * a` or `static_cast<long long>(a) * a`.

> [!TIP]
> Read the limits. If values go up to 10⁹ and you **add** many of them, or **multiply** two of them, use `long long`. When the answer can exceed 10¹⁸, even `long long` isn't enough: the problem usually asks for it modulo some number.

### Unsigned integers

`unsigned int` can't be negative: it trades the negative half for a bigger positive range. Going below zero doesn't stop at 0, it **wraps around** to a huge number ([learncpp 4.5](https://www.learncpp.com/cpp-tutorial/unsigned-integers-and-why-to-avoid-them/)):

```cpp
std::vector<int> v;                       // empty
std::cout << v.size() - 1 << '\n';        // not -1: 18446744073709551615

// Safe: turn the size into an int first
int n = static_cast<int>(v.size());
for (int i = 0; i < n - 1; ++i) { /* … */ }
```

`.size()` returns an unsigned type, which is where this bites. Keep counters and indices as `int` (or `long long`).

## Division and remainder

Dividing two integers gives an integer: the fraction is **cut off**, towards zero.

```cpp
std::cout << 7 / 2 << '\n';     // 3
std::cout << -7 / 2 << '\n';    // -3
std::cout << 7 % 3 << '\n';     // 1   (remainder)
std::cout << -7 % 3 << '\n';    // -1  (takes the sign of the left side)

std::cout << 7 / 2.0 << '\n';                     // 3.5: one side is a double
std::cout << static_cast<double>(7) / 2 << '\n';  // 3.5
```

To **round up** a division of positive integers, don't use floating point: `(a + b - 1) / b`. For example, 10 tiles of size 3 need `(10 + 3 - 1) / 3 = 4` tiles.

## Floating point

`double` stores numbers with a fractional part, with about **15–16 significant digits**. `float` has only about 7, so prefer `double` ([learncpp 4.8](https://www.learncpp.com/cpp-tutorial/floating-point-numbers/)).

Most decimal fractions, like 0.1, can't be stored exactly in binary, so tiny rounding errors appear ([The Floating-Point Guide](https://floating-point-gui.de/)):

```cpp
#include <cmath>
#include <iomanip>
#include <iostream>

double x = 0.1 + 0.2;
std::cout << std::setprecision(17) << x << '\n';    // 0.30000000000000004
std::cout << (x == 0.3) << '\n';                    // 0 (false!)
std::cout << (std::abs(x - 0.3) < 1e-9) << '\n';    // 1: compare with a tolerance

std::cout << std::fixed << std::setprecision(2) << 3.14159 << '\n';   // 3.14
```

> [!WARNING]
> Never compare `double`s with `==`. Check whether they are *close enough* (`std::abs(a - b) < 1e-9`). And don't use floating point for exact things like money or counting: store cents in a `long long` instead.

## Characters

A `char` is a 1-byte integer that stands for a character. The mapping is the **ASCII** table: `'A'` is 65, `'a'` is 97, `'0'` is 48 ([learncpp 4.11](https://www.learncpp.com/cpp-tutorial/chars/), [ASCII chart](https://en.cppreference.com/w/cpp/language/ascii)). The letters and the digits are in order, so you can do maths with them:

```cpp
char d{ '7' };
int digit = d - '0';                 // 7: the digit's value

char c{ 'e' };
int position = c - 'a';              // 4: 'e' is the 5th letter (counting from 0)
char upper = c - 'a' + 'A';          // 'E'

std::cout << 'a' + 1 << '\n';                       // 98: char + int is an int
std::cout << static_cast<char>('a' + 1) << '\n';    // b
```

`<cctype>` has the common checks and conversions: `std::isdigit`, `std::isalpha`, `std::isupper`, `std::islower`, `std::toupper`, `std::tolower`.

## bool

`bool` holds `true` or `false`, and prints as `1` or `0` (`std::boolalpha` prints the words). Numbers convert to `bool` too: `0` is `false`, anything else is `true`.

```cpp
bool even = (10 % 2 == 0);
std::cout << even << '\n';                       // 1
std::cout << std::boolalpha << even << '\n';     // true
```

## Converting between types

C++ converts between number types automatically, but some conversions lose information ([learncpp 10.6](https://www.learncpp.com/cpp-tutorial/explicit-type-conversion-casting-and-static-cast/)):

```cpp
double price{ 3.99 };
int whole = static_cast<int>(price);     // 3: the fraction is cut off, not rounded
long long rounded = std::llround(price); // 4: rounds to the nearest (from <cmath>)

int x{ 3.5 };                            // compile error: brace initialization blocks losing data
```

Use `static_cast<Type>(value)` to convert on purpose; it's easy to search for and shows the reader you meant it.

### auto and const

`auto` lets the compiler pick the type from the value ([learncpp 10.8](https://www.learncpp.com/cpp-tutorial/type-deduction-for-objects-using-the-auto-keyword/)). Watch the literal: `5` is an `int`, `5LL` a `long long`, `5.0` a `double`.

```cpp
auto count = 5;          // int
auto big = 5LL;          // long long
auto ratio = 5.0;        // double
const int maxN = 200000; // const: can't be changed later
```

## Strings

`std::string` (from `<string>`) holds text of any length ([learncpp 5.7](https://www.learncpp.com/cpp-tutorial/introduction-to-stdstring/)). Each character is a `char`, so everything above applies.

```cpp
#include <iostream>
#include <string>

int main()
{
    std::string s{ "Hello" };
    s += ", world";                          // append
    std::cout << s.size() << '\n';           // 12
    std::cout << s[0] << '\n';               // H
    std::cout << s.substr(7, 5) << '\n';     // world

    int n = std::stoi("123");                // text → number
    std::string t = std::to_string(456);     // number → text

    std::string word;
    std::cin >> word;                        // reads one word
    std::string line;
    std::getline(std::cin >> std::ws, line); // reads a whole line (skipping leftover spaces)
    return 0;
}
```

`==` and `<` work on strings: `<` compares them alphabetically (by ASCII code, so `"Z" < "a"`).

## Choosing a type

| You need | Use |
| -------- | --- |
| a count, an index, small whole numbers | `int` |
| big sums, products, values above 2·10⁹ | `long long` |
| numbers with a fractional part | `double` |
| one character | `char` |
| yes / no | `bool` |
| text | `std::string` |

## Next steps

1. Read the sources below for more detail and examples.
2. Solve the **Data Types: Numbers** challenge, then **Data Types: Characters & Strings**, under Practice.
3. Check yourself with the **Data Types in C++** quiz.
