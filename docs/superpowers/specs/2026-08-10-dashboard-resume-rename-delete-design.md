# Dashboard resume rename & delete

## Goal

From the resume library cards: rename and delete via a hover `⋯` menu; keep most-recently-edited resumes first.

## Behavior

- Hover card → show `⋯` (touch: always visible).
- Menu: **重命名** / **删除**.
- Clicks on `⋯`/menu do not open the editor.
- Rename: dialog with title field; save updates local index + cloud title when synced; bumps `updatedAt`.
- Delete: confirm copy「确定删除这份简历？此操作不可恢复」; then remove cloud row (if any) + local index/content/versions.
- Sort: `updatedAt` desc. Merged list prefers newer of local vs server metadata so edits sort correctly before refresh.

## Out of scope

Batch delete, trash/undo, drag reorder.
