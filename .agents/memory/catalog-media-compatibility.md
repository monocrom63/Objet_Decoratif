---
name: Catalog media compatibility
description: Cross-layer requirements when extending catalog media formats without replacing legacy image records.
---

Keep existing catalog media paths compatible when adding media formats. Any format change must cover upload validation, public rendering, managed-file deletion and abandoned-upload cleanup together.

Product scent media and the main Signature Scents media are independently curated. The owner requested 16:9 videos for Scents instead of automatically repeating the product's 9:16 video everywhere.

**Why:** A portrait product composition is not necessarily the intended landscape composition; cropping or stretching the same video does not meet the request.

**How to apply:** Keep the two media choices independent, retain autoplay/muted/loop without player controls publicly, and do not automatically reuse product videos when landscape media is unset. Legacy still images can remain as a compatibility fallback.

The browser-testing Chromium build may decode WebM while rejecting an existing H.264 MP4.

**Why:** Codec availability in the testing browser is not necessarily the same as in visitors' browsers; successful URL delivery alone does not prove decoding.

**How to apply:** Use a small real WebM for deterministic upload/playback fixtures, check decoded dimensions and playback state, and report an existing MP4 codec limitation separately from regressions in media selection or rendering.

**Why:** Catalog storage historically used extensionless image objects. Videos need a reliable type indication, but changing only uploads or rendering would leave either broken public media or files that cleanup cannot safely remove.

**How to apply:** Derive supported video suffixes from the accepted MIME type, never arbitrary user filenames. Preserve extensionless legacy image URLs. Extend managed-path validation and reference-preserving cleanup for every new supported video suffix; retain byte-range serving so browsers can seek without downloading entire videos.

The automated Chromium browser can reject valid H.264/AAC MP4 files with `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, while WebM plays correctly.

**Why:** This occurred both with a controlled H.264 fixture and a real live-shop video whose file metadata and byte-range responses were valid. A test-browser decoder failure alone does not prove an upload or rendering defect.

**How to apply:** Distinguish a missing object (404), an incorrect image element, and a native video decoding failure. Confirm the affected page and the user's browser before changing upload or playback behavior for a decoder-only failure.

Public scent videos should autoplay muted in a continuous loop without player controls, both in Signature Scents and in product scent previews. CMS previews and ordinary product videos are not covered by this rule.

**Why:** The shop owner explicitly requested scent videos as automatic looping media rather than visible players.

**How to apply:** Start or resume the selected scent video and pause it when switching to another scent. Preserve inline mobile playback and keep CMS playback controls for inspecting uploads.

Media navigation arrows should always sit at the bottom right, for both images and videos on desktop and mobile.

**Why:** The shop owner explicitly requested this consistent position after the scent videos were changed to control-free loops.

**How to apply:** Do not move scent or gallery navigation arrows to the top for video playback. Keep them visible above the media.

Catalog media fields can differ between the development and production databases; clearing a field in development does not clear the live CMS record.

**Why:** The same scent had a fallback image in development while production still referenced a missing MP4.

**How to apply:** Before claiming a live media deletion is complete, verify the production catalog separately. Use the authenticated production CMS/API to update live records; do not assume publishing code synchronizes catalog data.
