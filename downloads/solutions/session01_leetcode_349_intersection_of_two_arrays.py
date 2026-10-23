"""
RAU DEV </> Software Engineering Club
Session 01 - Optional Challenge Solution (+20 XP / Harder Challenge)
Problem: LeetCode 349 - Intersection of Two Arrays
Link: https://leetcode.com/problems/intersection-of-two-arrays/

Approaches Covered:
1. Hash Set Intersection - O(n + m) Time, O(min(n, m)) Space
2. Two-Pointer Sorted Traversal - O(n log n + m log m) Time, O(1) Auxiliary Space
   (Common follow-up question when arrays are already sorted or memory is constrained!)
"""

from typing import List


class Solution:
    def intersection(self, nums1: List[int], nums2: List[int]) -> List[int]:
        # Convert the smaller list to a set first for optimal memory footprint
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        seen = set(nums1)
        result = []
        for x in nums2:
            if x in seen:
                result.append(x)
                seen.remove(x)  # Ensures uniqueness without a second set
        return result

    def intersectionTwoPointers(self, nums1: List[int], nums2: List[int]) -> List[int]:
        nums1.sort()
        nums2.sort()
        i, j = 0, 0
        result: List[int] = []

        while i < len(nums1) and j < len(nums2):
            if nums1[i] < nums2[j]:
                i += 1
            elif nums1[i] > nums2[j]:
                j += 1
            else:
                if not result or result[-1] != nums1[i]:
                    result.append(nums1[i])
                i += 1
                j += 1

        return result


if __name__ == "__main__":
    s = Solution()
    print(s.intersection([4, 9, 5], [9, 4, 9, 8, 4]))  # [9, 4]
