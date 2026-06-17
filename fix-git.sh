#!/usr/bin/env bash
set -e

echo "Removing .vercel/output from git tracking..."
git rm --cached -r .vercel/output

echo "Committing..."
git commit -m "chore: remove .vercel/output from git tracking"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "Done! Future Vercel deploys will now run a fresh build."
