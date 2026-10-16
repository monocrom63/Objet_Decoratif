---
name: Guest checkout ownership
description: Keep guest orders separate from accounts, including accounts with matching email addresses.
---

Guest ordering must not create an account or grant a store role. Do not automatically attach a guest order to a later account solely because the email address matches.

**Why:** The owner requested ordering without registration. Guest email addresses are customer-entered and unverified, so an email match alone is not a safe ownership link. Guest orders must also not affect first-account admin bootstrapping.

**How to apply:** Preserve authenticated account-order access checks and admin-only order management. Any future guest-order claiming flow needs explicit ownership verification rather than implicit email matching.

Send a transactional order receipt to the email entered for the guest order, but do not create a marketing contact or treat the address as account verification.

**Why:** Providing an order email is necessary for delivery communication; it does not imply marketing consent or prove account ownership.

**How to apply:** Keep confirmation emails tied to the guest order and leave the guest order unlinked to user accounts.

The owner plans to integrate a payment provider later; until then, preserve the existing pre-provider checkout behavior and its notice that no payment is charged.

**Why:** The owner explicitly asked to restore the prior payment state and defer payment-provider integration.

**How to apply:** Do not add a manual payment request or claim an online payment is complete before the owner selects and connects a real provider.
