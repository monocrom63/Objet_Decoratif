---
name: Store navigation interaction
description: Owner-requested rollover submenus and the overlay-versus-reflow decision.
---

Desktop header submenus should open on rollover and may overlay the content below instead of moving the page.

**Why:** The owner explicitly requested rollover submenus and allowed them to cover the next section. An overlay preserves the page layout while browsing categories.

**How to apply:** Keep the pointer transition from a heading into its submenu usable without flicker. Preserve tap and keyboard access rather than making navigation hover-only.
