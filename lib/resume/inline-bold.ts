export type InlineBoldSegment = { type: "text" | "bold"; value: string };

export function toggleInlineBoldMarkdown(
  value: string,
  selectionStart: number,
  selectionEnd: number
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = Math.max(
    0,
    Math.min(selectionStart, selectionEnd, value.length)
  );
  const end = Math.max(
    0,
    Math.min(Math.max(selectionStart, selectionEnd), value.length)
  );

  if (start === end) {
    const next = `${value.slice(0, start)}****${value.slice(end)}`;
    return {
      value: next,
      selectionStart: start + 2,
      selectionEnd: start + 2,
    };
  }

  const selected = value.slice(start, end);

  if (
    selected.startsWith("**") &&
    selected.endsWith("**") &&
    selected.length >= 4
  ) {
    const inner = selected.slice(2, -2);
    const next = `${value.slice(0, start)}${inner}${value.slice(end)}`;
    return {
      value: next,
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  if (
    start >= 2 &&
    end + 2 <= value.length &&
    value.slice(start - 2, start) === "**" &&
    value.slice(end, end + 2) === "**"
  ) {
    const next = `${value.slice(0, start - 2)}${selected}${value.slice(end + 2)}`;
    return {
      value: next,
      selectionStart: start - 2,
      selectionEnd: start - 2 + selected.length,
    };
  }

  const wrapped = `**${selected}**`;
  const next = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
  return {
    value: next,
    selectionStart: start,
    selectionEnd: start + wrapped.length,
  };
}

/** Split text into plain / bold segments. Unclosed `**` stay as plain text. */
export function parseInlineBoldSegments(text: string): InlineBoldSegment[] {
  if (!text) return [];
  const segments: InlineBoldSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    segments.push({ type: "bold", value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }
  return segments.length ? segments : [{ type: "text", value: text }];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Markdown (`**bold**`) → HTML for contentEditable. */
export function markdownToEditableHtml(markdown: string): string {
  if (!markdown) return "";
  return escapeHtml(markdown)
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTagsToText(html: string): string {
  return decodeBasicEntities(
    html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
  );
}

/**
 * contentEditable HTML → markdown with `**bold**`.
 * Handles strong/b, br, and simple div/p line breaks.
 */
export function editableHtmlToMarkdown(html: string): string {
  if (!html || html === "<br>" || html === "<br/>") return "";

  let s = html.replace(/\u00a0/g, " ").replace(/&nbsp;/gi, " ");
  // Innermost bold first so nested <strong> flattens into one pair.
  for (let i = 0; i < 8; i += 1) {
    const next = s.replace(
      /<(strong|b)(?:\s[^>]*)?>((?:(?!<\/(?:strong|b)>).)*)<\/\1>/gi,
      (_full, _tag: string, inner: string) => {
        const text = stripTagsToText(inner).replace(/\*\*/g, "");
        return text ? `**${text}**` : "";
      }
    );
    if (next === s) break;
    s = next;
  }
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(?:div|p)>/gi, "\n");
  s = s.replace(/<(?:div|p)(?:\s[^>]*)?>/gi, "");
  s = stripTagsToText(s);
  s = s.replace(/\n{3,}/g, "\n\n");
  if (!s.replace(/\n/g, "").trim()) return "";
  return s.replace(/\n+$/g, "");
}
