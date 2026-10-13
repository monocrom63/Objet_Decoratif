---
name: Catalog media compatibility
description: Cross-layer requirements when extending catalog media formats without replacing legacy image records.
---

Keep existing catalog media paths compatible when adding media formats. Any format change must cover upload validation, public rendering, managed-file deletion and abandoned-upload cleanup together.

**Why:** Catalog storage historically used extensionless image objects. Videos need a reliable type indication, but changing only uploads or rendering would leave either broken public media or files that cleanup cannot safely remove.

**How to apply:** Derive supported video suffixes from the accepted MIME type, never arbitrary user filenames. Preserve extensionless legacy image URLs. Extend managed-path validation and reference-preserving cleanup for every new supported video suffix; retain byte-range serving so browsers can seek without downloading entire videos.

The automated Chromium browser can reject valid H.264/AAC MP4 files with `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, while WebM plays correctly.

**Why:** This occurred both with a controlled H.264 fixture and a real live-shop video whose file metadata and byte-range responses were valid. A test-browser decoder failure alone does not prove an upload or rendering defect.

**How to apply:** Distinguish a missing object (404), an incorrect image element, and a native video decoding failure. Confirm the affected page and the user's browser before changing upload or playback behavior for a decoder-only failure.

Public scent videos should autoplay muted in a continuous loop without player controls, both in Signature Scents and in product scent previews. CMS previews and ordinary product videos are not covered by this rule.

**Why:** The shop owner explicitly requested scent videos as automatic looping media rather than visible players.

**How to apply:** Start or resume the selected scent video and pause it when switching to another scent. Preserve inline mobile playback and keep CMS playback controls for inspecting uploads.
