---
name: Store account roles
description: Durable authorization rule for bootstrapping the store administration.
---

The first authenticated account created while no admin exists receives the `admin` role. Later accounts default to `customer`, except explicitly approved administrators whose primary email has been verified by the authentication provider.

**Why:** The store needs a secure initial administrator without hardcoding a personal email address or exposing an unprotected role-selection screen.

**How to apply:** Preserve this bootstrap rule when extending authentication or user administration. Any later role changes must be restricted to authenticated admins.

The owner requires additional shop administrators to have the same unrestricted shop permissions as the existing admin, including image uploads and catalog management. Do not create a limited editor role for these accounts.

**Why:** The owner explicitly requested full, unrestricted shop administration for additional administrators.

**How to apply:** Use the existing full admin role. Keep account approval server-side and require verified email ownership before granting additional access. Do not store individual administrator addresses in agent memory.