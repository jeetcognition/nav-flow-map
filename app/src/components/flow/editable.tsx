// contentEditable primitives for NavFlow's inline edit mode: dashed-outline
// fields that commit to the edits overlay on blur (legacy app affordance).
import { useRef } from "react";

export function EditableText({
  value,
  editable,
  as: Tag = "div",
  className,
  onCommit,
}: {
  value: string;
  editable: boolean;
  as?: "div" | "p" | "li" | "h2";
  className?: string;
  onCommit: (next: string) => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  return (
    <Tag
      // @ts-expect-error — polymorphic ref on intrinsic tags
      ref={ref}
      className={`${className ?? ""} ${editable ? "fp-ed" : ""}`.trim()}
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={() => {
        const next = ref.current?.innerText.trim() ?? "";
        if (next && next !== value) onCommit(next);
      }}
    >
      {value}
    </Tag>
  );
}

export function EditableCell({
  value,
  editable,
  onCommit,
}: {
  value: string;
  editable: boolean;
  onCommit: (v: string) => void;
}) {
  const ref = useRef<HTMLTableCellElement>(null);
  return (
    <td
      ref={ref}
      className={editable ? "fp-ed" : ""}
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={() => {
        const next = ref.current?.innerText.trim() ?? "";
        if (next && next !== value) onCommit(next);
      }}
    >
      {value}
    </td>
  );
}
