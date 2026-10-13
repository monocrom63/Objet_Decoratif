---
name: Guest checkout ownership
description: Keep guest orders separate from accounts, including accounts with matching email addresses.
---

Guest ordering must not create an account or grant a store role. Do not automatically attach a guest order to a later account solely because the email address matches.

**Why:** The owner requested ordering without registration. Guest email addresses are customer-entered and unverified, so an email match alone is not a safe ownership link. Guest orders must also not affect first-account admin bootstrapping.

**How to apply:** Preserve authenticated account-order access checks and admin-only order management. Any future guest-order claiming flow needs explicit ownership verification rather than implicit email matching.
