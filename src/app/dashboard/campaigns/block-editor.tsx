"use client";

import { useState } from "react";
import { BLOCK_LABELS, createEmptyBlock, type EmailBlock } from "@/lib/email-blocks";

const BLOCK_TYPES = Object.keys(BLOCK_LABELS) as EmailBlock["type"][];

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(i: number, patch: Partial<EmailBlock>) {
    onChange(blocks.map((b, idx) => (idx === i ? ({ ...b, ...patch } as EmailBlock) : b)));
  }

  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }

  function add(type: EmailBlock["type"]) {
    onChange([...blocks, createEmptyBlock(type)]);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink/50">
          Chưa có nội dung — thêm khối bên dưới để bắt đầu soạn email.
        </div>
      )}

      {blocks.map((block, i) => (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(i)}
          className="group rounded-xl border border-line bg-white p-4 cursor-move"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wide text-ink/40">
              ⠿ {BLOCK_LABELS[block.type]}
            </span>
            <button
              onClick={() => remove(i)}
              className="text-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Xoá
            </button>
          </div>

          {block.type === "heading" && (
            <input
              className="input w-full font-display text-lg"
              value={block.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Tiêu đề"
            />
          )}
          {block.type === "paragraph" && (
            <textarea
              className="input w-full min-h-24"
              value={block.text}
              onChange={(e) => update(i, { text: e.target.value })}
              placeholder="Nội dung..."
            />
          )}
          {block.type === "button" && (
            <div className="flex flex-col gap-2">
              <input
                className="input"
                value={block.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Nội dung nút (vd: Xem sự kiện)"
              />
              <input
                className="input"
                value={block.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
          {block.type === "image" && (
            <div className="flex flex-col gap-2">
              <input
                className="input"
                value={block.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="URL hình ảnh (https://...)"
              />
              <input
                className="input"
                value={block.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Mô tả ảnh (alt text)"
              />
            </div>
          )}
          {block.type === "divider" && (
            <hr className="border-t border-line" />
          )}
          {block.type === "spacer" && (
            <div className="h-4 rounded bg-ink/[0.03]" />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 mt-2">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => add(type)}
            className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink/60 hover:border-indigo hover:text-indigo transition-colors"
          >
            + {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
