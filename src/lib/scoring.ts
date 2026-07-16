import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Quy tắc chấm điểm mặc định — có thể tách ra bảng LeadScoreRule để organizer
// tự tuỳ chỉnh ở giai đoạn sau (Automation). Hiện tại dùng mặc định cố định.
export const DEFAULT_SCORE_RULES: Record<
  | "REGISTER"
  | "APPROVED"
  | "CHECK_IN"
  | "TAG_ADDED"
  | "MANUAL_NOTE"
  | "EMAIL_SENT"
  | "EMAIL_OPEN"
  | "EMAIL_CLICK",
  number
> = {
  REGISTER: 5,
  APPROVED: 5,
  CHECK_IN: 15,
  TAG_ADDED: 0,
  MANUAL_NOTE: 0,
  EMAIL_SENT: 0,
  EMAIL_OPEN: 2,
  EMAIL_CLICK: 5,
};

export async function recordInteraction(params: {
  contactId: string;
  type: keyof typeof DEFAULT_SCORE_RULES;
  metadata?: Prisma.InputJsonValue;
  points?: number;
}) {
  const points = params.points ?? DEFAULT_SCORE_RULES[params.type];

  await prisma.$transaction([
    prisma.interaction.create({
      data: {
        contactId: params.contactId,
        type: params.type,
        points,
        metadata: params.metadata,
      },
    }),
    prisma.contact.update({
      where: { id: params.contactId },
      data: { score: { increment: points } },
    }),
  ]);
}

export async function upsertContactForRegistration(params: {
  ownerId: string;
  email: string;
  name: string;
  source: string;
}) {
  return prisma.contact.upsert({
    where: { ownerId_email: { ownerId: params.ownerId, email: params.email } },
    update: {}, // giữ nguyên tên/nguồn gốc ban đầu, không ghi đè
    create: {
      ownerId: params.ownerId,
      email: params.email,
      name: params.name,
      source: params.source,
    },
  });
}
