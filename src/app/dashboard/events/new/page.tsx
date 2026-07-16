"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuestionDraft = {
  label: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX" | "NUMBER";
  required: boolean;
  options: string;
};

const questionTypeLabel: Record<QuestionDraft["type"], string> = {
  TEXT: "Văn bản ngắn",
  TEXTAREA: "Văn bản dài",
  SELECT: "Chọn 1 trong nhiều",
  CHECKBOX: "Chọn nhiều",
  NUMBER: "Số",
};

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState<"ONLINE" | "OFFLINE" | "HYBRID">(
    "ONLINE"
  );
  const [address, setAddress] = useState("");
  const [onlineLink, setOnlineLink] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("0");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      { label: "", type: "TEXT", required: false, options: "" },
    ]);
  }

  function updateQuestion(i: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        locationType,
        address: address || undefined,
        onlineLink: onlineLink || undefined,
        capacity: capacity ? Number(capacity) : null,
        price: Number(price) || 0,
        requiresApproval,
        questions: questions
          .filter((q) => q.label.trim())
          .map((q) => ({
            label: q.label,
            type: q.type,
            required: q.required,
            options:
              q.type === "SELECT" || q.type === "CHECKBOX"
                ? q.options.split(",").map((o) => o.trim()).filter(Boolean)
                : undefined,
          })),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Có lỗi xảy ra");
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Tạo sự kiện</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <Field label="Tên sự kiện">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Buổi gặp mặt cộng đồng Frontend HCMC"
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-28"
              placeholder="Giới thiệu ngắn gọn về sự kiện..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Bắt đầu">
              <input
                required
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Kết thúc (tuỳ chọn)">
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Hình thức">
            <select
              value={locationType}
              onChange={(e) =>
                setLocationType(e.target.value as "ONLINE" | "OFFLINE" | "HYBRID")
              }
              className="input"
            >
              <option value="ONLINE">Trực tuyến</option>
              <option value="OFFLINE">Trực tiếp</option>
              <option value="HYBRID">Kết hợp</option>
            </select>
          </Field>

          {(locationType === "OFFLINE" || locationType === "HYBRID") && (
            <Field label="Địa điểm">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
              />
            </Field>
          )}
          {(locationType === "ONLINE" || locationType === "HYBRID") && (
            <Field label="Link tham dự">
              <input
                value={onlineLink}
                onChange={(e) => setOnlineLink(e.target.value)}
                className="input"
                placeholder="https://meet.google.com/..."
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Giới hạn số lượng (để trống = không giới hạn)">
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Giá vé (VNĐ, 0 = miễn phí)">
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
            />
            Yêu cầu duyệt trước khi đăng ký được xác nhận
          </label>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Câu hỏi đăng ký tùy chỉnh</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="text-sm underline underline-offset-4"
            >
              + Thêm câu hỏi
            </button>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              className="rounded-lg border border-line p-4 flex flex-col gap-3"
            >
              <div className="flex gap-3">
                <input
                  value={q.label}
                  onChange={(e) => updateQuestion(i, { label: e.target.value })}
                  className="input flex-1"
                  placeholder="Nội dung câu hỏi"
                />
                <select
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(i, {
                      type: e.target.value as QuestionDraft["type"],
                    })
                  }
                  className="input"
                >
                  {Object.entries(questionTypeLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {(q.type === "SELECT" || q.type === "CHECKBOX") && (
                <input
                  value={q.options}
                  onChange={(e) => updateQuestion(i, { options: e.target.value })}
                  className="input"
                  placeholder="Các lựa chọn, cách nhau bởi dấu phẩy"
                />
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) =>
                      updateQuestion(i, { required: e.target.checked })
                    }
                  />
                  Bắt buộc trả lời
                </label>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="text-sm text-danger"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-indigo px-6 py-3 text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
        >
          {loading ? "Đang tạo..." : "Tạo sự kiện"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
