#!/bin/bash
# Pull the logs out of Supabase and commit them. Safe to run repeatedly: it
# rewrites the same two files and commits only when something actually changed.
#
# Pushing needs the iliyanadov GitHub account. This machine's active account is
# usually iliyanadov-work, so switch and switch back — and switch back even if
# the push fails, or the next unrelated push goes out as the wrong person.
set -uo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$APP"
cd "$REPO" || exit 1

node "$APP/tools/export-logs.mjs" || exit 1

if [ -z "$(git status --porcelain logs/)" ]; then
  echo "export-logs: nothing changed"
  exit 0
fi

DAYS=$(python3 -c "import json;print(len(json.load(open('$REPO/logs/workout-export.json'))['days']))" 2>/dev/null || echo "?")
git add logs/
git -c commit.gpgsign=false commit -q -m "Log export — $(date +%Y-%m-%d), ${DAYS} days" || exit 1

ORIG=$(gh auth status 2>&1 | awk '/Logged in to github.com account/{a=$(NF-1)} /Active account: true/{print a; exit}')
gh auth switch --user iliyanadov >/dev/null 2>&1
git push -q origin main; RC=$?
[ -n "${ORIG:-}" ] && gh auth switch --user "$ORIG" >/dev/null 2>&1

if [ $RC -eq 0 ]; then echo "export-logs: pushed ($DAYS days)"; else echo "export-logs: commit made, PUSH FAILED"; fi
exit $RC
