**In this lesson you'll learn to:**

- write, run and understand your first C++ program;
- store values in variables and read input from the keyboard;
- make decisions with `if` and repeat work with loops;
- split a program into small functions.

**Before you start:** you need somewhere to run C++. The easiest is an online compiler such as [OnlineGDB](https://www.onlinegdb.com/online_c++_compiler): paste the code, press **Run**, and see the output. Every example below is a complete program, so the **Copy** button gives you something you can run straight away. For other options, see the **C++ Toolbox** under Resources → Extras. Run every example as you read: that's where the real learning happens.

## What is C++?

A computer's processor only understands **machine code**: long sequences of 0s and 1s. Nobody wants to write that by hand, so we write programs in a language people can read, like C++, and a program called a **compiler** translates it into machine code ([learncpp 0.2](https://www.learncpp.com/cpp-tutorial/introduction-to-programming-languages/)).

Think of the compiler as a very strict translator: it turns your instructions into something the computer can run, but it refuses to translate anything with a mistake in it, and tells you where the mistake is.

C++ is fast and gives you a lot of control, which is why it's used for games, web browsers, databases and programming contests.

## Your first program

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, world!\n";
    return 0;
}
```

Run it and you'll see `Hello, world!`. Line by line:

| Line | What it means |
| ---- | ------------- |
| `#include <iostream>` | "I want to use the input/output tools", like taking a tool box off the shelf. Needed for `std::cout`. |
| `int main()` | The **main function**: every C++ program starts running here. |
| `{` … `}` | The **body** of `main`: the instructions that run, from top to bottom. |
| `std::cout << "Hello, world!\n";` | Print the text. `\n` means "go to a new line". |
| `return 0;` | Tell the computer the program finished without problems. |

> [!TRY]
> Change the message to your own name and run it again. Then delete the `;` at the end of the `std::cout` line and run it: read the error message. Learning to read errors is half of programming.

## Statements and comments

Each instruction is called a **statement**, and most statements end with a semicolon `;` (like a full stop at the end of a sentence) ([learncpp 1.1](https://www.learncpp.com/cpp-tutorial/statements-and-the-structure-of-a-program/)).

Anything after `//` on a line is a **comment**: a note for humans that the compiler ignores. You'll see comments in every example here, explaining what the code does.

```cpp
#include <iostream>

int main()
{
    // This line is a comment: it doesn't do anything
    std::cout << "Comments are ignored\n";   // a comment can also go after code
    return 0;
}
```

> [!TIP]
> When the compiler complains about a line, also check the line **before** it. A missing `;` is usually noticed one line late.

## Variables

A **variable** is a named box that holds a value. You choose the box's name and what kind of value it holds, its **type** ([learncpp 1.3](https://www.learncpp.com/cpp-tutorial/introduction-to-objects-and-variables/)).

```cpp
#include <iostream>

int main()
{
    int age{ 20 };         // a box called age, holding the whole number 20
    std::cout << age << '\n';

    age = 21;              // put a new value in the box
    std::cout << age << '\n';

    int score{};           // empty braces: starts at 0
    score = score + 10;    // take the old value, add 10, store it back
    std::cout << score << '\n';   // 10
    return 0;
}
```

- `int age{ 20 };` **creates** the variable and gives it its first value. This is called **initialization**.
- `age = 21;` **assigns** a new value. The `=` here means "store", not "is equal to".

If a value should never change, mark it `const`. The compiler then stops you from changing it by accident:

```cpp
#include <iostream>

int main()
{
    const int daysInWeek{ 7 };
    std::cout << daysInWeek << '\n';
    // daysInWeek = 8;     // remove the // and the compiler reports an error
    return 0;
}
```

> [!WARNING]
> Always give a variable a starting value. A plain `int x;` holds whatever leftover data was in that memory, and using it makes your program behave unpredictably.

## Types of values

The **type** decides what a variable can hold ([learncpp 4.1](https://www.learncpp.com/cpp-tutorial/introduction-to-fundamental-data-types/)). The four you'll use most:

| Type | Holds | Example |
| ---- | ----- | ------- |
| `int` | whole numbers | `int count{ 5 };` |
| `double` | numbers with a decimal point | `double price{ 9.99 };` |
| `char` | a single character, in single quotes | `char grade{ 'A' };` |
| `bool` | `true` or `false` | `bool done{ false };` |

Text goes in a `std::string` (from `<string>`), written in double quotes: `std::string name{ "Ana" };`.

One surprise: dividing two `int`s gives an `int`, and the part after the decimal point is simply dropped.

```cpp
#include <iostream>

int main()
{
    int x = 7 / 2;
    std::cout << x << '\n';          // 3, not 3.5
    std::cout << 7 / 2.0 << '\n';    // 3.5: one side is a double, so the result is too
    return 0;
}
```

The **Data Types in C++** lesson goes into much more detail.

## Input and output

`std::cout` with `<<` **prints** to the screen. `std::cin` with `>>` **reads** what the user types ([learncpp 1.5](https://www.learncpp.com/cpp-tutorial/introduction-to-iostream-cout-cin-and-endl/)). The arrows point the way the data flows: out to `cout`, in from `cin`.

```cpp
#include <iostream>

int main()
{
    std::cout << "Enter your age: ";
    int age{};
    std::cin >> age;                   // waits for the user to type a number

    std::cout << "Next year you will be " << age + 1 << '\n';
    return 0;
}
```

> [!TRY]
> Ask for two numbers instead, and print their sum. (On OnlineGDB, type the input in the console at the bottom after pressing Run.)

## Making decisions with `if`

An `if` statement runs some code only when a condition is true; the optional `else` part runs when it's false ([learncpp: if statements](https://www.learncpp.com/cpp-tutorial/if-statements/)).

```cpp
#include <iostream>

int main()
{
    int age{};
    std::cin >> age;

    if (age >= 18)
    {
        std::cout << "You can vote.\n";
    }
    else
    {
        std::cout << "Not yet!\n";
    }
    return 0;
}
```

Conditions compare values:

| Operator | Means | Example (true) |
| -------- | ----- | -------------- |
| `==` | is equal to | `5 == 5` |
| `!=` | is not equal to | `5 != 3` |
| `<` / `>` | less / greater than | `3 < 5` |
| `<=` / `>=` | less / greater or equal | `5 >= 5` |

> [!WARNING]
> `=` **stores** a value and `==` **compares** two values. `if (x = 5)` is accepted by the compiler, but it sets `x` to 5 and is always true: a classic beginner bug.

> [!TRY]
> Read a number and print whether it's even or odd. Hint: `n % 2` is the remainder after dividing by 2, so it's `0` for even numbers.

## Repeating with loops

A **loop** repeats code. A `while` loop keeps going **as long as** its condition is true ([learncpp: while](https://www.learncpp.com/cpp-tutorial/introduction-to-loops-and-while-statements/)):

```cpp
#include <iostream>

int main()
{
    int count{ 1 };
    while (count <= 5)
    {
        std::cout << count << ' ';
        ++count;                 // add 1; without this, the loop would never end
    }
    std::cout << '\n';           // prints: 1 2 3 4 5
    return 0;
}
```

A `for` loop puts the three parts of a counting loop on one line ([learncpp: for](https://www.learncpp.com/cpp-tutorial/for-statements/)):

```cpp
#include <iostream>

int main()
{
    //   start      keep going while   after each round
    for (int i{ 1 }; i <= 5;            ++i)
    {
        std::cout << i * i << ' ';
    }
    std::cout << '\n';           // prints: 1 4 9 16 25
    return 0;
}
```

A `do … while` loop checks its condition **after** the body, so the body always runs **at least once**. That's handy for "ask until the answer is valid":

```cpp
#include <iostream>

int main()
{
    int n{};
    do
    {
        std::cout << "Enter a positive number: ";
        std::cin >> n;
    } while (n <= 0);            // ask again while the answer is wrong

    std::cout << "Thanks, you entered " << n << '\n';
    return 0;
}
```

Use `for` when you know how many times to repeat, and `while` when you repeat **until something happens**.

> [!TRY]
> Print all even numbers from 2 to 20 with a `for` loop. Then change it to count down from 10 to 1.

## Functions

A **function** is a named, reusable piece of code, like a recipe you can follow whenever you need it. It can take **parameters** (the ingredients) and **return** a result ([learncpp 2.1](https://www.learncpp.com/cpp-tutorial/introduction-to-functions/)).

```cpp
#include <iostream>

// int      = the type of value the function gives back
// square   = the function's name
// int x    = a parameter: the value you give the function
int square(int x)
{
    return x * x;                // send the result back
}

int main()
{
    std::cout << square(4) << '\n';   // 16
    std::cout << square(7) << '\n';   // 49
    return 0;
}
```

Calling `square(4)` runs the function with `x` set to 4, and the call is replaced by the value it returns.

> [!NOTE]
> The compiler reads your file from top to bottom, so a function must be written **before** the code that calls it. That's why `square` comes before `main`.

> [!TRY]
> Write a function `int maxOfTwo(int a, int b)` that returns the larger of two numbers, and call it from `main`.

## Going further: lists of values

A `std::vector` holds a whole list of values, and a "range-based" `for` loop visits each one in turn ([Microsoft Learn](https://learn.microsoft.com/en-us/cpp/cpp/welcome-back-to-cpp-modern-cpp)):

```cpp
#include <iostream>
#include <string>
#include <vector>

int main()
{
    std::vector<std::string> names{ "Ana", "Mihai", "Ioana" };

    for (std::string name : names)   // name takes each value in turn
    {
        std::cout << "Hello, " << name << "!\n";
    }
    return 0;
}
```

Modern C++ prefers `std::string` over old-style character arrays and `std::vector` over plain arrays: they're safer and grow as needed.

## Summary

- A C++ program starts in `main()`; statements end with `;`; `//` starts a comment.
- Variables have a name and a type; initialize them (`int x{ 5 };`) and use `const` for values that never change.
- `std::cout <<` prints and `std::cin >>` reads; you need `#include <iostream>`.
- `int / int` drops the decimals: `7 / 2` is `3`.
- `if`/`else` decides, `while`/`for`/`do … while` repeat, and functions package code you can reuse.

## Words to know

- **Compiler**: the program that translates your C++ into machine code, or reports errors.
- **Statement**: one instruction, usually ending with `;`.
- **Variable**: a named box that holds a value. **Type**: what kind of value it can hold.
- **Initialization**: giving a variable its first value when you create it.
- **Condition**: an expression that is true or false, used by `if` and loops.
- **Loop**: code that repeats. **Function**: a named, reusable piece of code; **parameter**: a value you give it; **return value**: the result it gives back.

## Next steps

1. Read the sources below for more detail and examples.
2. Solve the **Intro to C++** challenges under Practice.
3. Check yourself with the **Introduction to C++** quiz, then continue with **Data Types in C++**.
