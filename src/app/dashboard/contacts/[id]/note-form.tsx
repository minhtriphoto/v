"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NoteForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    await fetch(`/api/contacts/${contactId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setLoading(false);
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Thêm ghi chú về khách hàng này..."
        className="input flex-1 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !note.trim()}
        className="rounded-full bg-indigo px-4 py-2 text-sm text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
      >
        Ghi chú
      </button>
    </form>
  );
}
