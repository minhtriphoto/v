import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationsTable } from "./registrations-table";
import { CopyLinkButton } from "./copy-link-button";

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      registrations: {
        orderBy: { registeredAt: "desc" },
        include: { answers: true },
      },
    },
  });

  if (!event || event.ownerId !== userId) notFound();

  const approved = event.registrations.filter((r) => r.status === "APPROVED").length;
  const pending = event.registrations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{event.title}</h1>
          <p className="text-sm text-ink/60 font-mono mt-1">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(event.startTime)}
          </p>
        </div>
        <CopyLinkButton path={`/e/${event.slug}`} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Đã duyệt" value={approved} />
        <Stat label="Chờ duyệt" value={pending} />
        <Stat
          label="Giới hạn"
          value={event.capacity != null ? String(event.capacity) : "Không giới hạn"}
        />
      </div>

      <RegistrationsTable
        eventId={event.id}
        questions={event.questions}
        registrations={event.registrations.map((r) => ({
          id: r.id,
          contactId: r.contactId,
          name: r.name,
          email: r.email,
          status: r.status,
          registeredAt: r.registeredAt.toISOString(),
          checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
          answers: r.answers,
        }))}
        requiresApproval={event.requiresApproval}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-xs uppercase tracking-wide text-ink/50 font-mono">
        {label}
      </p>
      <p className="font-display text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
