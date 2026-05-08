---
description: Commit everything in the working tree (if dirty) and push to the connected git remote
---

Commit all current changes and push them to `origin` so the other partners can grab them. Use the Bash tool for every git step. Do NOT force-push or take any other destructive action.

Steps:

1. Run `git status --porcelain` and `git diff --stat` to see what's changed (staged, unstaged, and untracked).
2. **Safety scan:** look at the file list for anything that smells like secrets — `.env*`, `credentials*`, `*.pem`, `*_key`, `id_rsa`, files with "secret"/"token" in the name. If you see any, STOP and ask the user before committing them. Otherwise continue.
3. If the working tree is dirty (status output non-empty):
   - Run `git diff` and `git diff --staged` to understand what actually changed (not just filenames).
   - Stage everything: `git add -A`.
   - Generate a commit message that describes the *why* of the changes in 1-2 sentences. Match the existing repo style (look at `git log --oneline -5` for examples — short imperative subject, optional body).
   - Commit with:
     ```
     git commit -m "$(cat <<'EOF'
     <your message>

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
     EOF
     )"
     ```
   - If a pre-commit hook fails: fix the issue, re-stage, and create a NEW commit (do not `--amend`).
4. Get the current branch: `git rev-parse --abbrev-ref HEAD`.
5. Check upstream: `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null`. If empty, plan to push with `-u origin <branch>` in step 8.
6. Run `git fetch origin` so ahead/behind is accurate.
7. If there's an upstream, run `git rev-list --left-right --count @{u}...HEAD` (output is `<behind> <ahead>`):
   - If **behind > 0**, STOP. Tell the user to run `/latest` first to fast-forward, then re-run `/push`. Do not auto-rebase or auto-merge.
   - If **ahead == 0**, print "Nothing to push." and stop.
8. Show the outgoing commits: `git log --oneline @{u}..HEAD` (or `git log --oneline -5` if no upstream yet).
9. Push:
   - With upstream: `git push`.
   - Without upstream: `git push -u origin <branch>`.
10. Print a one-line summary: branch name, number of commits pushed, and the remote URL (`git remote get-url origin`).
