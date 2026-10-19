---
name: GitHub synchronization
description: Owner wants GitHub updates; preserve remote changes and distinguish GitHub App API access from workspace Git credentials.
---

The owner wants project changes pushed to GitHub and remote updates preserved. Do not force-push unless explicitly asked.

A GitHub App connector's repository write permission is distinct from Workspace Git/CLI OAuth. Its REST API may work while `git push` rejects credentials.

**Why:** Remote edits can make local and remote branches diverge, and successful API access does not prove that Workspace Git authentication works.

**How to apply:** Before publishing, inspect branch divergence and preserve remote commits. If CLI credentials fail, do not ask for a token in chat; use the connected integration or secure Secrets flow. Explain any change to commit IDs or history and retain a local backup when reconciling branches.
