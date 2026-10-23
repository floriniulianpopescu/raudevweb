# RAU DEV `</>` — Engineering Workshop: Git & Collaborative Workflows

**Romanian-American University • Software Engineering Club**  
**Track:** Skill Tree & Party Quest Reference Guide

---

## 1. Why Version Control Matters in Club Projects

Whether you are contributing to a RAU DEV team project, submitting hackathon code, or building your personal portfolio, clean Git habits make collaboration painless.

## 2. Standard Feature-Branch Workflow

```bash
# 1. Clone the repository and switch to main
git clone https://github.com/rau-dev/project-repo.git
cd project-repo

# 2. Create a descriptive branch for your feature or fix
git checkout -b feat/scoreboard-xp-filter

# 3. Stage and commit atomic changes with clear messages
git add .
git commit -m "feat(scoreboard): add XP action breakdown modal per member"

# 4. Push your branch and open a Pull Request
git push -u origin feat/scoreboard-xp-filter
```

## 3. Commit Message Convention

We follow lightweight Conventional Commits:
- `feat:` — A new feature or challenge solution
- `fix:` — A bug fix
- `docs:` — Documentation or lecture notes updates
- `refactor:` — Code improvement that neither fixes a bug nor adds a feature

## 4. Earning Project Contribution XP (+25 XP)
To earn the **+25 XP Project Contribution** action on the RAU DEV Scoreboard:
1. Pick an open issue or propose an enhancement during **Party Quest** (12:50 – 13:40).
2. Submit a clean Pull Request with working code and brief explanation.
3. Review a teammate's PR (+10 XP for *Help another member*).
