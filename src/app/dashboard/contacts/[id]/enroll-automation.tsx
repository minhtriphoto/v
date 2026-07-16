"use client";

import { useEffect, useState } from "react";

type Automation = { id: string; name: string };

export function EnrollAutomation({ contactId }: { contactId: string }) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((data) =>
        setAutomations(
          data
            .filter((a: { triggerType: string }) => a.triggerType === "MANUAL")
            .map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))
        )
      );
  }, []);

  async function enroll() {
    if (!selected) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/automations/${selected}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    setLoading(false);
    setMsg(res.ok ? "Đã thêm vào automation!" : "Có lỗi xảy ra.");
  }

  if (automations.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        className="input text-sm"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Thêm vào automation (thủ công)...</option>
        {automations.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        onClick={enroll}
        disabled={!selected || loading}
        className="rounded-full border border-line px-3 py-1.5 text-xs hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        Thêm
      </button>
      {msg && <span className="text-xs text-ink/50">{msg}</span>}
    </div>
  );
}
