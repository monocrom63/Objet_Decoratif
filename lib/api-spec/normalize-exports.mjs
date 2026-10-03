import { writeFile } from "node:fs/promises";

// Orval appends extensionless runtime exports to the workspace barrel.
// Keep the generated Zod API usable in Node's source-level TypeScript tests.
await writeFile(
  new URL("../api-zod/src/index.ts", import.meta.url),
  'export * from "./generated/api.ts";\nexport type * from "./generated/types/index.ts";\n',
);