"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tag = { id: string; name: string; color: string };

export function TagsEditor({
  contactId,
  currentTags,
  allTags,
}: {
  contactId: string;
  currentTags: Tag[];
  allTags: Tag[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const currentIds = new Set(currentTags.map((t) => t.id));
  const suggestions = allTags.filter(
    (t) => !currentIds.has(t.id) && t.name.toLowerCase().includes(input.toLowerCase())
  );
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === input.trim().toLowerCase()
  );

  async function attach(tagId?: string, name?: string) {
    setLoading(true);
    await fetch(`/api/contacts/${contactId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tagId ? { tagId } : { name }),
    });
    setLoading(false);
    setInput("");
    setAdding(false);
    router.refresh();
  }

  async function detach(tagId: string) {
    setLoading(true);
    await fetch(`/api/contacts/${contactId}/tags/${tagId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentTags.map((tag) => (
        <span
          key={tag.id}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          <button
            onClick={() => detach(tag.id)}
            disabled={loading}
            className="opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </span>
      ))}

      {adding ? (
        <div className="relative">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) attach(undefined, input.trim());
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Tên thẻ..."
            className="input text-xs py-1 px-2 w-32"
          />
          {input.trim() && (suggestions.length > 0 || !exactMatch) && (
            <div className="absolute z-10 mt-1 w-40 rounded-lg border border-line bg-white shadow-sm overflow-hidden">
              {suggestions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => attach(t.id)}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-ink/5"
                >
                  {t.name}
                </button>
              ))}
              {!exactMatch && (
                <button
                  onClick={() => attach(undefined, input.trim())}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-ink/5 text-indigo"
                >
                  + Tạo thẻ &quot;{input.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-ink/50 hover:border-indigo hover:text-indigo transition-colors"
        >
          + Gắn thẻ
        </button>
      )}
    </div>
  );
}
