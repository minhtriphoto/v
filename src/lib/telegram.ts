export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? "Gửi thất bại" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể kết nối tới Telegram" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatRegistrationMessage(params: {
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  status: "PENDING" | "APPROVED";
  approvedCount: number;
  capacity: number | null;
  manageUrl: string;
}): string {
  const {
    eventTitle,
    registrantName,
    registrantEmail,
    status,
    approvedCount,
    capacity,
    manageUrl,
  } = params;

  const capacityLine =
    capacity != null ? `\n👥 ${approvedCount}/${capacity} đã duyệt` : "";
  const statusLine =
    status === "PENDING"
      ? "⏳ Đang chờ bạn duyệt"
      : "✅ Đã tự động xác nhận";

  return [
    `<b>Đăng ký mới — ${escapeHtml(eventTitle)}</b>`,
    `👤 ${escapeHtml(registrantName)}`,
    `✉️ ${escapeHtml(registrantEmail)}`,
    statusLine + capacityLine,
    `\n<a href="${manageUrl}">Xem &amp; quản lý</a>`,
  ].join("\n");
}
