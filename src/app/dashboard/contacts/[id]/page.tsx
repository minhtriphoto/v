import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactHeader } from "./contact-header";
import { TagsEditor } from "./tags-editor";
import { NoteForm } from "./note-form";
import { EnrollAutomation } from "./enroll-automation";

const interactionLabel: Record<string, string> = {
  REGISTER: "Đăng ký sự kiện",
  APPROVED: "Được duyệt tham dự",
  CHECK_IN: "Check-in tại sự kiện",
  TAG_ADDED: "Được gắn thẻ",
  MANUAL_NOTE: "Ghi chú",
  EMAIL_SENT: "Nhận email",
  EMAIL_OPEN: "Mở email",
  EMAIL_CLICK: "Click vào email",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      interactions: { orderBy: { createdAt: "desc" } },
      registrations: {
        include: { event: { select: { id: true, title: true, slug: true } } },
        orderBy: { registeredAt: "desc" },
      },
    },
  });
  if (!contact || contact.ownerId !== userId) notFound();

  const allTags = await prisma.tag.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/contacts"
        className="text-sm text-ink/50 hover:underline"
      >
        ← Khách hàng
      </Link>

      <div className="mt-3 mb-8">
        <ContactHeader
          contactId={contact.id}
          name={contact.name}
          email={contact.email}
          phone={contact.phone}
          score={contact.score}
        />
      </div>

      <section className="mb-8">
        <h2 className="font-medium mb-3">Thẻ</h2>
        <TagsEditor
          contactId={contact.id}
          currentTags={contact.tags.map((t) => t.tag)}
          allTags={allTags}
        />
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-3">
          Sự kiện đã đăng ký ({contact.registrations.length})
        </h2>
        {contact.registrations.length === 0 ? (
          <p className="text-sm text-ink/50">Chưa đăng ký sự kiện nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {contact.registrations.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/events/${r.event.id}`}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 text-sm hover:border-indigo transition-colors"
                >
                  <span>{r.event.title}</span>
                  <span className="text-ink/50 font-mono text-xs">{r.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Lịch sử tương tác</h2>
        <div className="mb-3">
          <EnrollAutomation contactId={contact.id} />
        </div>
        <NoteForm contactId={contact.id} />
        <ol className="mt-4 flex flex-col gap-3">
          {contact.interactions.map((i) => {
            const meta = i.metadata as Record<string, string> | null;
            return (
              <li key={i.id} className="flex gap-3 text-sm">
                <span className="text-ink/40 font-mono text-xs pt-0.5 whitespace-nowrap">
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(i.createdAt)}
                </span>
                <div>
                  <span className="font-medium">
                    {interactionLabel[i.type] ?? i.type}
                  </span>
                  {i.points !== 0 && (
                    <span className="ml-2 text-xs text-indigo font-mono">
                      +{i.points} điểm
                    </span>
                  )}
                  {meta?.note && (
                    <p className="text-ink/60 mt-0.5">{meta.note}</p>
                  )}
                  {meta?.eventTitle && !meta?.note && (
                    <p className="text-ink/60 mt-0.5">{meta.eventTitle}</p>
                  )}
                  {meta?.campaignName && (
                    <p className="text-ink/60 mt-0.5">Chiến dịch: {meta.campaignName}</p>
                  )}
                  {meta?.tagName && (
                    <p className="text-ink/60 mt-0.5">Thẻ: {meta.tagName}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
