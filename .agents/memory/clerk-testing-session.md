---
name: Clerk development testing sessions
description: Programmatic testing can establish client auth without a usable same-origin backend session cookie.
---

A development testing helper can report a signed-in Clerk client while authenticated API requests still return 401 because no usable same-origin session cookie was set.

**Why:** A catalog browser test was blocked despite a live client session; explicitly sending that session's Bearer token restored authenticated API access without any app or role changes.

**How to apply:** Before changing authentication code for a test-only failure, check the actual client session and compare a same-origin API request using its current token. In the test harness only, attach the token to same-origin API requests. Never log tokens, send them to other origins, or change user roles to bypass the problem.

Use unique synthetic addresses at `example.com` for programmatic Clerk account tests, rather than addresses ending in `.test`.

**Why:** Guest-order validation accepted a synthetic `.test` address, but Clerk rejected that same address with HTTP 422 before creating a test session. The reserved `example.com` domain allowed the same-email account ownership check to complete successfully.

**How to apply:** Choose the test address before placing an order when a later same-email sign-in is part of the test. Do not interpret Clerk's test-address rejection as a checkout or authentication-code defect.

Provider-side deletion of a synthetic development identity may fail with `403 session_reverification_required` even after its application rows and browser session have been cleaned up.

**Why:** Application-fixture cleanup and authentication-provider cleanup are separate operations with different authorization requirements.

**How to apply:** Verify both independently. Do not claim the provider identity was deleted when it was not, or weaken re-verification requirements just to clean up a test.
