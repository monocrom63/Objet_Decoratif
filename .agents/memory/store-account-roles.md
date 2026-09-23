---
name: Store account roles
description: Durable authorization rule for bootstrapping the store administration.
---

The first authenticated account created while no admin exists receives the `admin` role. Every later account defaults to `customer`.

**Why:** The store needs a secure initial administrator without hardcoding a personal email address or exposing an unprotected role-selection screen.

**How to apply:** Preserve this bootstrap rule when extending authentication or user administration. Any later role changes must be restricted to authenticated admins.