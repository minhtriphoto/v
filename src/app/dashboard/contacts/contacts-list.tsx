"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Tag = { id: string; name: string; color: string };
type Contact = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  score: number;
  createdAt: string;
  tags: { tag: Tag }[];
  _count: { registrations: number };
};

function scoreTier(score: number): { label: string; className: string } {
  if (score >= 30) return { label: "Rất quan tâm", className: "bg-success/15 text-success" };
  if (score >= 10) return { label: "Quan tâm", className: "bg-amber/20 text-amber" };
  return { label: "Mới", className: "bg-ink/10 text-ink/50" };
}

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<"score" | "recent">("score");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (tagFilter) params.set("tag", tagFilter);
    params.set("sort", sort);
    const data = await fetch(`/api/contacts?${params.toString()}`).then((r) => r.json());
    setContacts(data);
  }, [search, tagFilter, sort]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setTags);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce khi gõ tìm kiếm
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="input flex-1 min-w-48"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="input"
        >
          <option value="">Tất cả thẻ</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "score" | "recent")}
          className="input"
        >
          <option value="score">Điểm cao nhất</option>
          <option value="recent">Mới nhất</option>
        </select>
      </div>

      {!contacts ? (
        <p className="text-sm text-ink/50">Đang tải...</p>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-ink/60">Chưa có khách hàng nào phù hợp.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-ink/[0.03] text-left">
                <th className="px-4 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Thẻ</th>
                <th className="px-4 py-3 font-medium">Số sự kiện</th>
                <th className="px-4 py-3 font-medium">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const tier = scoreTier(c.score);
                return (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/contacts/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name || "(chưa có tên)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-2 py-0.5 text-xs text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{c._count.registrations}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${tier.className}`}
                      >
                        {c.score} · {tier.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
