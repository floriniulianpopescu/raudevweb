# RAU DEV `</>` — Session 01 Companion Lecture Notes

**Romanian-American University • Software Engineering Club**  
**Schedule:** Fridays, 11:00 – 14:00 | **Location:** Room 515

---

## 1. The RAU DEV Philosophy

```javascript
while (curious) {
    learn();
    build();
    share();
}
```

Our culture rests on four core engineering principles:
1. **Curiosity over ego** — Ask questions. Stay open to being wrong.
2. **Progress over perfection** — Small steps count. Keep practising.
3. **Collaboration over competition** — Share credit and help teammates succeed.
4. **Respect at every level** — Make room for different backgrounds and experience.

---

## 2. How Our Friday Sessions Work (The Quest Format)

| Time | Segment | Duration | Description & Rewards |
| :--- | :--- | :--- | :--- |
| **11:00** | **Spawn Point** | 10 min | Welcome everyone, announce the weekly quest, show leaderboard updates, and choose difficulty. *(Reward: Participation XP)* |
| **11:10** | **Main Quest** | 45 min | Work through a LeetCode-style problem, debugging challenge, or small team exercise with starter and harder routes. *(Reward: Challenge XP & Skill Badges)* |
| **11:55** | **Save Point** | 10 min | Break, social time, and optional bonus puzzle. |
| **12:05** | **Skill Tree** | 45 min | Workshop, mock interviews, guest speaker, or project work. Unlock skill-specific achievements. |
| **12:50** | **Party Quest** | 50 min | Pair programming, peer review, mock interviews, or collaborative mini-project. Rotate teams! *(Reward: Teamwork & Community Achievements)* |
| **13:40** | **Victory Screen** | 20 min | Share solutions, award badges, celebrate progress, reveal the next quest, and collect quick feedback. |

---

## 3. Session 01 Problem-Solving Takeaways

### A. Watching Out for Integer Overflow (CSES 1068 — Weird Algorithm)
When simulating the Collatz recurrence:
- If $n$ is even: $n \leftarrow n / 2$
- If $n$ is odd: $n \leftarrow 3n + 1$

Even when $n \le 10^6$, the sequence can spike past $2^{31}-1$ (the maximum value of a signed 32-bit integer). Always check data type bounds before writing loops!

### B. Writing Extensible Code in Interviews (LeetCode 412 — Fizz Buzz)
In a mock interview, solving Fizz Buzz takes 2 minutes. The real test is how you respond when the interviewer changes the requirements:
- Avoid rigid chains of `if / elif` for combinations of divisors.
- Prefer data-driven rules (`[(3, "Fizz"), (5, "Buzz")]`) or string accumulation so adding new divisors requires changing data, not control flow.

### C. Space-Time Tradeoffs (LeetCode 349 — Intersection of Two Arrays)
- **Hash Set approach:** $O(n + m)$ time and $O(\min(n, m))$ extra space. Best when inputs are unsorted and fits in memory.
- **Two-Pointer approach:** $O(n \log n + m \log m)$ time (or $O(n + m)$ if already sorted) and $O(1)$ extra space. Always mention both in technical interviews!
