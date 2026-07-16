const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Chưa cấu hình RESEND_API_KEY / RESEND_FROM_EMAIL trên server",
    };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.message ?? `Lỗi gửi email (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể kết nối tới dịch vụ gửi email" };
  }
}

// Gửi theo lô nhỏ với giới hạn số lượng chạy song song, tránh vượt rate limit
// và tránh serverless function timeout khi danh sách lớn.
export async function sendEmailBatch<T>(
  items: T[],
  sendOne: (item: T) => Promise<void>,
  concurrency = 5
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      await sendOne(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}
