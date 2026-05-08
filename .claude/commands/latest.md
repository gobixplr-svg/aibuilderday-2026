---
description: Pull the latest from the connected git remote (safe; bails on dirty tree)
---

Pull the latest from `origin` for the current branch. Use the Bash tool for every git step. Do NOT take destructive actions — if anything looks unsafe, stop and report.

Steps:

1. Run `git status --porcelain`.
   - If output is **non-empty**, STOP. Show the dirty files and tell the user to commit, stash, or discard before re-running `/latest`. Do not pull.
2. Run `git fetch origin`.
3. Get the current branch: `git rev-parse --abbrev-ref HEAD`.
4. Count incoming commits: `git rev-list --count HEAD..@{u}`.
   - If the count is `0`, print "Already up to date." and stop.
5. Show what's coming in: `git log --oneline HEAD..@{u}`.
6. Run `git pull --ff-only`.
   - If this fails because the branch has diverged, STOP. Tell the user the branch can't be fast-forwarded and they'll need to rebase or merge manually. Do NOT attempt a merge or rebase yourself.
7. Print a one-line summary: branch name, number of commits pulled, and a short list of files changed (`git diff --stat HEAD@{1} HEAD`).
