---
name: Catalog initialization
description: Why baseline catalog loading is an explicit admin action and must stay separate from commerce data.
---

Loading the original product catalog must be an explicit admin action against a fully empty product-and-scent catalog. Do not automatically reseed empty catalogs on server startup.

**Why:** An administrator may intentionally delete every product. Automatic reseeding would undo that decision. Restoring products also does not authorize copying development users and test orders into the live database.

**How to apply:** Keep catalog initialization separate from whole-database replacement. Preserve existing CMS edits and commerce records; reject initialization if either products or scents already exist.