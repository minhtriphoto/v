"use client";

import { useState } from "react";
import type { EmailBlock } from "@/lib/email-blocks";

export function AiAssistButton({
  eventTitle,
  onGenerated,
}: {
  eventTitle?: string;
  onGenerated: (result: { subject: string; blocks: EmailBlock[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!brief.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ai/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, eventTitle }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    onGenerated(data);
    setOpen(false);
    setBrief("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-dashed border-indigo px-3 py-1.5 text-xs text-indigo hover:bg-indigo/5 transition-colors"
      >
        ✨ Viết bằng AI
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo/30 bg-indigo/[0.03] p-4 flex flex-col gap-2">
      <p className="text-xs font-medium text-indigo">
        Mô tả nội dung bạn muốn — AI sẽ soạn tiêu đề + nội dung email
      </p>
      <textarea
        autoFocus
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        className="input text-sm min-h-20"
        placeholder="Vd: Nhắc người đã đăng ký rằng sự kiện diễn ra trong 2 ngày nữa, giọng thân thiện, có nút xem chi tiết"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading || !brief.trim()}
          className="rounded-full bg-indigo px-4 py-1.5 text-xs text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
        >
          {loading ? "Đang viết..." : "Tạo nội dung"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink/50"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
