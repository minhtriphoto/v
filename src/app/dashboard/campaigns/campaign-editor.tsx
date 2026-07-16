"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BlockEditor } from "./block-editor";
import { AiAssistButton } from "../ai-assist-button";
import type { EmailBlock } from "@/lib/email-blocks";

type Tag = { id: string; name: string; color: string };

type InitialCampaign = {
  id: string;
  name: string;
  subject: string;
  contentBlocks: EmailBlock[];
  filterQuery: { tagIds?: string[]; minScore?: number };
};

export function CampaignEditor({ initial }: { initial?: InitialCampaign }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [blocks, setBlocks] = useState<EmailBlock[]>(initial?.contentBlocks ?? []);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<string[]>(initial?.filterQuery?.tagIds ?? []);
  const [minScore, setMinScore] = useState<string>(
    initial?.filterQuery?.minScore != null ? String(initial.filterQuery.minScore) : ""
  );
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  const refreshAudienceCount = useCallback(async () => {
    const res = await fetch("/api/campaigns/audience-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tagIds,
        minScore: minScore ? Number(minScore) : undefined,
      }),
    });
    const data = await res.json();
    setAudienceCount(data.count);
  }, [tagIds, minScore]);

  useEffect(() => {
    const t = setTimeout(refreshAudienceCount, 200);
    return () => clearTimeout(t);
  }, [refreshAudienceCount]);

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function save(): Promise<string | null> {
    setError(null);
    const payload = {
      name,
      subject,
      contentBlocks: blocks,
      filterQuery: { tagIds, minScore: minScore ? Number(minScore) : undefined },
    };

    if (initial) {
      const res = await fetch(`/api/campaigns/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return null;
      }
      return initial.id;
    } else {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return null;
      }
      return data.id;
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    const id = await save();
    setSaving(false);
    if (id && !initial) router.push(`/dashboard/campaigns/${id}`);
    else router.refresh();
  }

  async function handleSend() {
    if (!confirm(`Gửi email tới ${audienceCount ?? 0} người nhận? Không thể huỷ sau khi gửi.`)) {
      return;
    }
    setSending(true);
    const id = await save();
    if (!id) {
      setSending(false);
      return;
    }
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push(`/dashboard/campaigns/${id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Tên chiến dịch (nội bộ)</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhắc lịch Workshop tháng 8"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Tiêu đề email</span>
          <input
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="🎉 Sắp diễn ra: Workshop của bạn"
          />
        </label>
      </section>

      <section>
        <h2 className="font-medium mb-3">Người nhận</h2>
        <div className="rounded-xl border border-line p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm text-ink/60 mb-2">
              Lọc theo thẻ (bỏ trống = tất cả khách hàng)
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full px-3 py-1 text-xs transition-opacity"
                  style={{
                    backgroundColor: tag.color,
                    color: "white",
                    opacity: tagIds.includes(tag.id) ? 1 : 0.35,
                  }}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-ink/40">Chưa có thẻ nào.</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink/60">Điểm quan tâm tối thiểu</span>
            <input
              type="number"
              min={0}
              className="input w-24"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0"
            />
          </label>
          <p className="text-sm font-medium text-indigo">
            {audienceCount === null ? "Đang tính..." : `${audienceCount} người sẽ nhận email`}
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Nội dung email</h2>
          <AiAssistButton
            onGenerated={(result) => {
              setSubject(result.subject);
              setBlocks(result.blocks);
            }}
          />
        </div>
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={saving || sending || !name || !subject}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu nháp"}
        </button>
        <button
          onClick={handleSend}
          disabled={
            saving || sending || !name || !subject || blocks.length === 0 || !audienceCount
          }
          className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:brightness-95 transition disabled:opacity-50"
        >
          {sending ? "Đang gửi..." : "Gửi ngay"}
        </button>
      </div>
    </div>
  );
}
