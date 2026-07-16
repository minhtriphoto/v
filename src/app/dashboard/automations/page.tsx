import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const triggerLabel: Record<string, string> = {
  ON_REGISTER: "Khi đăng ký",
  ON_APPROVED: "Khi được duyệt",
  DAYS_BEFORE_EVENT: "Trước sự kiện",
  DAYS_AFTER_EVENT: "Sau sự kiện",
  MANUAL: "Thủ công",
};

export default async function AutomationsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const automations = await prisma.automation.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { title: true } },
      _count: { select: { steps: true, enrollments: true } },
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">Automation</h1>
          <p className="text-sm text-ink/60 mt-1">
            Kịch bản chăm sóc khách tự động theo nhiều tầng.
          </p>
        </div>
        <Link
          href="/dashboard/automations/new"
          className="rounded-full bg-indigo px-5 py-2.5 text-paper text-sm font-medium hover:bg-indigo-light transition-colors whitespace-nowrap"
        >
          + Tạo automation
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-ink/60">Chưa có automation nào.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {automations.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/automations/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-line px-5 py-4 hover:border-indigo transition-colors"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-ink/60">
                    {triggerLabel[a.triggerType]}
                    {a.event ? ` · ${a.event.title}` : ""} · {a._count.steps} bước
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-ink/60">{a._count.enrollments} người</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-mono ${
                      a.status === "ACTIVE"
                        ? "bg-success/15 text-success"
                        : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {a.status === "ACTIVE" ? "Đang chạy" : "Tạm dừng"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
