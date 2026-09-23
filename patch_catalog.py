import re
with open("artifacts/objet-decoratif-store/src/lib/catalog.ts", "r") as f:
    content = f.read()

old_resolve = """export function resolveImagePath(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("/objects/")) {
    return `/api/storage${path}`;
  }
  if (path.startsWith("http")) {
    return path;
  }
  // Fallback to BASE_URL logic for seeded paths
  return `${import.meta.env.BASE_URL}images/${path.replace(/^\\/+/, "")}`;
}"""

new_resolve = """export function resolveImagePath(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("/objects/")) {
    return `/api/storage${path}`;
  }
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.replace(/^\\/+/, "");
  if (clean.startsWith("images/")) {
    return `${import.meta.env.BASE_URL}${clean}`;
  }
  return `${import.meta.env.BASE_URL}images/${clean}`;
}"""

content = content.replace(old_resolve, new_resolve)

with open("artifacts/objet-decoratif-store/src/lib/catalog.ts", "w") as f:
    f.write(content)
