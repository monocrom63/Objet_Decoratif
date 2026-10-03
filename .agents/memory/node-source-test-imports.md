---
name: Node source-test imports
description: Compatibility constraints for tests that execute TypeScript source directly with Node's type stripping.
---

Runtime imports reached by source-level tests must use explicit `.ts` extensions. Re-exports that only expose TypeScript types should use `export type *` so Node does not try to resolve and load generated type modules at runtime.

**Why:** Node's built-in TypeScript stripping does not add ESM extensions or distinguish type-only barrel contents unless they are declared as type exports, even though the normal bundled build resolves them.

**How to apply:** When a new API test imports a route that reaches workspace source packages, make runtime import extensions explicit and keep generated type barrels type-only.

Code generation can append extensionless runtime exports to an already-correct source barrel. Preserve the explicit-extension/type-only exports after generation, not only after hand edits.

**Why:** The bundled build still succeeds while Node source tests fail to resolve generated modules.