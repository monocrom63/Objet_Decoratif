---
name: Catalog media compatibility
description: Cross-layer requirements when extending catalog media formats without replacing legacy image records.
---

Keep existing catalog media paths compatible when adding media formats. Any format change must cover upload validation, public rendering, managed-file deletion and abandoned-upload cleanup together.

**Why:** Catalog storage historically used extensionless image objects. Videos need a reliable type indication, but changing only uploads or rendering would leave either broken public media or files that cleanup cannot safely remove.

**How to apply:** Derive supported video suffixes from the accepted MIME type, never arbitrary user filenames. Preserve extensionless legacy image URLs. Extend managed-path validation and reference-preserving cleanup for every new supported video suffix; retain byte-range serving so browsers can seek without downloading entire videos.
