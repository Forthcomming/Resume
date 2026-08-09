# Import avatar extraction design

## Goal

When a user uploads a PDF/DOCX resume, automatically fill `basic_info.avatar` with a best-guess photo if one can be extracted. Manual upload remains the fallback.

## Behavior

- On parse success, if a suitable embedded image is found, set `content.basic_info.avatar` to a data URL (same shape as editor upload).
- If none / extraction fails: leave avatar empty; import still succeeds.
- User can replace via existing AvatarField.
- Out of scope: multi-image picker, logos/certificates library, scanned-page OCR crop, vision models.

## Selection heuristic

Among embedded images that pass filters:

1. Prefer near-square aspect ratio (e.g. 0.7–1.4)
2. Prefer moderate size (reject tiny icons; prefer largest among remaining)
3. Prefer earlier in document order (resume photos usually near top)

Filters: min edge length (e.g. ≥64px if dimensions known), reject extreme aspect ratios (banners/lines).

Size cap: compress/resize so data URL payload roughly ≤ 2MB (align with AvatarField).

## Pipeline

1. Read file buffer once.
2. Extract text (existing) + extract candidate images (new).
3. AI parse text → structured content.
4. Pick best image → assign `avatar` if empty.
5. Persist resume as today.

## Formats

- **DOCX:** embedded media via mammoth image API or zip `word/media/*`.
- **PDF:** embedded image XObjects via unpdf/pdf.js document proxy; skip if none.

Failures are silent (log server-side only).

## Success criteria

- DOCX/PDF with clear portrait photo often auto-fills avatar.
- Decorative-only or image-less files still import text.
- Manual avatar upload still works and overwrites.
