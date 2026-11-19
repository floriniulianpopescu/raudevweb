**Before you start:** you should know loops, functions, `std::vector`, the idea of Big-O (the **Introduction to Algorithms** lesson) and pointers (the **Pointers & References** lesson).

**In this lesson you'll learn to:**

- explain what a data structure is and why the choice matters;
- build a stack and a linked list yourself, to see how they work inside;
- use the ready-made versions from the C++ standard library: stacks, queues, sets, maps and priority queues;
- pick the right structure for a problem.

Every example is a complete program: copy it into an online compiler such as [OnlineGDB](https://www.onlinegdb.com/online_c++_compiler) and run it.

## What is a data structure?

A **data structure** is a way of organizing data in memory. You already know this from everyday life: the way you organize things decides which jobs are quick.

| Everyday thing | Data structure | Quick at |
| -------------- | -------------- | -------- |
| a numbered row of lockers | vector | "give me locker number 7" |
| a pile of plates | stack | taking the plate you put down last |
| a line at a shop | queue | serving whoever came first |
| a guest list | set | "is this person on the list?" |
| a phone's contacts | map | "what's Ana's number?" |
| a hospital emergency room | priority queue | "who's most urgent?" |

Choosing the right one often matters more than clever code ([USACO Guide](https://usaco.guide/bronze/intro-ds)). The C++ standard library has all of them ready to use ([cppreference](https://en.cppreference.com/w/cpp/container)); we'll also build two of them by hand to see how they work inside. Costs are written in Big-O.

## Vectors and pairs

A `std::vector` is the numbered row of lockers: its elements sit **side by side** in memory, so jumping straight to `v[i]` is O(1). Adding at the end is also quick. Inserting at the front is slow, though: every element has to shift one place to make room, which is O(n).

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v{ 5, 8, 2 };
    v.push_back(7);                  // add at the end: quick
    v.pop_back();                    // remove the last one: quick
    std::cout << v[1] << '\n';       // 8: go straight to position 1

    v.insert(v.begin(), 1);          // add at the front: every element shifts, O(n)
    for (int x : v)
        std::cout << x << ' ';
    std::cout << '\n';               // 1 5 8 2
    return 0;
}
```

A `std::pair` bundles two values together; you reach them with `.first` and `.second`. Pairs compare by `first`, then by `second`, so a vector of pairs sorts naturally:

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main()
{
    std::vector<std::pair<int, std::string>> scores{ { 90, "Ana" }, { 75, "Mihai" }, { 90, "Ioana" } };
    std::sort(scores.begin(), scores.end());       // by score, then by name

    for (const auto& p : scores)
        std::cout << p.second << ": " << p.first << '\n';
    // Mihai: 75
    // Ana: 90
    // Ioana: 90
    return 0;
}
```

## Stacks: last in, first out

A **stack** is a pile of plates. You can only add a plate on top (**push**), look at the top plate (**top**) or take the top plate off (**pop**). The last plate you put down is the first you pick up: **LIFO**, "last in, first out". All three operations are O(1).

### Build it yourself

The end of a vector works perfectly as the top of a stack, because adding and removing there is quick ([learncpp 16.11](https://www.learncpp.com/cpp-tutorial/stdvector-and-stack-behavior/)):

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> stack;

    stack.push_back(1);                  // push 1
    stack.push_back(2);                  // push 2
    stack.push_back(3);                  // push 3: the pile is now 1, 2, 3 (3 on top)

    std::cout << stack.back() << '\n';   // top: 3
    stack.pop_back();                    // pop: removes the 3
    std::cout << stack.back() << '\n';   // top: 2
    std::cout << stack.size() << '\n';   // 2 plates left
    return 0;
}
```

### std::stack

The standard library's version, in `<stack>`, uses the plate words directly. A classic use is checking that brackets are balanced: each opening bracket waits on the stack until its closing partner arrives.

```cpp
#include <iostream>
#include <stack>
#include <string>

bool balanced(const std::string& s)
{
    std::stack<char> open;                       // the opening brackets still waiting
    for (char c : s)
    {
        if (c == '(' || c == '[' || c == '{')
        {
            open.push(c);
        }
        else
        {
            if (open.empty())
                return false;                    // a closing bracket with nothing to close
            char o = open.top();
            open.pop();
            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{'))
                return false;                    // the wrong kind of bracket
        }
    }
    return open.empty();                         // anything left was never closed
}

int main()
{
    std::cout << balanced("([]{})") << '\n';     // 1 (true)
    std::cout << balanced("(]") << '\n';         // 0 (false)
    return 0;
}
```

> [!WARNING]
> Calling `top()` or `pop()` on an **empty** stack makes the program crash or misbehave. Always check `empty()` first.

> [!TRY]
> Use a stack to print a word backwards: push every letter, then pop them all.

## Queues: first in, first out

A **queue** is a line at a shop: you join at the **back** (`push`) and leave from the **front** (`pop`). Whoever came first is served first: **FIFO**, "first in, first out". `std::queue` in `<queue>` does each operation in O(1).

```cpp
#include <iostream>
#include <queue>

int main()
{
    std::queue<int> line;
    line.push(1);                        // 1 joins the line
    line.push(2);
    line.push(3);

    std::cout << line.front() << '\n';   // 1: first to arrive
    line.pop();                          // 1 is served and leaves
    std::cout << line.front() << ' ' << line.back() << '\n';   // 2 3
    return 0;
}
```

Use a queue whenever things must be handled **in the order they arrived**: tasks to process, people in a line, or (in a later lesson) the squares to visit in a maze.

> [!TRY]
> Put the numbers 1 to 5 in a queue. Then, five times, take the front number, print it, and push it back to the end. What gets printed, and what's in the queue at the end?

## Linked lists

Think of a treasure hunt: each clue tells you where the next one is hidden. A **linked list** stores data the same way. Each value lives in its own **node**, and every node also remembers where the next node is.

- Adding at the front is quick: make one new node pointing to the old first one. That's O(1), with nothing to shift.
- Finding something is slow: you have to follow the clues from the start, one by one. That's O(n), and there is no `list[i]`.

Watch both happen on [VisuAlgo](https://visualgo.net/en/list).

A node remembers "where the next one is" with a **pointer**, exactly like the chain at the end of the **Pointers & References** lesson: `Node*` is a pointer to a node, `->` reads a field through it, and `nullptr` marks the end. One new thing here: `new Node{ … }` creates a node that keeps existing after the line that made it, until you give it back with `delete`.

### Build it yourself

```cpp
#include <iostream>

struct Node
{
    int value;
    Node* next;            // where the next node is, or nullptr at the end
};

int main()
{
    // Build the list 1 → 2 → 3 from the back, each node pointing to the next
    Node* third = new Node{ 3, nullptr };
    Node* second = new Node{ 2, third };
    Node* head = new Node{ 1, second };     // head: the first node

    // Walk the list: start at the head and follow the pointers
    for (Node* n = head; n != nullptr; n = n->next)
        std::cout << n->value << ' ';
    std::cout << '\n';                       // 1 2 3

    // Add 0 at the front: one new node, nothing else moves
    head = new Node{ 0, head };
    for (Node* n = head; n != nullptr; n = n->next)
        std::cout << n->value << ' ';
    std::cout << '\n';                       // 0 1 2 3

    // Everything made with new must be given back with delete
    while (head != nullptr)
    {
        Node* old = head;
        head = head->next;
        delete old;
    }
    return 0;
}
```

> [!NOTE]
> In everyday C++ you'll rarely write a linked list yourself: `std::vector` is usually faster because its elements sit together in memory. But nodes connected by pointers are the idea behind trees and graphs, and linked lists are a favourite interview topic.

## Sets: is it in there?

A **set** is a guest list: each value appears **at most once**, and it answers "is this one in here?" quickly.

- `std::set` (in `<set>`) keeps its values **sorted**. Adding, removing and finding are O(log n).
- `std::unordered_set` (in `<unordered_set>`) does the same jobs in O(1) on average, but in no particular order.

```cpp
#include <iostream>
#include <set>

int main()
{
    std::set<int> guests{ 5, 1, 5, 3, 1 };   // the duplicate 5 and 1 are kept only once
    std::cout << guests.size() << '\n';      // 3

    guests.insert(4);
    std::cout << guests.count(4) << '\n';    // 1: it's there (0 means it isn't)

    for (int x : guests)
        std::cout << x << ' ';               // 1 3 4 5: always sorted
    std::cout << '\n';
    return 0;
}
```

> [!TRY]
> Read 10 numbers and print how many **different** numbers there were, using a set.

## Maps: look up a value by its key

A **map** is like your phone's contacts: you look up a **key** (a name) to get its **value** (a phone number). Each key appears once ([USACO Guide](https://usaco.guide/bronze/intro-sets)).

```cpp
#include <iostream>
#include <map>
#include <string>

int main()
{
    std::map<std::string, int> count;               // word → how many times we saw it
    for (std::string word : { "apple", "pear", "apple" })
        ++count[word];                              // a new word starts at 0

    std::cout << count["apple"] << '\n';            // 2

    for (const auto& [word, n] : count)             // in key order: apple, then pear
        std::cout << word << ": " << n << '\n';

    if (count.count("plum") == 0)                   // check without adding it
        std::cout << "no plums\n";
    return 0;
}
```

> [!WARNING]
> `count["plum"]` **adds** "plum" (with the value 0) if it isn't there yet. To only *check* whether a key exists, use `count("plum")` or `find("plum")`.

### unordered_map and hashing

`std::map` keeps its keys sorted and takes O(log n) per operation. `std::unordered_map` (in `<unordered_map>`) is usually faster, O(1) on average, thanks to **hashing**.

Think of a coat check. You don't search every hook for your coat: your ticket number tells the attendant exactly which hook to go to. A **hash function** does the same for keys: it turns each key into a number that says which "bucket" to store it in, so finding it later means going straight to one bucket ([VisuAlgo](https://visualgo.net/en/hashtable), [cppreference](https://en.cppreference.com/w/cpp/container/unordered_map)).

| | `std::map` | `std::unordered_map` |
| - | ---------- | -------------------- |
| Add / find / remove | O(log n) | O(1) on average |
| Keys come out sorted | yes | no |

> [!TIP]
> Use `unordered_map` when you only need lookups and counting. Use `map` when you need the keys in order. Both are much faster than searching through a vector every time.

## Priority queues: the most important first

A **priority queue** is an emergency room: patients aren't seen in arrival order but by urgency, so the most urgent is always next. `std::priority_queue` (in `<queue>`) always gives you the **largest** value first: `top` is O(1), `push` and `pop` are O(log n) ([cppreference](https://en.cppreference.com/w/cpp/container/priority_queue)). Inside it's a structure called a *binary heap* ([VisuAlgo](https://visualgo.net/en/heap)).

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

int main()
{
    std::priority_queue<int> biggestFirst;
    for (int x : { 3, 9, 1, 7 })
        biggestFirst.push(x);
    std::cout << biggestFirst.top() << '\n';   // 9
    biggestFirst.pop();
    std::cout << biggestFirst.top() << '\n';   // 7

    // Smallest first: add std::greater (copy this line as it is)
    std::priority_queue<int, std::vector<int>, std::greater<int>> smallestFirst;
    for (int x : { 3, 9, 1, 7 })
        smallestFirst.push(x);
    std::cout << smallestFirst.top() << '\n';  // 1
    return 0;
}
```

Use it whenever you keep needing "the biggest (or smallest) so far": the most urgent task, the largest bonus, or later, the shortest path found so far.

## Choosing a structure

| Structure | Good at | Slow at |
| --------- | ------- | ------- |
| `vector` | reading any position, adding at the end | adding or removing in the middle or front (O(n)) |
| `stack` | the most recently added item | anything except the top |
| `queue` | the oldest item | anything except the front |
| linked list | adding at the front | finding an element (O(n)) |
| `set` / `map` | finding, adding, removing (O(log n)), keeping things sorted | — |
| `unordered_set` / `unordered_map` | finding, adding, removing (O(1) on average) | keeping things in order |
| `priority_queue` | the largest (or smallest) item | finding any other item |

## Going further

The [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf) (chapter 4) covers these structures for contests. Two things worth knowing later:

- A real linked list is usually wrapped in a **class** that frees its nodes automatically; the standard library's version is `std::list`.
- Hashing is only O(1) *on average*: if many keys land in the same bucket it slows down, up to O(n) in the worst case.

## Summary

- A data structure organizes data so certain operations are fast; pick it by the operations you need.
- Vector: fast by position. Stack: LIFO. Queue: FIFO.
- A linked list adds at the front in O(1) but needs O(n) to find things; it's built from nodes and pointers.
- Set: unique values, fast "is it there?". Map: key → value. The `unordered_` versions are faster but unsorted.
- Priority queue: always hands you the largest (or smallest) value.

## Words to know

- **Data structure**: a way of organizing data so some operations are fast.
- **LIFO / FIFO**: last in first out (stack) / first in first out (queue).
- **Node**: one element of a linked list, holding a value and a pointer to the next node.
- **Pointer**: a value that holds a memory address; `nullptr` points to nothing.
- **Key / value**: in a map, what you look up / what you get back.
- **Hashing**: turning a key into a number that says where to store it.
- **Heap**: the structure inside a priority queue that keeps the largest value on top.

## Next steps

1. Read the sources below for more detail and animations.
2. Practise by topic (**Data Structures: Stacks & Queues**, **Data Structures: Sets, Maps & Heaps**) or by skill (**Data Structures: Build Your Own**, **Data Structures: Pick the Right One**) under Practice. Each item counts in every challenge it's in.
3. Check yourself with the **Data Structures** quiz.
