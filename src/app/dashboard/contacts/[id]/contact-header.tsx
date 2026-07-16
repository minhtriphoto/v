"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function scoreTier(score: number): { label: string; className: string } {
  if (score >= 30) return { label: "Rất quan tâm", className: "bg-success/15 text-success" };
  if (score >= 10) return { label: "Quan tâm", className: "bg-amber/20 text-amber" };
  return { label: "Mới", className: "bg-ink/10 text-ink/50" };
}

export function ContactHeader({
  contactId,
  name,
  email,
  phone,
  score,
}: {
  contactId: string;
  name: string | null;
  email: string;
  phone: string | null;
  score: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(name ?? "");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);
  const tier = scoreTier(score);

  async function save() {
    setLoading(true);
    await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput, phone: phoneInput }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <input
          className="input"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Tên"
        />
        <input
          className="input"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder="Số điện thoại"
        />
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={loading}
            className="rounded-full bg-indigo px-4 py-1.5 text-sm text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
          >
            Lưu
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-ink/50"
          >
            Huỷ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          {name || "(chưa có tên)"}
        </h1>
        <p className="text-sm text-ink/60 font-mono mt-1">{email}</p>
        {phone && <p className="text-sm text-ink/60 font-mono">{phone}</p>}
        <span
          className={`inline-block mt-2 rounded-full px-2.5 py-1 text-xs font-medium ${tier.className}`}
        >
          {score} điểm · {tier.label}
        </span>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-sm underline underline-offset-4 whitespace-nowrap"
      >
        Sửa
      </button>
    </div>
  );
}
