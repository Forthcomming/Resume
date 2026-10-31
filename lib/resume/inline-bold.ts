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
