import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./register-form";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      owner: { select: { name: true } },
      _count: {
        select: { registrations: { where: { status: "APPROVED" } } },
      },
    },
  });

  if (!event || event.status !== "PUBLISHED") notFound();

  const spotsLeft =
    event.capacity != null
      ? Math.max(event.capacity - event._count.registrations, 0)
      : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const dateFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(event.startTime);
  const timeFormatted = new Intl.DateTimeFormat("vi-VN", {
    timeStyle: "short",
  }).format(event.startTime);

  return (
    <main className="flex-1 flex justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md">
        {/* Thân vé */}
        <div className="rounded-t-2xl border border-line bg-white overflow-hidden">
          {event.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImageUrl}
              alt=""
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo mb-3">
              {event.owner.name ? `Tổ chức bởi ${event.owner.name}` : "Sự kiện"}
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight">
              {event.title}
            </h1>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <Row label="Ngày" value={`${dateFormatted} · ${timeFormatted}`} />
              <Row
                label="Địa điểm"
                value={
                  event.locationType === "ONLINE"
                    ? "Trực tuyến — link gửi sau khi duyệt"
                    : event.address ?? "Sẽ được thông báo"
                }
              />
              <Row
                label="Giá vé"
                value={event.price > 0 ? `${event.price.toLocaleString("vi-VN")}đ` : "Miễn phí"}
              />
              {spotsLeft !== null && (
                <Row label="Còn lại" value={`${spotsLeft} chỗ`} />
              )}
            </dl>

            {event.description && (
              <p className="mt-6 text-sm text-ink/70 whitespace-pre-line">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Đường cắt vé */}
        <div className="ticket-perforation h-4 border-x border-line bg-white" />

        {/* Cuống vé — form đăng ký */}
        <div className="rounded-b-2xl border border-t-0 border-line bg-white p-6">
          {isFull ? (
            <p className="text-center text-ink/60 py-6">
              Sự kiện đã đủ số lượng đăng ký.
            </p>
          ) : (
            <RegisterForm
              slug={slug}
              questions={event.questions}
              requiresApproval={event.requiresApproval}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50 font-mono text-xs uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
