---
name: CMS copy preservation
description: Protect administrator-entered German CMS text from automatic translation or normalization.
---

English and German CMS copy are separate values. Treat saved German copy as owner-authored content across products, scents, About, and Care: never translate into it or trim/normalize it during saving or display. Use the existing translation only when the German field is empty.

**Why:** The owner explicitly requires entered German text to remain unchanged by translation, including About and Care copy.

**How to apply:** Persist each language field exactly as entered and render German copy verbatim when non-empty. Only fall back to the existing German translation when no saved German value exists.
