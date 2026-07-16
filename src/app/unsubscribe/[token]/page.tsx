import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contactId = verifyUnsubscribeToken(token);

  let message = "Liên kết không hợp lệ.";
  if (contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (contact) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { emailOptOut: true },
      });
      message = `Đã huỷ đăng ký nhận email cho địa chỉ ${contact.email}.`;
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">
          {contactId ? "Đã huỷ nhận email" : "Có lỗi xảy ra"}
        </h1>
        <p className="text-sm text-ink/60">{message}</p>
      </div>
    </main>
  );
}
