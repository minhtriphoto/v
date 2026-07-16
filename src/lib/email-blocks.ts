export type EmailBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "button"; text: string; url: string }
  | { id: string; type: "image"; url: string; alt: string }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer" };

export const BLOCK_LABELS: Record<EmailBlock["type"], string> = {
  heading: "Tiêu đề",
  paragraph: "Đoạn văn bản",
  button: "Nút bấm (CTA)",
  image: "Hình ảnh",
  divider: "Đường kẻ",
  spacer: "Khoảng trống",
};

export function createEmptyBlock(type: EmailBlock["type"]): EmailBlock {
  const id = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "heading":
      return { id, type, text: "Tiêu đề của bạn" };
    case "paragraph":
      return { id, type, text: "Nhập nội dung ở đây..." };
    case "button":
      return { id, type, text: "Xem chi tiết", url: "https://" };
    case "image":
      return { id, type, url: "", alt: "" };
    case "divider":
      return { id, type };
    case "spacer":
      return { id, type };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Chuyển \n thành <br> sau khi đã escape, giữ format đoạn văn nhiều dòng
function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br/>");
}

function renderBlock(block: EmailBlock): string {
  switch (block.type) {
    case "heading":
      return `<h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;line-height:1.3;color:#14151a;">${textToHtml(block.text)}</h2>`;
    case "paragraph":
      return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#14151a;">${textToHtml(block.text)}</p>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="border-radius:999px;background:#3730a9;">
        <a href="${escapeHtml(block.url)}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#f7f5f0;text-decoration:none;border-radius:999px;">${textToHtml(block.text)}</a>
      </td></tr></table>`;
    case "image":
      return block.url
        ? `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" style="max-width:100%;display:block;margin:0 0 16px;border-radius:8px;" />`
        : "";
    case "divider":
      return `<hr style="border:none;border-top:1px solid #d8d4c8;margin:16px 0;" />`;
    case "spacer":
      return `<div style="height:24px;line-height:24px;">&nbsp;</div>`;
  }
}

export function renderBlocksToHtml(
  blocks: EmailBlock[],
  opts: {
    unsubscribeUrl?: string;
    organizerName?: string;
    appUrl?: string;
    trackingToken?: string;
  } = {}
): string {
  let body = blocks.map(renderBlock).join("\n");

  // Tracking click chỉ áp dụng cho link trong nội dung soạn thảo,
  // không áp dụng cho link huỷ nhận email ở footer.
  if (opts.appUrl && opts.trackingToken) {
    body = body.replace(/href="(https?:\/\/[^"]+)"/g, (_match, url: string) => {
      const tracked = `${opts.appUrl}/api/track/click/${opts.trackingToken}?u=${encodeURIComponent(url)}`;
      return `href="${tracked}"`;
    });
  }

  const footer = opts.unsubscribeUrl
    ? `<tr><td style="padding:24px 32px;border-top:1px solid #d8d4c8;">
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a877c;">
          Bạn nhận được email này vì đã đăng ký sự kiện${opts.organizerName ? ` của ${escapeHtml(opts.organizerName)}` : ""}.
          <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#8a877c;">Huỷ nhận email</a>
        </p>
      </td></tr>`
    : "";

  const pixel =
    opts.appUrl && opts.trackingToken
      ? `<img src="${opts.appUrl}/api/track/open/${opts.trackingToken}" width="1" height="1" alt="" style="display:none;" />`
      : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f7f5f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8d4c8;">
            <tr><td style="padding:32px;">${body}</td></tr>
            ${footer}
          </table>
        </td>
      </tr>
    </table>
    ${pixel}
  </body>
</html>`;
}
