import { prisma } from "@/lib/prisma";
import { sendEmail as sendViaResend } from "@/lib/email-sender";
import { sendViaGmail } from "@/lib/gmail";

export async function sendEmailForOwner(
  ownerId: string,
  params: { to: string; subject: string; html: string }
): Promise<{ ok: boolean; error?: string; via: "gmail" | "resend" }> {
  const gmail = await prisma.gmailConnection.findUnique({ where: { userId: ownerId } });

  if (gmail) {
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    const result = await sendViaGmail({
      refreshToken: gmail.refreshToken,
      fromName: owner?.name ?? "",
      fromEmail: gmail.gmailAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { ...result, via: "gmail" };
  }

  const result = await sendViaResend(params);
  return { ...result, via: "resend" };
}
