## What is an algorithm?

An **algorithm** is a finite list of exact steps that solves a problem. A recipe is an algorithm for a cake; a program is an algorithm written so a computer can follow it ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/intro-to-algorithms/a/what-is-an-algorithm)).

A good algorithm is:

- **correct**: it gives the right answer for *every* valid input, including the edge cases;
- **finite**: it always stops;
- **efficient**: it finishes fast enough for the biggest inputs it will get.

Here is a small one: find the largest number in a list.

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> numbers{ 4, 17, 3, 9, 12 };

    int largest{ numbers[0] };          // start with the first value
    for (int x : numbers)
    {
        if (x > largest)
            largest = x;                // found a bigger one
    }

    std::cout << largest << '\n';       // prints 17
    return 0;
}
```

It looks at every number exactly once. The rest of this lesson is about *how many steps* an algorithm takes, and how to choose one that takes few.

## Measuring speed: Big-O

We describe an algorithm's speed by how its **number of steps grows with the input size `n`**. We drop constant factors and smaller terms: `3n + 5` steps is written **O(n)**, `n² + n` is **O(n²)** ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation)).

```cpp
// O(1): constant, no matter how big n is
int first = v[0];

// O(n): one pass over the data
for (int i = 0; i < n; ++i)
    sum += v[i];

// O(n²): a loop inside a loop, e.g. comparing every pair
for (int i = 0; i < n; ++i)
    for (int j = i + 1; j < n; ++j)
        if (v[i] == v[j])
            ++equalPairs;

// O(log n): n is halved every step (1,000,000 → about 20 steps)
while (n > 1)
    n /= 2;
```

A typical judge runs roughly **10⁸ simple operations per second**. That turns the input limits into a hint about which complexity you need ([USACO Guide](https://usaco.guide/bronze/time-comp)):

| Largest `n` | Fast enough | Typical algorithm |
| ----------- | ----------- | ----------------- |
| about 20 | O(2ⁿ) | try every subset |
| about 5,000 | O(n²) | nested loops |
| about 10⁶ | O(n log n) | sort first, then one pass |
| about 10⁷ | O(n) | a single loop |
| huge (10¹⁸) | O(log n) or O(1) | binary search, a formula |

> [!TIP]
> Read the constraints **before** you start coding. If `n` can be 200,000, two nested loops (4·10¹⁰ steps) won't finish in time, however clever the rest of the code is.

A classic example: the sum of every block of `k` neighbours. Adding up each block from scratch costs O(n·k). Keeping a **running sum** (add the new element, subtract the one that left the block) costs O(n):

```cpp
long long window{ 0 };
for (int i = 0; i < k; ++i)
    window += h[i];                     // the first block

long long best{ window };
for (int i = k; i < n; ++i)
{
    window += h[i] - h[i - k];          // slide one step to the right
    best = std::min(best, window);
}
```

## Searching

### Linear search: O(n)

Check the elements one by one until you find the value. It works on **any** list.

```cpp
// Returns the index of target, or -1 if it isn't there
int linearSearch(const std::vector<int>& v, int target)
{
    for (int i = 0; i < static_cast<int>(v.size()); ++i)
    {
        if (v[i] == target)
            return i;
    }
    return -1;
}
```

### Binary search: O(log n)

If the list is **sorted**, look at the middle element. If it's too small, the answer can only be in the right half; if it's too big, only in the left half. Each step throws away half of what's left ([Khan Academy](https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search)).

```cpp
// v must be sorted in increasing order
int binarySearch(const std::vector<int>& v, int target)
{
    int lo{ 0 };
    int hi{ static_cast<int>(v.size()) - 1 };
    while (lo <= hi)
    {
        int mid{ lo + (hi - lo) / 2 };  // same as (lo + hi) / 2, but can't overflow
        if (v[mid] == target)
            return mid;
        if (v[mid] < target)
            lo = mid + 1;               // the answer is to the right
        else
            hi = mid - 1;               // the answer is to the left
    }
    return -1;
}
```

| Sorted elements | Linear search (worst case) | Binary search (worst case) |
| --------------- | -------------------------- | -------------------------- |
| 1,000 | 1,000 steps | 10 steps |
| 1,000,000 | 1,000,000 steps | 20 steps |
| 1,000,000,000 | 1,000,000,000 steps | 30 steps |

> [!WARNING]
> Binary search on an **unsorted** list compiles and runs, but returns wrong answers. Sort first (or make sure the input is already sorted). Off-by-one mistakes in `lo`, `hi` and the loop condition are the other classic bug: test with 1 and 2 elements.

The standard library already has it, in `<algorithm>` ([cppreference](https://en.cppreference.com/w/cpp/algorithm/lower_bound)):

```cpp
std::vector<int> prices{ 3, 6, 8, 10, 11 };   // sorted

bool has8 = std::binary_search(prices.begin(), prices.end(), 8);        // true

// lower_bound: first element >= x;  upper_bound: first element > x
auto it = std::upper_bound(prices.begin(), prices.end(), 9);
int cheaperOrEqual = static_cast<int>(it - prices.begin());             // 3 prices are <= 9
```

## Sorting

Sorting puts elements in order. Many problems become easy once the data is sorted: the smallest and largest are at the ends, equal values sit next to each other, and binary search becomes possible.

### Selection sort: O(n²)

Find the smallest element and swap it to the front, then repeat for the rest ([learncpp](https://www.learncpp.com/cpp-tutorial/sorting-an-array-using-selection-sort/)).

```cpp
void selectionSort(std::vector<int>& v)
{
    int n{ static_cast<int>(v.size()) };
    for (int start = 0; start < n - 1; ++start)
    {
        int smallest{ start };
        for (int i = start + 1; i < n; ++i)
        {
            if (v[i] < v[smallest])
                smallest = i;
        }
        std::swap(v[start], v[smallest]);
    }
}
```

Two nested loops make it O(n²): fine for a few thousand elements, far too slow for a million. Watch selection, insertion and merge sort step by step on [VisuAlgo](https://visualgo.net/en/sorting).

### std::sort: O(n log n)

In real code, and in contests, use the library's sort ([cppreference](https://en.cppreference.com/w/cpp/algorithm/sort)). It is guaranteed to be O(n log n).

```cpp
#include <algorithm>
#include <functional>
#include <string>
#include <vector>

std::vector<int> v{ 5, 2, 9, 1 };
std::sort(v.begin(), v.end());                          // 1 2 5 9
std::sort(v.begin(), v.end(), std::greater<int>());     // 9 5 2 1 (descending)

std::vector<std::string> names{ "Mihai", "Ana", "Ioana" };
std::sort(names.begin(), names.end());                  // Ana Ioana Mihai
```

> [!TIP]
> When a problem feels hard, ask: *"would it be easier if the input were sorted?"* Sorting costs only O(n log n) and often turns an O(n²) idea into a single pass.

## Recursion

A **recursive** function calls itself on a smaller version of the same problem. Every recursive function needs a **base case** that stops it ([learncpp](https://www.learncpp.com/cpp-tutorial/recursion/)).

```cpp
long long factorial(int n)
{
    if (n <= 1)                     // base case: stop here
        return 1;
    return n * factorial(n - 1);    // smaller problem: n - 1
}
// factorial(5) = 5 * 4 * 3 * 2 * 1 = 120
```

> [!WARNING]
> Without a base case (or if the argument never reaches it), the function calls itself until the program runs out of stack memory and crashes.

Recursion can be elegant but slow. The Fibonacci numbers (0, 1, 1, 2, 3, 5, 8, …) written directly from their definition recompute the same values again and again, so the work grows **exponentially**:

```cpp
// O(2ⁿ)-ish: fib(40) already takes hundreds of millions of calls
long long fibSlow(int n)
{
    if (n < 2)
        return n;
    return fibSlow(n - 1) + fibSlow(n - 2);
}

// O(n): remember the last two values instead
long long fibFast(int n)
{
    long long a{ 0 }, b{ 1 };
    for (int i = 0; i < n; ++i)
    {
        long long next{ a + b };
        a = b;
        b = next;
    }
    return a;
}
```

## How to approach a problem

1. **Read the constraints** and use the table above to see which complexity is fast enough.
2. **Write the simplest correct solution** (brute force) first, even if it's too slow. It helps you understand the problem and check faster versions.
3. **Look for structure**: would sorting help? Can binary search replace a loop? Can a running value replace recomputing?
4. **Test the edge cases**: one element, all equal values, the largest values (do they fit in `int`, or do you need `long long`?).

The [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf) (chapters 2 and 3) covers all of this in more depth, and [CP-Algorithms](https://cp-algorithms.com/num_methods/binary_search.html) goes further with binary search.

## Next steps

1. Read the sources below for more detail and examples.
2. Solve the **Algorithms: Searching** challenge, then **Algorithms: Sorting & Recursion**, under Practice.
3. Check yourself with the **Introduction to Algorithms** quiz.
