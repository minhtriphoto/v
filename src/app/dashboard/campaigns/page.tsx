import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  SENDING: "Đang gửi",
  SENT: "Đã gửi",
};
const statusStyle: Record<string, string> = {
  DRAFT: "bg-ink/10 text-ink/50",
  SENDING: "bg-amber/20 text-amber",
  SENT: "bg-success/15 text-success",
};

export default async function CampaignsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">Chiến dịch email</h1>
          <p className="text-sm text-ink/60 mt-1">
            Soạn và gửi email theo nhóm khách hàng đã lọc.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-full bg-indigo px-5 py-2.5 text-paper text-sm font-medium hover:bg-indigo-light transition-colors whitespace-nowrap"
        >
          + Tạo chiến dịch
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-ink/60">Chưa có chiến dịch nào.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/campaigns/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-line px-5 py-4 hover:border-indigo transition-colors"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-ink/60">{c.subject}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-ink/60">
                    {c._count.recipients} người nhận
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-mono ${statusStyle[c.status]}`}
                  >
                    {statusLabel[c.status]}
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
