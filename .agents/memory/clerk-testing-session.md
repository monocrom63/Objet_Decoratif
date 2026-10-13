---
name: Clerk development testing sessions
description: Programmatic testing can establish client auth without a usable same-origin backend session cookie.
---

A development testing helper can report a signed-in Clerk client while authenticated API requests still return 401 because no usable same-origin session cookie was set.

**Why:** A catalog browser test was blocked despite a live client session; explicitly sending that session's Bearer token restored authenticated API access without any app or role changes.

**How to apply:** Before changing authentication code for a test-only failure, check the actual client session and compare a same-origin API request using its current token. In the test harness only, attach the token to same-origin API requests. Never log tokens, send them to other origins, or change user roles to bypass the problem.
