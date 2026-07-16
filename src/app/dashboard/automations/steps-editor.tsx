"use client";

import { useState } from "react";
import { BlockEditor } from "../campaigns/block-editor";
import { AiAssistButton } from "../ai-assist-button";
import type { EmailBlock } from "@/lib/email-blocks";

type SendEmailConfig = { subject: string; contentBlocks: EmailBlock[] };
type WaitConfig = { hours: number };
type ConditionConfig = { minScore: number; ifTrueOrder: number; ifFalseOrder: number };
type AddTagConfig = { tagName: string; color?: string };

export type AutomationStepDraft =
  | { localId: string; type: "SEND_EMAIL"; config: SendEmailConfig }
  | { localId: string; type: "WAIT"; config: WaitConfig }
  | { localId: string; type: "CONDITION_BRANCH"; config: ConditionConfig }
  | { localId: string; type: "ADD_TAG"; config: AddTagConfig };

const STEP_LABELS: Record<AutomationStepDraft["type"], string> = {
  SEND_EMAIL: "Gửi email",
  WAIT: "Chờ",
  CONDITION_BRANCH: "Rẽ nhánh theo điểm",
  ADD_TAG: "Gắn thẻ",
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createEmptyStep(type: AutomationStepDraft["type"]): AutomationStepDraft {
  const localId = randomId();
  switch (type) {
    case "SEND_EMAIL":
      return { localId, type, config: { subject: "", contentBlocks: [] } };
    case "WAIT":
      return { localId, type, config: { hours: 24 } };
    case "CONDITION_BRANCH":
      return { localId, type, config: { minScore: 10, ifTrueOrder: 0, ifFalseOrder: 0 } };
    case "ADD_TAG":
      return { localId, type, config: { tagName: "", color: "#3730a9" } };
  }
}

function stepSummary(step: AutomationStepDraft): string {
  switch (step.type) {
    case "SEND_EMAIL":
      return step.config.subject || "(chưa có tiêu đề)";
    case "WAIT":
      return step.config.hours % 24 === 0
        ? `${step.config.hours / 24} ngày`
        : `${step.config.hours} giờ`;
    case "CONDITION_BRANCH":
      return `Điểm ≥ ${step.config.minScore}?`;
    case "ADD_TAG":
      return step.config.tagName || "(chưa đặt tên thẻ)";
  }
}

export function StepsEditor({
  steps,
  onChange,
  eventTitle,
}: {
  steps: AutomationStepDraft[];
  onChange: (steps: AutomationStepDraft[]) => void;
  eventTitle?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(i: number, step: AutomationStepDraft) {
    onChange(steps.map((s, idx) => (idx === i ? step : s)));
  }
  function remove(i: number) {
    onChange(steps.filter((_, idx) => idx !== i));
  }
  function add(type: AutomationStepDraft["type"]) {
    onChange([...steps, createEmptyStep(type)]);
  }
  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...steps];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  const stepOptions = [
    ...steps.map((s, i) => ({
      value: i,
      label: `Bước ${i + 1}: ${STEP_LABELS[s.type]} — ${stepSummary(s)}`,
    })),
    { value: steps.length, label: "Kết thúc automation" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {steps.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink/50">
          Chưa có bước nào — thêm bước đầu tiên bên dưới.
        </div>
      )}

      {steps.map((step, i) => (
        <div
          key={step.localId}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(i)}
          className="group rounded-xl border border-line bg-white p-4 cursor-move"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wide text-ink/40">
              ⠿ Bước {i + 1} · {STEP_LABELS[step.type]}
            </span>
            <button
              onClick={() => remove(i)}
              className="text-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Xoá
            </button>
          </div>

          {step.type === "SEND_EMAIL" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Tiêu đề email"
                  value={step.config.subject}
                  onChange={(e) =>
                    update(i, { ...step, config: { ...step.config, subject: e.target.value } })
                  }
                />
                <AiAssistButton
                  eventTitle={eventTitle}
                  onGenerated={(result) =>
                    update(i, {
                      ...step,
                      config: { subject: result.subject, contentBlocks: result.blocks },
                    })
                  }
                />
              </div>
              <BlockEditor
                blocks={step.config.contentBlocks}
                onChange={(blocks) =>
                  update(i, { ...step, config: { ...step.config, contentBlocks: blocks } })
                }
              />
            </div>
          )}

          {step.type === "WAIT" && (
            <div className="flex items-center gap-2 text-sm">
              <span>Chờ</span>
              <input
                type="number"
                min={1}
                className="input w-24"
                value={step.config.hours}
                onChange={(e) =>
                  update(i, { ...step, config: { hours: Number(e.target.value) || 1 } })
                }
              />
              <span className="text-ink/60">giờ</span>
              <div className="flex gap-1 ml-2">
                {[1, 24, 72, 168].map((h) => (
                  <button
                    key={h}
                    onClick={() => update(i, { ...step, config: { hours: h } })}
                    className="rounded-full border border-line px-2 py-0.5 text-xs text-ink/60 hover:border-indigo"
                  >
                    {h === 1 ? "1 giờ" : `${h / 24} ngày`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step.type === "CONDITION_BRANCH" && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span>Nếu điểm quan tâm ≥</span>
                <input
                  type="number"
                  className="input w-20"
                  value={step.config.minScore}
                  onChange={(e) =>
                    update(i, {
                      ...step,
                      config: { ...step.config, minScore: Number(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-2">
                <span className="w-20 text-ink/60">Đúng →</span>
                <select
                  className="input flex-1"
                  value={step.config.ifTrueOrder}
                  onChange={(e) =>
                    update(i, {
                      ...step,
                      config: { ...step.config, ifTrueOrder: Number(e.target.value) },
                    })
                  }
                >
                  {stepOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="w-20 text-ink/60">Sai →</span>
                <select
                  className="input flex-1"
                  value={step.config.ifFalseOrder}
                  onChange={(e) =>
                    update(i, {
                      ...step,
                      config: { ...step.config, ifFalseOrder: Number(e.target.value) },
                    })
                  }
                >
                  {stepOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-ink/40">
                Lưu ý: nếu bạn thêm/xoá/sắp xếp lại các bước sau khi chọn, hãy kiểm tra lại 2 lựa chọn này.
              </p>
            </div>
          )}

          {step.type === "ADD_TAG" && (
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Tên thẻ"
                value={step.config.tagName}
                onChange={(e) =>
                  update(i, { ...step, config: { ...step.config, tagName: e.target.value } })
                }
              />
              <input
                type="color"
                className="h-9 w-12 rounded border border-line"
                value={step.config.color ?? "#3730a9"}
                onChange={(e) =>
                  update(i, { ...step, config: { ...step.config, color: e.target.value } })
                }
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 mt-2">
        {(Object.keys(STEP_LABELS) as AutomationStepDraft["type"][]).map((type) => (
          <button
            key={type}
            onClick={() => add(type)}
            className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink/60 hover:border-indigo hover:text-indigo transition-colors"
          >
            + {STEP_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
