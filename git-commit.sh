#!/usr/bin/env bash
set -e

# Simple Conventional Commit helper (bash/git-bash)
# Usage: ./git-commit.sh <type> [scope]
# Example: ./git-commit.sh feat api

type="$1"
scope="$2"

if [ -z "$type" ]; then
  echo "Usage: $0 <type> [scope]"
  echo "Types: feat, fix, docs, chore, refactor, test"
  exit 1
fi

read -p "Short summary (imperative, present tense): " summary
if [ -z "$summary" ]; then
  echo "Aborting: empty summary"
  exit 1
fi

if [ -z "$scope" ]; then
  header="$type: $summary"
else
  header="$type($scope): $summary"
fi

echo "Staging all changes..."
git add -A

echo "Commit message: $header"
read -p "Proceed with commit? [y/N] " confirm
confirm=${confirm:-N}
if [[ "$confirm" =~ ^[Yy] ]]; then
  git commit -m "$header"
  echo "Committed: $header"
else
  echo "Aborted by user."
fi
