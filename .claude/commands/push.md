---
description: Push local commits to the connected git remote so partners can pull them
---

Push local commits on the current branch to `origin` so the other partners can `/latest` and grab them. Use the Bash tool for every git step. Do NOT auto-commit, force-push, or take any destructive action — if anything looks unsafe, stop and report.

Steps:

1. Run `git status --porcelain`.
   - If output is **non-empty**, STOP. Show the dirty files and tell the user to commit them first (committing should be intentional — don't auto-commit on their behalf). Do not push.
2. Get the current branch: `git rev-parse --abbrev-ref HEAD`.
3. Check whether the branch has an upstream: `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null`.
   - If it errors / returns nothing, the branch has no upstream — plan to use `git push -u origin <branch>` in step 7.
4. Run `git fetch origin` so ahead/behind counts are accurate.
5. If the branch has an upstream, compare against it: `git rev-list --left-right --count @{u}...HEAD` (output is `<behind> <ahead>`).
   - If **behind > 0**, STOP. Tell the user to run `/latest` first to fast-forward, then re-run `/push`.
   - If **ahead == 0**, print "Nothing to push." and stop.
6. Show outgoing commits: `git log --oneline @{u}..HEAD` (or `git log --oneline` if there's no upstream yet).
7. Push:
   - With upstream: `git push`.
   - Without upstream: `git push -u origin <branch>` (using the branch from step 2).
8. Print a one-line summary: branch name, number of commits pushed, and the remote URL (`git remote get-url origin`).
