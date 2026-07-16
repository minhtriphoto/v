import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đang mở",
  CANCELED: "Đã huỷ",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const events = await prisma.event.findMany({
    where: { ownerId: userId },
    orderBy: { startTime: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Sự kiện của bạn</h1>
        <Link
          href="/dashboard/events/new"
          className="rounded-full bg-indigo px-5 py-2.5 text-paper text-sm font-medium hover:bg-indigo-light transition-colors"
        >
          + Tạo sự kiện
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-ink/60">
            Bạn chưa có sự kiện nào. Tạo sự kiện đầu tiên để bắt đầu.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between rounded-xl border border-line px-5 py-4 hover:border-indigo transition-colors"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-ink/60 font-mono">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(event.startTime)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-ink/60">
                    {event._count.registrations} đăng ký
                  </span>
                  <span className="rounded-full bg-paper border border-line px-3 py-1 text-xs font-mono">
                    {statusLabel[event.status]}
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
