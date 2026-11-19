## What is a data structure?

A **data structure** is a way of organizing data in memory. Each one makes some operations fast and others slow, so choosing the right one often matters more than clever code ([USACO Guide](https://usaco.guide/bronze/intro-ds)).

- Need the *i*-th element instantly? An **array/vector**.
- Need the most recent thing first, or the oldest first? A **stack** or a **queue**.
- Need to know quickly whether something is there, or count occurrences? A **set** or a **map**.
- Need the largest (or smallest) element over and over? A **priority queue**.

This lesson builds two structures by hand to show how they work inside, then uses the ready-made versions from the C++ standard library ([cppreference](https://en.cppreference.com/w/cpp/container)). Costs are written in Big-O, from the algorithms lesson.

## Arrays and std::vector

A `std::vector` keeps its elements **side by side** in memory, so reading `v[i]` is O(1). Adding at the end is O(1) on average; inserting or erasing in the middle shifts everything after it, which is O(n).

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> v{ 5, 8, 2 };
    v.push_back(7);              // add at the end: O(1) on average
    v.pop_back();                // remove the last: O(1)
    std::cout << v[1] << '\n';   // 8, read by index: O(1)

    v.insert(v.begin(), 1);      // insert at the front: O(n), everything shifts
    std::cout << v.size() << '\n';   // 4
    return 0;
}
```

### std::pair

A `std::pair` bundles two values. Pairs compare by `first`, then by `second`, so a vector of pairs sorts naturally:

```cpp
#include <algorithm>
#include <string>
#include <utility>
#include <vector>

std::vector<std::pair<int, std::string>> scores{ { 90, "Ana" }, { 75, "Mihai" }, { 90, "Ioana" } };
std::sort(scores.begin(), scores.end());
// (75, Mihai), (90, Ana), (90, Ioana)
std::cout << scores[0].second << " has " << scores[0].first << '\n';   // Mihai has 75
```

## Stacks: last in, first out

A **stack** is like a pile of plates: you only add to the top (**push**), look at the top (**top**) and take from the top (**pop**). The last thing added is the first to come out (LIFO). All three operations are O(1).

### Build it yourself

A vector already adds and removes at its end in O(1), so the end of a vector makes a perfect top ([learncpp 16.11](https://www.learncpp.com/cpp-tutorial/stdvector-and-stack-behavior/)):

```cpp
#include <vector>

class IntStack
{
public:
    void push(int x) { m_items.push_back(x); }
    void pop() { m_items.pop_back(); }          // only call it when not empty
    int top() const { return m_items.back(); }  // only call it when not empty
    bool empty() const { return m_items.empty(); }
    int size() const { return static_cast<int>(m_items.size()); }

private:
    std::vector<int> m_items;
};
```

### std::stack

The library version works the same way, in `<stack>`. A classic use: checking that brackets are balanced. Every opening bracket waits on the stack until its closing partner arrives.

```cpp
#include <stack>
#include <string>

bool balanced(const std::string& s)
{
    std::stack<char> open;
    for (char c : s)
    {
        if (c == '(' || c == '[' || c == '{')
            open.push(c);
        else
        {
            if (open.empty())
                return false;                   // a closer with nothing to close
            char o = open.top();
            open.pop();
            if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{'))
                return false;                   // wrong kind of bracket
        }
    }
    return open.empty();                        // nothing left unclosed
}
// balanced("([]{})") → true, balanced("(]") → false
```

> [!WARNING]
> Calling `top()` or `pop()` on an **empty** stack is undefined behaviour: the program may crash or return garbage. Always check `empty()` first.

## Queues: first in, first out

A **queue** works like a line at a shop: you join at the **back** (`push`) and leave from the **front** (`pop`). The first to arrive is the first served (FIFO). `std::queue` in `<queue>` does this in O(1) per operation.

```cpp
#include <iostream>
#include <queue>

std::queue<int> line;
line.push(1);
line.push(2);
line.push(3);
std::cout << line.front() << '\n';   // 1: the first to arrive
line.pop();                          // 1 leaves
std::cout << line.front() << ' ' << line.back() << '\n';   // 2 3
```

Queues show up whenever things must be handled **in arrival order**: tasks to process, people in a line, or later the squares to visit in a maze (breadth-first search).

## Linked lists

A vector's elements sit side by side, so inserting at the front has to shift all of them. A **linked list** stores each value in its own **node** that points to the next one, so adding at the front only creates one node and changes one pointer: O(1). The price is that there is no `list[i]`: to reach an element you follow the pointers from the start, which is O(n). Watch both happen on [VisuAlgo](https://visualgo.net/en/list).

A **pointer** holds the memory address of another value; `nullptr` means "points to nothing" ([learncpp 12.7](https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/)).

### Build it yourself

```cpp
#include <iostream>

struct Node
{
    int value;
    Node* next;          // the next node, or nullptr at the end
};

class IntList
{
public:
    ~IntList()           // free every node when the list is destroyed
    {
        while (m_head != nullptr)
        {
            Node* old = m_head;
            m_head = m_head->next;
            delete old;
        }
    }

    void pushFront(int x) { m_head = new Node{ x, m_head }; }   // O(1)

    bool contains(int x) const                                  // O(n)
    {
        for (Node* n = m_head; n != nullptr; n = n->next)
            if (n->value == x)
                return true;
        return false;
    }

    void print() const
    {
        for (Node* n = m_head; n != nullptr; n = n->next)
            std::cout << n->value << ' ';
        std::cout << '\n';
    }

private:
    Node* m_head{ nullptr };
};

// IntList list; list.pushFront(3); list.pushFront(2); list.pushFront(1); list.print();   // 1 2 3
```

> [!NOTE]
> In everyday C++ you'll rarely write a linked list: `std::vector` is usually faster because its elements sit together in memory. But the idea of nodes connected by pointers is behind many other structures (trees, graphs), and linked-list questions are common in interviews.

## Sets: unique values, fast lookup

A **set** stores each value at most once and answers "is `x` in here?" quickly.

- `std::set` (in `<set>`) keeps its values **sorted**; insert, erase and find are **O(log n)**.
- `std::unordered_set` (in `<unordered_set>`) uses hashing; the same operations are **O(1) on average**, but the order is unpredictable.

```cpp
#include <iostream>
#include <set>

std::set<int> seen{ 5, 1, 5, 3, 1 };    // duplicates are dropped
std::cout << seen.size() << '\n';        // 3
seen.insert(4);
std::cout << seen.count(4) << '\n';      // 1 (it's there); 0 if not
for (int x : seen)
    std::cout << x << ' ';               // 1 3 4 5: always sorted
std::cout << '\n';
```

## Maps: keys and values

A **map** stores **key → value** pairs, like a dictionary: a word and its count, a name and a score ([USACO Guide](https://usaco.guide/bronze/intro-sets)).

```cpp
#include <iostream>
#include <map>
#include <string>

std::map<std::string, int> count;
for (std::string word : { "apple", "pear", "apple" })
    ++count[word];                        // a missing key starts at 0

std::cout << count["apple"] << '\n';      // 2
for (const auto& [word, n] : count)       // in key order: apple, pear
    std::cout << word << ": " << n << '\n';

if (count.count("plum") == 0)             // check without adding it
    std::cout << "no plums\n";
```

> [!WARNING]
> `count[key]` **adds** the key (with value 0) when it's missing. To check whether a key exists, use `count(key)` or `find(key)` instead; otherwise every lookup quietly grows the map.

### Hashing: how unordered_map is O(1)

`std::unordered_map` (in `<unordered_map>`) runs each key through a **hash function** that turns it into a number, which picks a "bucket" to store it in. Finding the key later means hashing it again and looking in one bucket: O(1) on average ([cppreference](https://en.cppreference.com/w/cpp/container/unordered_map), [VisuAlgo](https://visualgo.net/en/hashtable)). If many keys land in the same bucket it slows down, up to O(n) in the worst case.

| | `std::map` | `std::unordered_map` |
| - | ---------- | -------------------- |
| Insert / find / erase | O(log n) | O(1) on average, O(n) worst case |
| Keys in sorted order | yes | no |
| Can find "the smallest key ≥ x" | yes (`lower_bound`) | no |

> [!TIP]
> Use `unordered_map` when you only need lookups and counts, and `map` when you need the keys in order (or `lower_bound`). Either is far better than searching a vector each time.

## Priority queues (heaps)

A **priority queue** always hands you the **largest** element first, whatever order things were added in. It's built as a *binary heap* ([VisuAlgo](https://visualgo.net/en/heap)): `push` and `pop` are O(log n) and `top` is O(1) ([cppreference](https://en.cppreference.com/w/cpp/container/priority_queue)).

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

std::priority_queue<int> maxHeap;
for (int x : { 3, 9, 1, 7 })
    maxHeap.push(x);
std::cout << maxHeap.top() << '\n';   // 9
maxHeap.pop();
std::cout << maxHeap.top() << '\n';   // 7

// Smallest first: add std::greater
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
for (int x : { 3, 9, 1, 7 })
    minHeap.push(x);
std::cout << minHeap.top() << '\n';   // 1
```

Use it whenever you repeatedly need "the biggest (or smallest) so far": the most urgent task, the largest bonus, the shortest path found so far (Dijkstra's algorithm, later).

## Choosing a structure

| Structure | Add | Remove | Find a value | Best for |
| --------- | --- | ------ | ------------ | -------- |
| `vector` | O(1) at the end | O(1) at the end, O(n) elsewhere | O(n) (O(log n) if sorted) | indexed lists |
| `stack` | O(1) | O(1), the newest | top only | undo, brackets, "most recent" |
| `queue` | O(1) | O(1), the oldest | front only | processing in arrival order |
| linked list | O(1) at the front | O(1) at the front | O(n) | many inserts at the front |
| `set` / `map` | O(log n) | O(log n) | O(log n) | sorted data, ranges |
| `unordered_set` / `unordered_map` | O(1) average | O(1) average | O(1) average | lookups and counting |
| `priority_queue` | O(log n) | O(log n), the largest | largest only, O(1) | "biggest so far" |

The [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf) (chapter 4) covers these structures in more depth.

## Next steps

1. Read the sources below for more detail and animations.
2. Practice by topic (**Data Structures: Stacks & Queues**, **Data Structures: Sets, Maps & Heaps**) or by skill (**Data Structures: Build Your Own**, **Data Structures: Pick the Right One**) under Practice. Each item counts in every challenge it's in.
3. Check yourself with the **Data Structures** quiz.
