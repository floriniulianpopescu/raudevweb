"""
RAU DEV </> Software Engineering Club
Session 01 - Weekly Challenge Solution (+15 XP)
Problem: LeetCode 412 - Fizz Buzz
Link: https://leetcode.com/problems/fizz-buzz/

Approach 1: Clean Modulo Evaluation
Approach 2: Scalable Rule Table (Mock Interview Follow-up)
In technical interviews, interviewers often ask: "What if we add 7 -> 'Jazz' and 11 -> 'Bazz'?"
Hardcoding 2^k `elif` branches doesn't scale. Using a rule list keeps the code DRY.
"""

from typing import List


class Solution:
    def fizzBuzz(self, n: int) -> List[str]:
        result: List[str] = []
        for i in range(1, n + 1):
            if i % 15 == 0:
                result.append("FizzBuzz")
            elif i % 3 == 0:
                result.append("Fizz")
            elif i % 5 == 0:
                result.append("Buzz")
            else:
                result.append(str(i))
        return result

    def fizzBuzzScalable(self, n: int) -> List[str]:
        rules = [(3, "Fizz"), (5, "Buzz")]
        result: List[str] = []
        for i in range(1, n + 1):
            word = "".join(label for divisor, label in rules if i % divisor == 0)
            result.append(word if word else str(i))
        return result


if __name__ == "__main__":
    solver = Solution()
    print("n = 15 ->", solver.fizzBuzz(15))
