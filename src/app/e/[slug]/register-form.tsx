"use client";

import { useState } from "react";

type Question = {
  id: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "NUMBER";
  options: unknown;
  required: boolean;
};

export function RegisterForm({
  slug,
  questions,
  requiresApproval,
}: {
  slug: string;
  questions: Question[];
  requiresApproval: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"APPROVED" | "PENDING" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/public/events/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, answers }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Có lỗi xảy ra");
      return;
    }
    setResult(data.status);
  }

  if (result === "APPROVED") {
    return (
      <ConfirmationMessage
        title="Bạn đã đăng ký thành công!"
        message="Hẹn gặp bạn tại sự kiện. Hãy để ý email để nhận thông tin chi tiết."
      />
    );
  }
  if (result === "PENDING") {
    return (
      <ConfirmationMessage
        title="Đã gửi đăng ký!"
        message="Đăng ký của bạn đang chờ ban tổ chức duyệt. Bạn sẽ nhận email khi được xác nhận."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="font-medium text-sm">
        {requiresApproval ? "Đăng ký (cần duyệt)" : "Đăng ký tham dự"}
      </p>

      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Họ và tên"
        className="input"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="input"
      />

      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {q.label}
            {q.required && <span className="text-danger"> *</span>}
          </label>
          {q.type === "TEXTAREA" ? (
            <textarea
              required={q.required}
              className="input"
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
              }
            />
          ) : q.type === "SELECT" ? (
            <select
              required={q.required}
              className="input"
              defaultValue=""
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
              }
            >
              <option value="" disabled>
                Chọn một lựa chọn
              </option>
              {((q.options as string[]) ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              required={q.required}
              type={q.type === "NUMBER" ? "number" : "text"}
              className="input"
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
              }
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-amber px-6 py-3 text-ink font-semibold hover:brightness-95 transition disabled:opacity-50"
      >
        {loading ? "Đang gửi..." : "Đăng ký ngay"}
      </button>
    </form>
  );
}

function ConfirmationMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="text-center py-6">
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="mt-2 text-sm text-ink/60">{message}</p>
    </div>
  );
}
