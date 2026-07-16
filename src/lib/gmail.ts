import { buildGoogleAuthUrl, refreshAccessToken } from "@/lib/google-oauth";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/integrations/gmail/callback`;
}

export function buildGmailAuthUrl(state: string): string {
  return buildGoogleAuthUrl({ redirectUri: getRedirectUri(), scope: GMAIL_SCOPE, state });
}

export { getRedirectUri as getGmailRedirectUri };

function encodeSubject(subject: string): string {
  // Tiêu đề chứa tiếng Việt cần mã hoá theo RFC 2047
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRawMessage(params: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}): string {
  const headers = [
    `From: ${params.fromName ? `"${params.fromName.replace(/"/g, "")}" ` : ""}<${params.fromEmail}>`,
    `To: ${params.to}`,
    `Subject: ${encodeSubject(params.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ].join("\r\n");

  return `${headers}\r\n\r\n${params.html}`;
}

export async function sendViaGmail(params: {
  refreshToken: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const accessToken = await refreshAccessToken(params.refreshToken);
  if (!accessToken) {
    return { ok: false, error: "Không thể làm mới access token Gmail — hãy kết nối lại" };
  }

  const raw = base64UrlEncode(
    buildRawMessage({
      fromName: params.fromName,
      fromEmail: params.fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
  );

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.error?.message ?? `Lỗi Gmail API (${res.status})` };
  }
  return { ok: true };
}
