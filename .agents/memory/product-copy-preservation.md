---
name: Catalog copy preservation
description: Protect administrator-entered German product and scent text from automatic translation or normalization.
---

English catalog copy and administrator-entered German product or scent copy are separate values. Treat saved German copy as owner-authored content: never translate into it or trim/normalize it during saving or display. Use the existing translation only when the German field is empty.

**Why:** The owner explicitly requires entered product text to remain unchanged by translation.

**How to apply:** Persist German product and scent fields exactly as entered, and render them verbatim for German visitors when non-empty. Only fall back to translated English copy when the saved German value is blank.
