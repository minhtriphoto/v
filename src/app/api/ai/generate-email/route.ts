import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createEmptyBlock, type EmailBlock } from "@/lib/email-blocks";

const schema = z.object({
  brief: z.string().min(1, "Vui lòng mô tả nội dung bạn muốn viết"),
  eventTitle: z.string().optional(),
});

const SYSTEM_PROMPT = `Bạn là trợ lý viết email marketing cho các sự kiện cộng đồng tại Việt Nam.
Viết bằng tiếng Việt, giọng văn thân thiện, ngắn gọn, không sáo rỗng.
CHỈ trả về JSON hợp lệ theo đúng schema sau, không kèm giải thích, không dùng markdown code fence:
{
  "subject": "tiêu đề email, dưới 60 ký tự",
  "blocks": [
    { "type": "heading", "text": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "button", "text": "...", "url": "https://" }
  ]
}
Chỉ dùng các type: heading, paragraph, button. Tối đa 1 heading, 1-3 paragraph, tối đa 1 button.
Với block "button", giữ nguyên url là "https://" (người dùng sẽ tự điền sau).`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chưa cấu hình ANTHROPIC_API_KEY trên server" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }

  const userPrompt = parsed.data.eventTitle
    ? `Sự kiện: "${parsed.data.eventTitle}". Yêu cầu: ${parsed.data.brief}`
    : `Yêu cầu: ${parsed.data.brief}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Lỗi gọi AI (${res.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText: string = data.content?.[0]?.text ?? "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsedAi: { subject: string; blocks: { type: string; text?: string; url?: string }[] };
    try {
      parsedAi = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI trả về định dạng không hợp lệ, vui lòng thử lại" },
        { status: 502 }
      );
    }

    const blocks: EmailBlock[] = parsedAi.blocks
      .filter((b) => ["heading", "paragraph", "button"].includes(b.type))
      .map((b) => {
        const empty = createEmptyBlock(b.type as "heading" | "paragraph" | "button");
        if (empty.type === "button") {
          return { ...empty, text: b.text ?? empty.text, url: b.url ?? empty.url };
        }
        return { ...empty, text: b.text ?? empty.text };
      });

    return NextResponse.json({ subject: parsedAi.subject, blocks });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối tới dịch vụ AI" },
      { status: 502 }
    );
  }
}
