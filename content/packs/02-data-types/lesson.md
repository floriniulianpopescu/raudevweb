**Before you start:** you should know how to write a small program with variables, `if` and loops (the **Introduction to C++** lesson).

**In this lesson you'll learn to:**

- pick the right type for a value, and know why it matters;
- avoid the three classic number bugs: overflow, integer division and decimal rounding;
- work with characters and text.

Every example is a complete program: copy it into an online compiler such as [OnlineGDB](https://www.onlinegdb.com/online_c++_compiler) and run it.

## The quick answer

If you remember one thing from this lesson, make it this table. The rest of the lesson explains why.

| You need | Use | Example |
| -------- | --- | ------- |
| a count, an index, a small whole number | `int` | `int students{ 30 };` |
| a big whole number (above 2 billion), a big sum or product | `long long` | `long long total{ 0 };` |
| a number with a decimal point | `double` | `double price{ 9.99 };` |
| one character | `char` | `char grade{ 'A' };` |
| yes / no | `bool` | `bool found{ false };` |
| text | `std::string` | `std::string name{ "Ana" };` |

Choosing the wrong type rarely gives a compile error. Instead the program gives **wrong answers** that look fine on small tests, which is why it's one of the most common reasons for a "Wrong answer" in contests ([USACO Guide](https://usaco.guide/general/data-types)).

## Whole numbers: int and long long

A variable takes up a fixed amount of memory, so it can only hold numbers up to a certain size. Think of a car's odometer with a fixed number of digits: after 999999 km it rolls over to 000000.

- An `int` goes up to about **2.1 billion** (2,147,483,647).
- A `long long` goes up to about **9.2 billion billion** (9.2·10¹⁸).

```cpp
#include <iostream>
#include <limits>

int main()
{
    std::cout << std::numeric_limits<int>::max() << '\n';         // 2147483647
    std::cout << std::numeric_limits<long long>::max() << '\n';   // 9223372036854775807
    return 0;
}
```

### Overflow

When a result is too big for its type, it **overflows**: like the odometer, the number "wraps around", and you get a wrong, often negative, value ([learncpp 4.4](https://www.learncpp.com/cpp-tutorial/signed-integers/)).

```cpp
#include <iostream>

int main()
{
    int a{ 50000 };
    int square = a * a;                 // 2,500,000,000 is too big for an int
    std::cout << square << '\n';        // prints a wrong number, usually -1794967296

    long long b{ 50000 };
    long long ok = b * b;               // long long has room for it
    std::cout << ok << '\n';            // 2500000000
    return 0;
}
```

> [!WARNING]
> `long long x = a * a;` is **still wrong** when `a` is an `int`. The multiplication happens first, in `int`, and only the broken result is stored in `x`. Make the calculation itself use `long long`: `long long x = 1LL * a * a;` (`1LL` is the number 1 as a `long long`).

> [!TIP]
> Look at the limits in the problem. If values go up to 10⁹ (a billion) and you **add up** many of them, or **multiply** two of them, use `long long`.

> [!TRY]
> Add up all the numbers from 1 to 100,000 with a loop, once with an `int` total and once with a `long long` total. Which one is right? (The correct answer is 5000050000.)

## Dividing numbers

Dividing two whole numbers gives a whole number. It's like sharing 7 sweets between 2 children: each gets **3**, and **1** is left over.

- `/` gives how many each gets: `7 / 2` is `3` (the decimals are dropped, not rounded).
- `%` gives what's left over, called the **remainder**: `7 % 2` is `1`.

```cpp
#include <iostream>

int main()
{
    std::cout << 7 / 2 << '\n';      // 3
    std::cout << 7 % 2 << '\n';      // 1
    std::cout << 10 % 5 << '\n';     // 0: 10 divides evenly by 5

    std::cout << 7 / 2.0 << '\n';    // 3.5: one side has a decimal point, so the result does too
    return 0;
}
```

`%` is very useful: `n % 2 == 0` means `n` is even, and `n % 10` is the last digit of `n`.

To **round up** instead, for example "how many boxes of 3 do I need for 10 items?", use `(a + b - 1) / b`: `(10 + 3 - 1) / 3` is `4`. It avoids decimals entirely.

> [!TRY]
> Read a number and print its last digit and the number without its last digit (for 1234: `4` and `123`).

## Decimal numbers: double

A `double` holds numbers with a decimal point, with about 15 to 16 significant digits ([learncpp 4.8](https://www.learncpp.com/cpp-tutorial/floating-point-numbers/)). There is also `float`, but it's much less precise, so use `double`.

Computers store numbers in binary (base 2), and most decimal fractions, like 0.1, can't be written exactly in binary, the same way 1/3 can't be written exactly in decimal (0.3333…). So tiny rounding errors creep in ([The Floating-Point Guide](https://floating-point-gui.de/)):

```cpp
#include <cmath>
#include <iomanip>
#include <iostream>

int main()
{
    double x = 0.1 + 0.2;
    std::cout << (x == 0.3) << '\n';                      // 0, meaning false!
    std::cout << std::setprecision(17) << x << '\n';      // 0.30000000000000004

    // Compare by checking that the difference is tiny instead
    std::cout << (std::abs(x - 0.3) < 1e-9) << '\n';      // 1, meaning true

    // Printing with exactly 2 digits after the point
    std::cout << std::fixed << std::setprecision(2) << 3.14159 << '\n';   // 3.14
    return 0;
}
```

> [!WARNING]
> Don't compare `double`s with `==`. Check that they're *close enough*: `std::abs(a - b) < 1e-9` (`1e-9` is 0.000000001). And don't use decimals for exact things like money: count cents in a `long long` instead.

## Characters: char

A `char` holds one character, written in **single** quotes: `'a'`, `'7'`, `'?'`. Behind the scenes each character is stored as a number, using a table called **ASCII**: `'A'` is 65, `'a'` is 97, `'0'` is 48 ([learncpp 4.11](https://www.learncpp.com/cpp-tutorial/chars/), [ASCII chart](https://en.cppreference.com/w/cpp/language/ascii)).

Letters and digits are numbered in order, so you can do maths with them:

```cpp
#include <iostream>

int main()
{
    char d{ '7' };
    int digit = d - '0';                      // '7' - '0' = 55 - 48 = 7
    std::cout << digit << '\n';               // 7

    char c{ 'e' };
    std::cout << c - 'a' << '\n';             // 4: e is 4 letters after a

    char upper = c - 'a' + 'A';               // the same position, but in capitals
    std::cout << upper << '\n';               // E

    std::cout << 'a' + 1 << '\n';                       // 98: char + number gives a number
    std::cout << static_cast<char>('a' + 1) << '\n';    // b: turn it back into a char
    return 0;
}
```

The `<cctype>` header has ready-made helpers: `std::isdigit(c)`, `std::isalpha(c)`, `std::isupper(c)`, `std::islower(c)`, `std::toupper(c)` and `std::tolower(c)`.

> [!TRY]
> Read a word and print it in capital letters, using the `c - 'a' + 'A'` trick on each lowercase letter.

## true or false: bool

A `bool` holds `true` or `false`. When printed, it shows `1` or `0` (`std::boolalpha` prints the words instead).

```cpp
#include <iostream>

int main()
{
    bool even = (10 % 2 == 0);
    std::cout << even << '\n';                       // 1
    std::cout << std::boolalpha << even << '\n';     // true
    return 0;
}
```

## Text: std::string

A `std::string` holds text of any length, written in **double** quotes ([learncpp 5.7](https://www.learncpp.com/cpp-tutorial/introduction-to-stdstring/)). Each character in it is a `char`, so everything above applies.

```cpp
#include <iostream>
#include <string>

int main()
{
    std::string s{ "Hello" };
    s += ", world";                          // add text to the end
    std::cout << s << '\n';                  // Hello, world
    std::cout << s.size() << '\n';           // 12 characters
    std::cout << s[0] << '\n';               // H: positions start at 0
    std::cout << s.substr(7, 5) << '\n';     // world: 5 characters starting at position 7

    int n = std::stoi("123");                // text → number
    std::string t = std::to_string(456);     // number → text
    std::cout << n + 1 << ' ' << t + "!" << '\n';   // 124 456!
    return 0;
}
```

- `std::cin >> word;` reads **one word** (it stops at a space).
- `std::getline(std::cin, line);` reads a **whole line**, spaces included.

> [!WARNING]
> After reading a number with `std::cin >>`, the Enter key is still waiting in the input, and the next `getline` reads an empty line. Write `std::getline(std::cin >> std::ws, line);` instead: `std::ws` skips that leftover Enter and any spaces.

## Converting between types

C++ converts between number types automatically, but some conversions lose information. To convert on purpose, use `static_cast<type>(value)` ([learncpp 10.6](https://www.learncpp.com/cpp-tutorial/explicit-type-conversion-casting-and-static-cast/)):

```cpp
#include <cmath>
#include <iostream>

int main()
{
    double price{ 3.99 };
    int whole = static_cast<int>(price);       // 3: the decimals are cut off, not rounded
    long long rounded = std::llround(price);   // 4: rounded to the nearest whole number
    std::cout << whole << ' ' << rounded << '\n';

    int a{ 7 };
    int b{ 2 };
    std::cout << static_cast<double>(a) / b << '\n';   // 3.5: convert before dividing

    // int x{ 3.99 };   // remove the // and the compiler refuses: braces don't allow losing data
    return 0;
}
```

## Going further

These details matter less often, but explain some surprises you'll meet.

**Why "about 2 billion"?** Memory is made of **bits** (0 or 1); 8 bits make a **byte**. An `int` usually has 32 bits, and 32 bits can form 2³² ≈ 4.3 billion patterns, split between negative and positive numbers. A `long long` has 64 bits. `sizeof(int)` tells you the size in bytes ([cppreference](https://en.cppreference.com/w/cpp/language/types)).

**Unsigned numbers.** `unsigned int` can't be negative. Going below zero doesn't stop at 0: it wraps around to a huge number. The `.size()` of a string or vector is unsigned, so on an empty vector `v.size() - 1` is not -1 but 18446744073709551615 ([learncpp 4.5](https://www.learncpp.com/cpp-tutorial/unsigned-integers-and-why-to-avoid-them/)). Convert it first: `int n = static_cast<int>(v.size());`.

**auto.** `auto` lets the compiler work out the type from the value ([learncpp 10.8](https://www.learncpp.com/cpp-tutorial/type-deduction-for-objects-using-the-auto-keyword/)): `auto x = 5;` is an `int`, `auto y = 5LL;` a `long long`, `auto z = 5.0;` a `double`.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::cout << sizeof(int) << ' ' << sizeof(long long) << '\n';   // 4 8 on most computers

    std::vector<int> v;                                  // empty
    std::cout << v.size() - 1 << '\n';                   // 18446744073709551615, not -1
    int n = static_cast<int>(v.size());
    std::cout << n - 1 << '\n';                          // -1, as expected

    auto big = 5LL;                                      // long long
    std::cout << big * 1000000000 << '\n';               // 5000000000
    return 0;
}
```

## Summary

- `int` for normal whole numbers, `long long` once values can pass about 2 billion.
- An overflowing number doesn't stop you: it silently becomes wrong. Watch sums and products.
- `int / int` drops the decimals, `%` gives the remainder, and `(a + b - 1) / b` rounds up.
- `double`s are slightly imprecise: compare them with a tolerance, never `==`.
- A `char` is a small number from the ASCII table, so `c - '0'` and `c - 'a'` work.
- `std::string` holds text; `getline` reads a whole line.

## Words to know

- **Type**: what kind of value a variable holds, and how much memory it takes.
- **Overflow**: a result too big for its type, which turns into a wrong value.
- **Remainder**: what's left over after whole-number division (`%`).
- **Floating point**: the way `double` stores decimal numbers, approximately.
- **ASCII**: the table that gives every character a number.
- **Cast**: converting a value to another type on purpose (`static_cast`).

## Next steps

1. Read the sources below for more detail and examples.
2. Solve the **Data Types: Numbers** challenge, then **Data Types: Characters & Strings**, under Practice.
3. Check yourself with the **Data Types in C++** quiz, then continue with **Introduction to Algorithms**.
