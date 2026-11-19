**Before you start:** you should know variables, functions and `std::vector` (the **Introduction to C++** and **Data Types in C++** lessons). Pointers have a reputation for being hard; take this lesson slowly and run every example.

**In this lesson you'll learn to:**

- explain what a memory address is, and get one with `&`;
- create a pointer, follow it with `*`, and use `nullptr` safely;
- use references, and choose between passing by value, by reference and by pointer;
- follow a chain of pointers, the idea behind linked lists;
- recognise the three classic pointer bugs.

Every example is a complete program: copy it into an online compiler such as [OnlineGDB](https://www.onlinegdb.com/online_c++_compiler) and run it. To *see* pointers as arrows, paste the examples into [Python Tutor's C++ visualizer](https://pythontutor.com/cpp.html) and step through them.

## Memory and addresses

Picture the computer's memory as a very long street of houses. Every house has a **number** (its **address**) and something **inside** it (a value). When you create a variable, the computer gives it a house:

| Variable | Address (house number) | Value (what's inside) |
| -------- | ---------------------- | --------------------- |
| `age` | 1000 | 20 |
| `score` | 1004 | 7 |

Real addresses are long numbers, usually shown in **hexadecimal** (base 16, written with `0x` in front). The `&` operator gives you a variable's address:

```cpp
#include <iostream>

int main()
{
    int age{ 20 };
    std::cout << age << '\n';     // 20: the value inside the house
    std::cout << &age << '\n';    // the house number, something like 0x7ffd5e8c1a2c
    return 0;
}
```

The address is different on every computer, and often on every run. That's fine: what matters is that each variable has one.

## Pointers

A **pointer** is a variable that holds an address. Think of it as a note with a house number written on it: it isn't the house, it tells you where to find the house ([learncpp 12.7](https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/)).

- `int* p` declares a pointer to an `int` (the `*` here means "pointer to").
- `p = &age` writes `age`'s address on the note.
- `*p` means "go to that address": you can read or change the value there. This is called **dereferencing**.

```cpp
#include <iostream>

int main()
{
    int age{ 20 };
    int* p{ &age };               // p holds the address of age

    std::cout << *p << '\n';      // 20: go to the address and read the value

    *p = 21;                      // go to the address and change the value
    std::cout << age << '\n';     // 21: age itself changed!
    return 0;
}
```

Step by step:

| Line | `age` | `p` | `*p` |
| ---- | ----- | --- | ---- |
| `int age{ 20 };` | 20 | (doesn't exist yet) | |
| `int* p{ &age };` | 20 | the address of `age` | 20 |
| `*p = 21;` | **21** | the address of `age` | 21 |

> [!NOTE]
> The `*` symbol has two jobs. In a **declaration** (`int* p`) it means "p is a pointer". Everywhere else (`*p = 21`) it means "go to the address p holds". Likewise, `&` before a variable (`&age`) means "the address of".

> [!TRY]
> Create a `double price{ 9.99 };`, a pointer to it, and use only the pointer to double the price. Print `price` to check.

## nullptr: pointing to nothing

Sometimes a pointer has no address to hold yet. Then set it to **`nullptr`**, which means "points to nothing", and check before using it ([learncpp 12.8](https://www.learncpp.com/cpp-tutorial/null-pointers/)):

```cpp
#include <iostream>

int main()
{
    int* p{ nullptr };            // no address yet

    if (p == nullptr)
        std::cout << "p points to nothing\n";

    int x{ 5 };
    p = &x;                       // now it points to x
    if (p != nullptr)
        std::cout << *p << '\n';  // 5
    return 0;
}
```

> [!WARNING]
> Never use `*p` when `p` is `nullptr`: there's no house at that address, and the program usually crashes. Check first.

## References: a second name

A **reference** is another name for a variable that already exists, like a nickname: "Alexandru" and "Alex" are the same person ([learncpp 12.3](https://www.learncpp.com/cpp-tutorial/lvalue-references/)). You declare it with `&` after the type:

```cpp
#include <iostream>

int main()
{
    int score{ 7 };
    int& s{ score };              // s is another name for score

    s = 10;                       // changes score: they're the same box
    std::cout << score << '\n';   // 10
    std::cout << (&s == &score) << '\n';   // 1: same address
    return 0;
}
```

References are simpler than pointers: no `*` to follow them, they can't be `nullptr`, and once created they always refer to the same variable. But they **must** be given a variable when created: `int& r;` on its own doesn't compile.

## Passing values to functions

This is where pointers and references really pay off. Here's a `swap` function written three ways:

```cpp
#include <iostream>

void swapCopy(int a, int b)       // by value: a and b are COPIES
{
    int temp{ a };
    a = b;
    b = temp;                     // only the copies are swapped
}

void swapRef(int& a, int& b)      // by reference: a and b ARE the caller's variables
{
    int temp{ a };
    a = b;
    b = temp;
}

void swapPtr(int* a, int* b)      // by pointer: a and b hold the caller's addresses
{
    int temp{ *a };
    *a = *b;
    *b = temp;
}

int main()
{
    int x{ 1 }, y{ 2 };

    swapCopy(x, y);
    std::cout << x << ' ' << y << '\n';   // 1 2: nothing changed

    swapRef(x, y);
    std::cout << x << ' ' << y << '\n';   // 2 1: swapped

    swapPtr(&x, &y);                      // pass the addresses
    std::cout << x << ' ' << y << '\n';   // 1 2: swapped back
    return 0;
}
```

| Style | Function header | Call | Can change the caller's variable? |
| ----- | --------------- | ---- | -------------------------------- |
| by value | `void f(int n)` | `f(x)` | no: it works on a copy |
| by reference | `void f(int& n)` | `f(x)` | yes |
| by pointer | `void f(int* n)` | `f(&x)` | yes, using `*n` |

In C++, **prefer references**; use pointers when "nothing" (`nullptr`) is a valid value ([learncpp 12.5](https://www.learncpp.com/cpp-tutorial/pass-by-lvalue-reference/), [12.10](https://www.learncpp.com/cpp-tutorial/pass-by-address/)).

### Why const std::vector<int>&?

Passing a big vector **by value** copies every element, which is slow for a million numbers. Passing it **by reference** avoids the copy. Adding `const` promises that the function won't change it, and the compiler holds you to that promise ([learncpp 12.6](https://www.learncpp.com/cpp-tutorial/pass-by-const-lvalue-reference/)). That's why the algorithms lesson wrote `const std::vector<int>& v`:

```cpp
#include <iostream>
#include <vector>

long long sum(const std::vector<int>& v)    // no copy, and v can't be changed here
{
    long long total{ 0 };
    for (int x : v)
        total += x;
    // v[0] = 5;                            // remove the // and the compiler refuses: v is const
    return total;
}

void addOneToAll(std::vector<int>& v)       // no const: this function is meant to change v
{
    for (int& x : v)                        // int& x: each x is a reference to an element
        x += 1;
}

int main()
{
    std::vector<int> numbers{ 1, 2, 3 };
    addOneToAll(numbers);
    std::cout << sum(numbers) << '\n';      // 9: (2 + 3 + 4)
    return 0;
}
```

> [!TIP]
> A simple rule: small values like `int`, `double` and `char` go **by value**. Strings, vectors and other big things go by **`const` reference**, or by plain reference when the function should change them.

> [!TRY]
> Write `void doubleIt(int& n)` that doubles its argument, and check that `x` really changes after `doubleIt(x);`. Then remove the `&` and see what happens.

## Arrays and pointers

A plain array's elements sit next to each other in memory, like houses in a row. The array's name can be used as a pointer to its **first** element, and adding 1 to a pointer moves it to the **next element** (not the next byte) ([learncpp 17.8](https://www.learncpp.com/cpp-tutorial/c-style-array-decay/), [17.9](https://www.learncpp.com/cpp-tutorial/pointer-arithmetic-and-subscripting/)):

```cpp
#include <iostream>

int main()
{
    int arr[4]{ 10, 20, 30, 40 };
    int* p{ arr };                     // points to arr[0]

    std::cout << *p << '\n';           // 10
    std::cout << *(p + 1) << '\n';     // 20: one element further
    std::cout << p[2] << '\n';         // 30: p[2] means *(p + 2)

    for (int* q = arr; q != arr + 4; ++q)   // walk the array with a pointer
        std::cout << *q << ' ';
    std::cout << '\n';                 // 10 20 30 40
    return 0;
}
```

This is how `v[i]` works behind the scenes: start at the first element and move `i` places.

> [!WARNING]
> Nothing stops a pointer from walking past the end of an array. `arr[10]` on a 4-element array reads someone else's house: wrong values or a crash. Keep track of the size.

## Following pointers: a chain

A `struct` can contain a pointer to another `struct` of the same kind, so values can point to each other in a chain, like a treasure hunt where every clue says where the next one is. This is the idea behind **linked lists** (in the Data Structures lesson).

When you have a pointer to a struct, `p->value` means "the `value` of the struct `p` points to". It's a shorter way of writing `(*p).value`.

```cpp
#include <iostream>

struct Node
{
    int value;
    Node* next;                   // the next node in the chain, or nullptr at the end
};

int main()
{
    Node third{ 3, nullptr };
    Node second{ 2, &third };     // second points to third
    Node first{ 1, &second };     // first points to second

    for (Node* p = &first; p != nullptr; p = p->next)   // follow the chain
        std::cout << p->value << ' ';
    std::cout << '\n';            // 1 2 3
    return 0;
}
```

| Step | `p` points to | `p->value` | `p->next` |
| ---- | ------------- | ---------- | --------- |
| 1 | `first` | 1 | `&second` |
| 2 | `second` | 2 | `&third` |
| 3 | `third` | 3 | `nullptr`, so the loop stops |

> [!TRY]
> Add a fourth node with the value 4 at the end of the chain. Which pointer has to change?

## Common pointer bugs

| Bug | What happens | How to avoid it |
| --- | ------------ | --------------- |
| **Uninitialized pointer**: `int* p;` then `*p` | `p` holds a random address: crash or corrupted data | always initialize: `int* p{ nullptr };` |
| **Null pointer**: `*p` when `p` is `nullptr` | crash | check `if (p != nullptr)` first |
| **Dangling pointer**: pointing to a variable that no longer exists | reads garbage, or crashes later | don't keep pointers to variables that have ended |

A variable created inside a function stops existing when the function returns. A pointer to it would be **dangling**: still holding the house number of a house that has been demolished ([learncpp 12.12](https://www.learncpp.com/cpp-tutorial/return-by-reference-and-return-by-address/)).

```cpp
#include <iostream>

// int* broken()
// {
//     int local{ 42 };
//     return &local;      // WRONG: local disappears when the function ends
// }

int fixed()
{
    int local{ 42 };
    return local;          // right: return the value itself (a copy)
}

int main()
{
    std::cout << fixed() << '\n';   // 42
    return 0;
}
```

> [!TIP]
> Turn on compiler warnings (`-Wall`). The compiler spots many of these bugs, like returning the address of a local variable, and warns you.

## Going further

- **`const` and pointers**: `const int* p` means "you can't change the value through `p`"; `int* const p` means "`p` itself can't point elsewhere". Read it right to left.
- **Pointers to pointers**: `int** pp` holds the address of a pointer. You'll meet them rarely.
- **Creating values that outlive a function**: `new` creates a value that lives until you `delete` it. The Data Structures lesson uses this to build a linked list. Modern C++ usually lets **smart pointers** (`std::unique_ptr`) or containers like `std::vector` do the deleting for you.
- The exact rules are on cppreference: [pointers](https://en.cppreference.com/w/cpp/language/pointer) and [references](https://en.cppreference.com/w/cpp/language/reference).

## Summary

- Every variable lives at an **address**; `&x` gives it.
- A **pointer** holds an address: `int* p{ &x };`. `*p` reads or changes the value it points to. `nullptr` means "points to nothing".
- A **reference** is another name for an existing variable: `int& r{ x };`. No `*` needed, never null.
- Pass small values by value, big ones by `const` reference, and use a reference (or pointer) when the function should change the caller's variable.
- An array's name acts as a pointer to its first element; `p + 1` is the next element.
- Watch out for uninitialized, null and dangling pointers.

## Words to know

- **Address**: where a variable lives in memory (its house number).
- **Pointer**: a variable that holds an address.
- **Dereference**: follow a pointer to its value, with `*p` (or `p->field` for structs).
- **nullptr**: the value of a pointer that points to nothing.
- **Reference**: another name for an existing variable.
- **Pass by value / reference / pointer**: give a function a copy / the variable itself / its address.
- **Dangling pointer**: a pointer to something that no longer exists.

## Next steps

1. Read the sources below, and step through the examples in [Python Tutor](https://pythontutor.com/cpp.html) to see the arrows.
2. Solve the **Pointers & References: Basics** challenge, then **Pointers & References: Linked Lists**, under Practice.
3. Check yourself with the **Pointers & References** quiz, then continue with **Data Structures**.
