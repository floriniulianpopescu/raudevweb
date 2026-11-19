## What is C++?

A computer's CPU only understands **machine code**: long sequences of 0s and 1s. Writing that by hand is impractical, so we write programs in a **high-level language** and let a tool translate them.

C++ is a **compiled** language. You write *source code* in `.cpp` files, and a **compiler** translates it into a program the computer can run directly ([learncpp 0.2](https://www.learncpp.com/cpp-tutorial/introduction-to-programming-languages/)). C++ was created by Bjarne Stroustrup as an extension of C. It is fast and gives you a lot of control, which is why it is used for games, browsers, databases and embedded devices.

```console
$ g++ -std=c++20 hello.cpp -o hello   # compile
$ ./hello                             # run
Hello, world!
```

## Your first program

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, world!\n";
    return 0;
}
```

- `#include <iostream>` brings in the input/output library, so we can use `std::cout`.
- `int main()` is the **main function**. Every program starts running here.
- The lines between `{` and `}` are the function's **body**. They run top to bottom.
- `return 0;` tells the operating system that the program finished successfully.

> [!NOTE]
> Every C++ program needs exactly one function named `main`. If execution reaches the end of `main` without a `return`, it behaves as if you wrote `return 0;` ([cppreference](https://en.cppreference.com/w/cpp/language/main_function)).

### Statements

A **statement** is one instruction, and most statements end with a semicolon `;`. Statements are grouped into **functions**, and a program is a collection of functions ([learncpp 1.1](https://www.learncpp.com/cpp-tutorial/statements-and-the-structure-of-a-program/)). Forgetting a `;` is the most common beginner compile error, so check the line *before* the one the compiler complains about.

## Variables

An **object** is a piece of memory that holds a value. An object with a name is a **variable** ([learncpp 1.3](https://www.learncpp.com/cpp-tutorial/introduction-to-objects-and-variables/)).

```cpp
int age;          // definition: create a variable called age
age = 20;         // assignment: give it a value

int year{ 2026 }; // definition + initialization in one step (preferred)
int score{};      // value-initialized to 0
```

> [!TIP]
> Always initialize variables when you create them. A plain `int x;` holds whatever garbage was in that memory, and reading it is undefined behavior.

## Fundamental data types

The **type** of a variable decides what kind of values it can hold ([learncpp 4.1](https://www.learncpp.com/cpp-tutorial/introduction-to-fundamental-data-types/)).

| Type     | Holds                              | Example                   | Typical size |
| -------- | ---------------------------------- | ------------------------- | ------------ |
| `int`    | whole numbers                      | `int count{ 5 };`         | 4 bytes      |
| `double` | numbers with a fractional part     | `double price{ 9.99 };`   | 8 bytes      |
| `char`   | a single character                 | `char grade{ 'A' };`      | 1 byte       |
| `bool`   | `true` or `false`                  | `bool done{ false };`     | 1 byte       |

Text is stored in `std::string` (from the `<string>` header). It isn't a fundamental type, but you will use it constantly.

## Input and output

`std::cout` prints to the screen with `<<`, and `std::cin` reads what the user types with `>>` ([learncpp 1.5](https://www.learncpp.com/cpp-tutorial/introduction-to-iostream-cout-cin-and-endl/)).

```cpp
#include <iostream>

int main()
{
    std::cout << "Enter your age: ";
    int age{};
    std::cin >> age;

    std::cout << "Next year you will be " << age + 1 << '\n';
    return 0;
}
```

> [!TIP]
> End lines with `'\n'` rather than `std::endl`. Both start a new line, but `std::endl` also flushes the output every time, which is slower.

## Making decisions with `if`

An `if` statement runs code only when a condition is true. The `else` part runs otherwise ([learncpp: if statements](https://www.learncpp.com/cpp-tutorial/if-statements/)).

```cpp
if (age >= 18)
{
    std::cout << "You can vote.\n";
}
else
{
    std::cout << "Not yet!\n";
}
```

Conditions use the comparison operators `==`, `!=`, `<`, `>`, `<=` and `>=`.

> [!WARNING]
> `=` **assigns** and `==` **compares**. `if (x = 5)` compiles, sets `x` to 5 and is always true. It is a classic bug.

## Repeating with loops

A `while` loop repeats as long as its condition is true ([learncpp: while](https://www.learncpp.com/cpp-tutorial/introduction-to-loops-and-while-statements/)):

```cpp
int count{ 1 };
while (count <= 5)
{
    std::cout << count << ' ';
    ++count; // without this the loop would never end
}
// prints: 1 2 3 4 5
```

A `for` loop puts the three parts of a counting loop (start, condition and step) on one line ([learncpp: for](https://www.learncpp.com/cpp-tutorial/for-statements/)):

```cpp
for (int i{ 1 }; i <= 5; ++i)
{
    std::cout << i * i << ' ';
}
// prints: 1 4 9 16 25
```

Use `for` when you know how many times to loop and `while` when you loop *until something happens*.

## Functions

A **function** is a named, reusable block of statements. It can take **parameters** and **return** a value ([learncpp 2.1](https://www.learncpp.com/cpp-tutorial/introduction-to-functions/)).

```cpp
#include <iostream>

// return type, name, parameters
int square(int x)
{
    return x * x;
}

int main()
{
    std::cout << square(4) << '\n'; // prints 16
    std::cout << square(7) << '\n'; // prints 49
    return 0;
}
```

> [!NOTE]
> The compiler reads your file from top to bottom, so a function must be declared *before* the code that calls it. That's why `square` comes before `main` here.

## Modern C++ habits

Modern C++ (C++11 and newer) gives you safer tools than the old C-style ones ([Microsoft Learn](https://learn.microsoft.com/en-us/cpp/cpp/welcome-back-to-cpp-modern-cpp)):

- `std::string` instead of `char` arrays for text
- `std::vector` instead of raw arrays for lists
- range-based `for` loops to walk through a collection
- brace initialization (`int x{ 5 };`) everywhere

```cpp
#include <iostream>
#include <string>
#include <vector>

int main()
{
    std::vector<std::string> names{ "Ana", "Mihai", "Ioana" };

    for (const std::string& name : names)
    {
        std::cout << "Hello, " << name << "!\n";
    }
    return 0;
}
```

## Next steps

1. Read the sources below for the full details and more examples.
2. Solve the **Intro to C++** challenges under Practice.
3. Check yourself with the **Introduction to C++** quiz.
