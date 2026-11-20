**Before you start:** you should be comfortable with variables, loops, functions and `std::vector` (the **Introduction to C++** and **Data Types in C++** lessons).

**In this lesson you'll learn to:**

- say what an algorithm is and what makes one good;
- estimate how fast a program is, and whether it's fast enough, using Big-O;
- search a list quickly with binary search, and sort it;
- write a function that calls itself (recursion).

Every example is a complete program: copy it into an online compiler such as [OnlineGDB](https://www.onlinegdb.com/online_c++_compiler) and run it.

## What is an algorithm?

An **algorithm** is a list of exact steps that solves a problem. A recipe is an algorithm for a cake; a program is an algorithm written so a computer can follow it ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/intro-to-algorithms/a/what-is-an-algorithm)).

A good algorithm is:

- **correct**: it gives the right answer for *every* valid input, even unusual ones like an empty list;
- **finite**: it always stops;
- **efficient**: it's fast enough, even for the biggest inputs.

Here's a small one: find the largest number in a list. The steps: remember the first number; look at each number in turn; if it's bigger than the one you remember, remember it instead.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> numbers{ 4, 17, 3, 9, 12 };

    int largest{ numbers[0] };          // step 1: remember the first number
    for (int x : numbers)               // step 2: look at each number
    {
        if (x > largest)                // step 3: bigger? remember it instead
            largest = x;
    }

    std::cout << largest << '\n';       // 17
    return 0;
}
```

> [!TRY]
> Change the program to find the **smallest** number. Then make it also print *where* the smallest number is (its position in the list).

## How fast is it? Big-O

Imagine looking up "Popescu" in a 1,000-page phone book. Reading every page from the start could take 1,000 page-turns. Opening it in the middle, seeing whether "Popescu" comes before or after, and repeating with the right half takes only about 10. Both methods work; one is far faster, and the gap grows as the book gets bigger.

**Big-O** describes exactly that: **how the amount of work grows when the input grows**. We count steps, and we only care about the general shape, so `3n + 5` steps is written **O(n)** ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation)).

| Big-O | Name | Steps for n = 1,000 | Steps for n = 1,000,000 | Typical code |
| ----- | ---- | ------------------- | ----------------------- | ------------ |
| O(1) | constant | 1 | 1 | read `v[0]` |
| O(log n) | logarithmic | 10 | 20 | halve the problem each step |
| O(n) | linear | 1,000 | 1,000,000 | one loop over the data |
| O(n²) | quadratic | 1,000,000 | 1,000,000,000,000 | a loop inside a loop |

This program counts the steps of each kind of loop, so you can see the table come true:

```cpp
#include <iostream>

int main()
{
    int n{ 1000 };

    long long single{ 0 };
    for (int i = 0; i < n; ++i)              // O(n): one pass
        ++single;

    long long nested{ 0 };
    for (int i = 0; i < n; ++i)              // O(n²): a loop inside a loop
        for (int j = 0; j < n; ++j)
            ++nested;

    long long halving{ 0 };
    for (int m = n; m > 1; m /= 2)           // O(log n): halve each time
        ++halving;

    std::cout << single << ' ' << nested << ' ' << halving << '\n';   // 1000 1000000 9
    return 0;
}
```

### Is it fast enough?

A computer does roughly **100 million (10⁸) simple steps per second**. Contest problems tell you the largest input, so you can check *before* coding whether your idea will finish in time ([USACO Guide](https://usaco.guide/bronze/time-comp)):

| Largest input `n` | Fast enough | Typical idea |
| ----------------- | ----------- | ------------ |
| about 20 | O(2ⁿ) | try every combination |
| about 5,000 | O(n²) | a loop inside a loop |
| about 1,000,000 | O(n log n) | sort first, then one pass |
| about 10,000,000 | O(n) | a single loop |
| even bigger | O(log n) or O(1) | binary search, a formula |

> [!TIP]
> Read the limits **before** you start coding. If `n` can be 200,000, a loop inside a loop does 200,000 × 200,000 = 40 billion steps: several minutes instead of under a second.

### Example: don't redo work

Say you need the sum of every 3 neighbours in a list. Adding up each group from scratch repeats almost the same additions again and again. Instead, keep a **running sum**: when the group slides one place to the right, add the number that came in and subtract the one that left.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> h{ 1, 2, 6, 1, 1, 7, 1 };
    int n = static_cast<int>(h.size());
    int k{ 3 };                                 // group size

    long long window{ 0 };
    for (int i = 0; i < k; ++i)
        window += h[i];                         // the first group: 1 + 2 + 6 = 9

    long long best{ window };
    for (int i = k; i < n; ++i)
    {
        window += h[i] - h[i - k];              // slide: add the new one, remove the old one
        best = std::min(best, window);
    }
    std::cout << best << '\n';                  // 8: the group 6, 1, 1
    return 0;
}
```

The first way is O(n·k), this one is O(n).

## Searching

### Linear search: check one by one

The simplest search looks at every element until it finds the value. It works on **any** list, sorted or not, and takes up to `n` steps: O(n).

```cpp
#include <iostream>
#include <vector>

// Returns the position of target, or -1 if it isn't there
int linearSearch(const std::vector<int>& v, int target)
{
    for (int i = 0; i < static_cast<int>(v.size()); ++i)
    {
        if (v[i] == target)
            return i;
    }
    return -1;
}

int main()
{
    std::vector<int> v{ 8, 3, 15, 4 };
    std::cout << linearSearch(v, 15) << '\n';   // 2
    std::cout << linearSearch(v, 7) << '\n';    // -1
    return 0;
}
```

(`const std::vector<int>& v` means "use the caller's vector without copying it, and don't change it". The **Pointers & References** lesson explains this properly.)

### Binary search: halve the list each time

Play "guess my number from 1 to 100" against a friend who says "higher" or "lower". The smart strategy is to always guess the **middle**: 50, then 25 or 75, and so on. Every guess throws away half of the remaining numbers, so you never need more than 7 guesses.

Binary search does the same on a **sorted** list ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search)). Searching for 23 in `[2, 5, 8, 12, 16, 23, 38, 56]`:

| Step | Still possible | Middle | Compare | Next |
| ---- | -------------- | ------ | ------- | ---- |
| 1 | positions 0–7 | 12 (position 3) | 23 > 12 | search the right half |
| 2 | positions 4–7 | 23 (position 5) | found it! | |

```cpp
#include <iostream>
#include <vector>

// v must be sorted from smallest to largest
int binarySearch(const std::vector<int>& v, int target)
{
    int lo{ 0 };                                // first position still possible
    int hi{ static_cast<int>(v.size()) - 1 };   // last position still possible
    while (lo <= hi)
    {
        int mid{ lo + (hi - lo) / 2 };          // the middle (written this way so it can't overflow)
        if (v[mid] == target)
            return mid;
        if (v[mid] < target)
            lo = mid + 1;                       // too small: keep the right half
        else
            hi = mid - 1;                       // too big: keep the left half
    }
    return -1;                                  // nothing left: not there
}

int main()
{
    std::vector<int> v{ 2, 5, 8, 12, 16, 23, 38, 56 };
    std::cout << binarySearch(v, 23) << '\n';   // 5
    std::cout << binarySearch(v, 7) << '\n';    // -1
    return 0;
}
```

| Sorted elements | Linear search (worst case) | Binary search (worst case) |
| --------------- | -------------------------- | -------------------------- |
| 1,000 | 1,000 steps | 10 steps |
| 1,000,000 | 1,000,000 steps | 20 steps |
| 1,000,000,000 | 1,000,000,000 steps | 30 steps |

> [!WARNING]
> Binary search only works on a **sorted** list. On an unsorted list it still runs, but gives wrong answers. Also test with lists of 1 and 2 elements: mistakes with `lo`, `hi` and `<=` show up there first.

The standard library already has binary search, in `<algorithm>` ([cppreference](https://en.cppreference.com/w/cpp/algorithm/lower_bound)):

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> prices{ 3, 6, 8, 10, 11 };   // sorted

    bool has8 = std::binary_search(prices.begin(), prices.end(), 8);
    std::cout << has8 << '\n';                    // 1 (true)

    // upper_bound finds the first price bigger than 9; everything before it is <= 9
    auto it = std::upper_bound(prices.begin(), prices.end(), 9);
    std::cout << it - prices.begin() << '\n';     // 3 prices are <= 9
    return 0;
}
```

> [!TRY]
> Add a counter to `binarySearch` that counts how many times the loop runs, and search a vector of 1,000,000 sorted numbers. Is it really about 20?

## Sorting

**Sorting** puts elements in order. Many problems become easy once the data is sorted: the smallest and largest are at the ends, equal values sit next to each other, and binary search becomes possible.

### Selection sort: pick the smallest, again and again

Selection sort works like sorting cards in your hand: find the smallest card and put it first; then find the smallest of the rest and put it second; and so on ([learncpp](https://www.learncpp.com/cpp-tutorial/sorting-an-array-using-selection-sort/)).

| Round | List before | Smallest of the unsorted part | List after |
| ----- | ----------- | ----------------------------- | ---------- |
| 1 | 5 2 9 1 | 1 | **1** 2 9 5 |
| 2 | **1** 2 9 5 | 2 (already in place) | **1 2** 9 5 |
| 3 | **1 2** 9 5 | 5 | **1 2 5** 9 |

```cpp
#include <iostream>
#include <utility>
#include <vector>

void selectionSort(std::vector<int>& v)
{
    int n{ static_cast<int>(v.size()) };
    for (int start = 0; start < n - 1; ++start)
    {
        int smallest{ start };                  // position of the smallest so far
        for (int i = start + 1; i < n; ++i)
        {
            if (v[i] < v[smallest])
                smallest = i;
        }
        std::swap(v[start], v[smallest]);       // move it to the front of the unsorted part
    }
}

int main()
{
    std::vector<int> v{ 5, 2, 9, 1 };
    selectionSort(v);                           // & lets the function change the caller's vector
    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';                          // 1 2 5 9
    return 0;
}
```

A loop inside a loop makes it O(n²): fine for a few thousand numbers, far too slow for a million. Watch selection sort and others run step by step on [VisuAlgo](https://visualgo.net/en/sorting).

### std::sort: the one to use

In real code and in contests, use the library's sort ([cppreference](https://en.cppreference.com/w/cpp/algorithm/sort)). It's O(n log n), fast enough for millions of elements.

```cpp
#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

int main()
{
    std::vector<int> v{ 5, 2, 9, 1 };
    std::sort(v.begin(), v.end());                          // 1 2 5 9
    std::sort(v.begin(), v.end(), std::greater<int>());     // 9 5 2 1 (largest first)
    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';

    std::vector<std::string> names{ "Mihai", "Ana", "Ioana" };
    std::sort(names.begin(), names.end());                  // alphabetical
    std::cout << names[0] << '\n';                          // Ana
    return 0;
}
```

> [!TIP]
> When a problem feels hard, ask yourself: *"would it be easier if the input were sorted?"* Sorting costs only O(n log n), and it often turns a slow idea into a single pass.

## Recursion

A **recursive** function is a function that calls itself on a smaller version of the same problem. Think of Russian nesting dolls: to reach the smallest doll, you open a doll and do the same with the doll inside, until there's one that doesn't open. That last doll is the **base case**: the point where the function stops calling itself ([learncpp](https://www.learncpp.com/cpp-tutorial/recursion/)).

```cpp
#include <iostream>

long long factorial(int n)
{
    if (n <= 1)                     // base case: the doll that doesn't open
        return 1;
    return n * factorial(n - 1);    // the same problem, one size smaller
}

int main()
{
    std::cout << factorial(5) << '\n';   // 120 = 5 × 4 × 3 × 2 × 1
    return 0;
}
```

How `factorial(3)` runs, step by step:

1. `factorial(3)` needs `3 * factorial(2)`, so it waits;
2. `factorial(2)` needs `2 * factorial(1)`, so it waits;
3. `factorial(1)` is the base case and returns `1`;
4. `factorial(2)` can now return `2 * 1 = 2`;
5. `factorial(3)` can now return `3 * 2 = 6`.

> [!WARNING]
> Without a base case (or if the value never reaches it), the function keeps calling itself until the program runs out of memory and crashes.

Recursion can be elegant but slow. The Fibonacci numbers (0, 1, 1, 2, 3, 5, 8, …, each one the sum of the two before it) written straight from that definition recompute the same values over and over: `fibSlow(40)` makes over 300 million calls. A simple loop that remembers the last two values needs only 40 steps:

```cpp
#include <iostream>

long long fibSlow(int n)        // recursive: the work roughly doubles with each n
{
    if (n < 2)
        return n;
    return fibSlow(n - 1) + fibSlow(n - 2);
}

long long fibFast(int n)        // loop: O(n)
{
    long long a{ 0 }, b{ 1 };   // the last two Fibonacci numbers
    for (int i = 0; i < n; ++i)
    {
        long long next{ a + b };
        a = b;
        b = next;
    }
    return a;
}

int main()
{
    std::cout << fibSlow(30) << '\n';   // 832040, after over a million calls
    std::cout << fibFast(30) << '\n';   // 832040, after 30 steps
    return 0;
}
```

> [!TRY]
> Write a recursive function `sumTo(n)` that returns 1 + 2 + … + n. What's its base case?

## How to approach a problem

1. **Read the limits** and use the table above to see which Big-O is fast enough.
2. **Write the simplest correct solution first**, even if it's slow. It helps you understand the problem and check faster versions.
3. **Look for structure**: would sorting help? Can binary search replace a loop? Can a running value replace recomputing?
4. **Test the edge cases**: one element, all values equal, the largest values (do they fit in `int`, or do you need `long long`?).

## Going further

The [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf) (chapters 2 and 3) covers all of this in more depth, and [CP-Algorithms](https://cp-algorithms.com/num_methods/binary_search.html) shows more advanced uses of binary search.

## Summary

- An algorithm is a list of exact steps; it should be correct, finite and efficient.
- Big-O describes how the work grows with the input; about 10⁸ simple steps run per second.
- Linear search is O(n) and works on anything; binary search is O(log n) but needs a sorted list.
- Selection sort is O(n²); use `std::sort`, which is O(n log n).
- A recursive function calls itself on a smaller problem and needs a base case to stop.

## Words to know

- **Algorithm**: a list of exact steps that solves a problem.
- **Big-O**: a way to describe how the number of steps grows with the input size `n`.
- **Linear / binary search**: checking elements one by one / halving a sorted list each step.
- **Sorting**: putting elements in order.
- **Recursion**: a function calling itself; the **base case** is where it stops.
- **Edge case**: an unusual input (empty, one element, very large) where bugs like to hide.

## Next steps

1. Read the sources below for more detail and examples.
2. Solve the **Algorithms: Searching** challenge, then **Algorithms: Sorting & Recursion**, under Practice.
3. Check yourself with the **Introduction to Algorithms** quiz, then continue with **Pointers & References**.
