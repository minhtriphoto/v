import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, formatRegistrationMessage } from "@/lib/telegram";
import { appendSheetRow } from "@/lib/google-sheets";

type TelegramConfig = { botToken: string; chatId: string };
type SheetsConfig = {
  refreshToken: string;
  googleEmail: string;
  spreadsheetId?: string;
  sheetName?: string;
};

// Best-effort: lỗi ở đây không được làm hỏng luồng đăng ký của khách.
export async function notifyNewRegistration(params: {
  ownerId: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  registrantName: string;
  registrantEmail: string;
  status: "PENDING" | "APPROVED";
  answers: Record<string, string>; // key = questionId
  questions: { id: string; label: string }[];
}) {
  const integrations = await prisma.integration.findMany({
    where: { ownerId: params.ownerId },
  });
  if (integrations.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await Promise.allSettled(
    integrations.map(async (integration) => {
      if (integration.type === "TELEGRAM") {
        const cfg = integration.config as unknown as TelegramConfig;
        if (!cfg.botToken || !cfg.chatId) return;

        const [approvedCount, event] = await Promise.all([
          prisma.registration.count({
            where: { eventId: params.eventId, status: "APPROVED" },
          }),
          prisma.event.findUnique({
            where: { id: params.eventId },
            select: { capacity: true },
          }),
        ]);

        const text = formatRegistrationMessage({
          eventTitle: params.eventTitle,
          registrantName: params.registrantName,
          registrantEmail: params.registrantEmail,
          status: params.status,
          approvedCount,
          capacity: event?.capacity ?? null,
          manageUrl: `${appUrl}/dashboard/events/${params.eventId}`,
        });

        await sendTelegramMessage(cfg.botToken, cfg.chatId, text);
      }

      if (integration.type === "GOOGLE_SHEETS") {
        const cfg = integration.config as unknown as SheetsConfig;
        if (!cfg.refreshToken || !cfg.spreadsheetId || !cfg.sheetName) return;

        const row = [
          new Date().toISOString(),
          params.eventTitle,
          params.registrantName,
          params.registrantEmail,
          params.status,
          ...params.questions.map((q) => params.answers[q.id] ?? ""),
        ];

        await appendSheetRow({
          refreshToken: cfg.refreshToken,
          spreadsheetId: cfg.spreadsheetId,
          sheetName: cfg.sheetName,
          row,
        });
      }
    })
  );
}
