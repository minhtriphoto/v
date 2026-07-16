import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationEditor } from "../automation-editor";
import type { AutomationStepDraft } from "../steps-editor";

function randomLocalId() {
  return Math.random().toString(36).slice(2, 10);
}

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const automation = await prisma.automation.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrollments: true,
    },
  });
  if (!automation || automation.ownerId !== userId) notFound();

  const stats = {
    total: automation.enrollments.length,
    running: automation.enrollments.filter((e) => e.status === "RUNNING").length,
    completed: automation.enrollments.filter((e) => e.status === "COMPLETED").length,
    failed: automation.enrollments.filter((e) => e.status === "FAILED").length,
  };

  const steps: AutomationStepDraft[] = automation.steps.map((s) => ({
    localId: randomLocalId(),
    type: s.type,
    config: s.config,
  })) as AutomationStepDraft[];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-1">{automation.name}</h1>
      <div className="flex gap-4 text-sm text-ink/60 mb-8">
        <span>{stats.total} người đã tham gia</span>
        <span>{stats.running} đang chạy</span>
        <span>{stats.completed} hoàn tất</span>
        {stats.failed > 0 && <span className="text-danger">{stats.failed} lỗi</span>}
      </div>

      <AutomationEditor
        initial={{
          id: automation.id,
          name: automation.name,
          eventId: automation.eventId,
          triggerType: automation.triggerType,
          offsetDays: automation.offsetDays,
          status: automation.status,
          steps,
        }}
      />
    </div>
  );
}
