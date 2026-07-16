"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Answer = { questionId: string; value: string };
type Question = { id: string; label: string };
type Registration = {
  id: string;
  contactId: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  registeredAt: string;
  checkedInAt: string | null;
  answers: Answer[];
};

const statusStyle: Record<Registration["status"], string> = {
  PENDING: "bg-amber/20 text-amber",
  APPROVED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  CANCELED: "bg-ink/10 text-ink/50",
};

const statusLabel: Record<Registration["status"], string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELED: "Đã huỷ",
};

export function RegistrationsTable({
  eventId,
  registrations,
  questions,
  requiresApproval,
}: {
  eventId: string;
  registrations: Registration[];
  questions: Question[];
  requiresApproval: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(regId: string, status: Registration["status"]) {
    setPendingId(regId);
    await fetch(`/api/events/${eventId}/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function toggleCheckIn(regId: string) {
    setPendingId(regId);
    await fetch(`/api/events/${eventId}/registrations/${regId}/check-in`, {
      method: "POST",
    });
    setPendingId(null);
    router.refresh();
  }

  if (registrations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-12 text-center">
        <p className="text-ink/60">Chưa có ai đăng ký sự kiện này.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <a
          href={`/api/events/${eventId}/registrations?export=csv`}
          className="text-sm underline underline-offset-4"
        >
          Xuất CSV
        </a>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-ink/[0.03] text-left">
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Email</th>
              {questions.map((q) => (
                <th key={q.id} className="px-4 py-3 font-medium">
                  {q.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Check-in</th>
              {requiresApproval && (
                <th className="px-4 py-3 font-medium">Hành động</th>
              )}
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/contacts/${r.contactId}`}
                    className="hover:underline"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                {questions.map((q) => (
                  <td key={q.id} className="px-4 py-3">
                    {r.answers.find((a) => a.questionId === q.id)?.value ?? "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[r.status]}`}
                  >
                    {statusLabel[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={pendingId === r.id || r.status !== "APPROVED"}
                    onClick={() => toggleCheckIn(r.id)}
                    title={
                      r.status !== "APPROVED"
                        ? "Chỉ check-in được người đã duyệt"
                        : undefined
                    }
                    className={`text-xs underline underline-offset-4 disabled:opacity-40 ${
                      r.checkedInAt ? "text-success" : "text-ink/50"
                    }`}
                  >
                    {r.checkedInAt ? "Đã vào" : "Check-in"}
                  </button>
                </td>
                {requiresApproval && (
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          disabled={pendingId === r.id}
                          onClick={() => updateStatus(r.id, "APPROVED")}
                          className="text-success underline underline-offset-4 disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          disabled={pendingId === r.id}
                          onClick={() => updateStatus(r.id, "REJECTED")}
                          className="text-danger underline underline-offset-4 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={pendingId === r.id}
                        onClick={() => updateStatus(r.id, "PENDING")}
                        className="text-ink/50 underline underline-offset-4 disabled:opacity-50"
                      >
                        Đặt lại
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
