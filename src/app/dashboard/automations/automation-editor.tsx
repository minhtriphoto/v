"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepsEditor, type AutomationStepDraft } from "./steps-editor";

type EventOption = { id: string; title: string };

type Trigger = "ON_REGISTER" | "ON_APPROVED" | "DAYS_BEFORE_EVENT" | "DAYS_AFTER_EVENT" | "MANUAL";

const TRIGGER_LABELS: Record<Trigger, string> = {
  ON_REGISTER: "Ngay khi có người đăng ký",
  ON_APPROVED: "Ngay khi đăng ký được duyệt",
  DAYS_BEFORE_EVENT: "Số ngày trước sự kiện",
  DAYS_AFTER_EVENT: "Số ngày sau sự kiện",
  MANUAL: "Thêm thủ công (từ trang khách hàng)",
};

type InitialAutomation = {
  id: string;
  name: string;
  eventId: string | null;
  triggerType: Trigger;
  offsetDays: number | null;
  status: "ACTIVE" | "PAUSED";
  steps: AutomationStepDraft[];
};

export function AutomationEditor({ initial }: { initial?: InitialAutomation }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState(initial?.eventId ?? "");
  const [triggerType, setTriggerType] = useState<Trigger>(initial?.triggerType ?? "ON_REGISTER");
  const [offsetDays, setOffsetDays] = useState(String(initial?.offsetDays ?? 1));
  const [steps, setSteps] = useState<AutomationStepDraft[]>(initial?.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => setEvents(data.map((e: { id: string; title: string }) => ({ id: e.id, title: e.title }))));
  }, []);

  const selectedEvent = events.find((e) => e.id === eventId);
  const needsEvent = triggerType !== "MANUAL";
  const needsOffset = triggerType === "DAYS_BEFORE_EVENT" || triggerType === "DAYS_AFTER_EVENT";

  async function save(): Promise<string | null> {
    setError(null);
    const stepsPayload = steps.map(({ type, config }) => ({ type, config }));

    if (initial) {
      const res = await fetch(`/api/automations/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, steps: stepsPayload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return null;
      }
      return initial.id;
    }

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        eventId: needsEvent ? eventId : null,
        triggerType,
        offsetDays: needsOffset ? Number(offsetDays) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return null;
    }

    if (stepsPayload.length > 0) {
      await fetch(`/api/automations/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: stepsPayload }),
      });
    }
    return data.id;
  }

  async function handleSave() {
    setSaving(true);
    const id = await save();
    setSaving(false);
    if (id) {
      if (!initial) router.push(`/dashboard/automations/${id}`);
      else router.refresh();
    }
  }

  async function toggleStatus() {
    if (!initial) return;
    setSaving(true);
    await fetch(`/api/automations/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: initial.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
    });
    setSaving(false);
    router.refresh();
  }

  async function runNow() {
    if (!initial) return;
    setRunning(true);
    setMsg(null);
    const res = await fetch(`/api/automations/${initial.id}/run-now`, { method: "POST" });
    const data = await res.json();
    setRunning(false);
    setMsg(`Đã xử lý ${data.processed} người đang chờ đến lượt.`);
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm("Xoá automation này? Không thể hoàn tác.")) return;
    await fetch(`/api/automations/${initial.id}`, { method: "DELETE" });
    router.push("/dashboard/automations");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Tên automation (nội bộ)</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chăm sóc người đăng ký Workshop tháng 8"
          />
        </label>

        {!initial && (
          <>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Kích hoạt khi nào?</span>
              <select
                className="input"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as Trigger)}
              >
                {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {needsEvent && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Áp dụng cho sự kiện</span>
                <select
                  className="input"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                >
                  <option value="">Chọn sự kiện...</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {needsOffset && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  Số ngày {triggerType === "DAYS_BEFORE_EVENT" ? "trước" : "sau"} ngày bắt đầu sự kiện
                </span>
                <input
                  type="number"
                  min={0}
                  className="input w-32"
                  value={offsetDays}
                  onChange={(e) => setOffsetDays(e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {initial && (
          <div className="rounded-lg bg-ink/[0.03] px-4 py-3 text-sm text-ink/60">
            Kích hoạt: <strong>{TRIGGER_LABELS[initial.triggerType]}</strong>
            {selectedEvent && <> · Sự kiện: <strong>{selectedEvent.title}</strong></>}
            {needsOffset && initial.offsetDays != null && (
              <> · {initial.offsetDays} ngày</>
            )}
            <p className="text-xs text-ink/40 mt-1">
              Không thể đổi sự kiện/điều kiện kích hoạt sau khi tạo — tạo automation mới nếu cần đổi.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Các bước chăm sóc</h2>
        <StepsEditor steps={steps} onChange={setSteps} eventTitle={selectedEvent?.title} />
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      {msg && <p className="text-sm text-success">{msg}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !name || (needsEvent && !initial && !eventId)}
          className="rounded-full bg-indigo px-5 py-2.5 text-sm text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Tạo automation"}
        </button>

        {initial && (
          <>
            <button
              onClick={toggleStatus}
              disabled={saving}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
            >
              {initial.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt lại"}
            </button>
            <button
              onClick={runNow}
              disabled={running}
              className="text-sm underline underline-offset-4 disabled:opacity-50"
            >
              {running ? "Đang chạy..." : "Chạy thử ngay"}
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-danger underline underline-offset-4 ml-auto"
            >
              Xoá automation
            </button>
          </>
        )}
      </div>
    </div>
  );
}
