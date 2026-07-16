import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CampaignEditor } from "../campaign-editor";
import type { EmailBlock } from "@/lib/email-blocks";

const statusLabel: Record<string, string> = {
  PENDING: "Chưa gửi",
  SENT: "Đã gửi",
  OPENED: "Đã mở",
  CLICKED: "Đã click",
  FAILED: "Lỗi",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      recipients: {
        include: { contact: { select: { email: true, name: true } } },
        orderBy: { sentAt: "desc" },
      },
    },
  });
  if (!campaign || campaign.ownerId !== userId) notFound();

  if (campaign.status === "DRAFT") {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold mb-8">
          Chỉnh sửa chiến dịch
        </h1>
        <CampaignEditor
          initial={{
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            contentBlocks: campaign.contentBlocks as unknown as EmailBlock[],
            filterQuery: campaign.filterQuery as { tagIds?: string[]; minScore?: number },
          }}
        />
      </div>
    );
  }

  const total = campaign.recipients.length;
  const sent = campaign.recipients.filter((r) => r.status !== "PENDING").length;
  const opened = campaign.recipients.filter((r) => r.openedAt).length;
  const clicked = campaign.recipients.filter((r) => r.clickedAt).length;
  const failed = campaign.recipients.filter((r) => r.status === "FAILED").length;
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold mb-1">{campaign.name}</h1>
      <p className="text-sm text-ink/60 mb-8">{campaign.subject}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Đã gửi" value={sent} />
        <Stat label="Tỉ lệ mở" value={`${openRate}%`} sub={`${opened}/${sent}`} />
        <Stat label="Tỉ lệ click" value={`${clickRate}%`} sub={`${clicked}/${sent}`} />
        <Stat label="Lỗi" value={failed} />
      </div>

      <div className="rounded-xl border border-line p-4 mb-8">
        <RateBar label="Đã mở" percent={openRate} color="var(--color-indigo)" />
        <RateBar label="Đã click" percent={clickRate} color="var(--color-amber)" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-ink/[0.03] text-left">
              <th className="px-4 py-3 font-medium">Người nhận</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Gửi lúc</th>
            </tr>
          </thead>
          <tbody>
            {campaign.recipients.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {r.contact.name || r.contact.email}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-medium">
                    {statusLabel[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/50">
                  {r.sentAt
                    ? new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(r.sentAt)
                    : "—"}
                </td>
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink/50">
                  Chưa có người nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-xs uppercase tracking-wide text-ink/50 font-mono">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-ink/40 font-mono">{sub}</p>}
    </div>
  );
}

function RateBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs text-ink/60 mb-1">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
