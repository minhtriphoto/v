import { prisma } from "@/lib/prisma";
import { recordInteraction } from "@/lib/scoring";
import { renderBlocksToHtml, type EmailBlock } from "@/lib/email-blocks";
import { sendEmailForOwner } from "@/lib/email-dispatch";
import { signUnsubscribeToken } from "@/lib/unsubscribe-token";
import type { AutomationEnrollment, AutomationStep, Event } from "@prisma/client";

// Chống vòng lặp vô hạn nếu CONDITION_BRANCH được cấu hình sai (trỏ vòng lại chính nó)
const MAX_STEPS_PER_TICK = 20;

export async function enrollContact(params: {
  automationId: string;
  contactId: string;
  registrationId?: string;
  nextRunAt?: Date;
}) {
  await prisma.automationEnrollment.upsert({
    where: {
      automationId_contactId: {
        automationId: params.automationId,
        contactId: params.contactId,
      },
    },
    update: {}, // đã enroll trước đó (vd đăng ký lại) thì giữ nguyên tiến trình hiện tại
    create: {
      automationId: params.automationId,
      contactId: params.contactId,
      registrationId: params.registrationId,
      nextRunAt: params.nextRunAt ?? new Date(),
    },
  });
}

function computeScheduledRunAt(
  trigger: "DAYS_BEFORE_EVENT" | "DAYS_AFTER_EVENT",
  offsetDays: number | null,
  event: Event | null
): Date {
  const now = new Date();
  if (!event || offsetDays == null) return now;

  const t = new Date(event.startTime);
  t.setDate(t.getDate() + (trigger === "DAYS_BEFORE_EVENT" ? -offsetDays : offsetDays));
  // Nếu tính ra thời điểm đã qua (vd đăng ký trễ, sát ngày sự kiện), chạy ngay thay vì bỏ lỡ
  return t < now ? now : t;
}

// Gọi khi có đăng ký mới (ON_REGISTER) hoặc khi đăng ký được duyệt (ON_APPROVED).
// Khi duyệt, đồng thời kích hoạt cả các automation hẹn giờ theo ngày (nhắc lịch trước/sau sự kiện).
export async function triggerEventAutomations(params: {
  triggerType: "ON_REGISTER" | "ON_APPROVED";
  eventId: string;
  contactId: string;
  registrationId: string;
}) {
  const triggerTypes =
    params.triggerType === "ON_APPROVED"
      ? (["ON_APPROVED", "DAYS_BEFORE_EVENT", "DAYS_AFTER_EVENT"] as const)
      : (["ON_REGISTER"] as const);

  const automations = await prisma.automation.findMany({
    where: {
      eventId: params.eventId,
      status: "ACTIVE",
      triggerType: { in: [...triggerTypes] },
    },
  });
  if (automations.length === 0) return;

  const needsEvent = automations.some(
    (a) => a.triggerType === "DAYS_BEFORE_EVENT" || a.triggerType === "DAYS_AFTER_EVENT"
  );
  const event = needsEvent
    ? await prisma.event.findUnique({ where: { id: params.eventId } })
    : null;

  for (const automation of automations) {
    const nextRunAt =
      automation.triggerType === "DAYS_BEFORE_EVENT" || automation.triggerType === "DAYS_AFTER_EVENT"
        ? computeScheduledRunAt(automation.triggerType, automation.offsetDays, event)
        : new Date();

    await enrollContact({
      automationId: automation.id,
      contactId: params.contactId,
      registrationId: params.registrationId,
      nextRunAt,
    });
  }
}

export async function processDueEnrollments(limit = 50): Promise<{ processed: number }> {
  const due = await prisma.automationEnrollment.findMany({
    where: { status: "RUNNING", nextRunAt: { lte: new Date() } },
    take: limit,
    orderBy: { nextRunAt: "asc" },
  });

  for (const enrollment of due) {
    await processEnrollment(enrollment.id);
  }
  return { processed: due.length };
}

export async function processAutomationNow(automationId: string, limit = 100) {
  const due = await prisma.automationEnrollment.findMany({
    where: { automationId, status: "RUNNING", nextRunAt: { lte: new Date() } },
    take: limit,
    orderBy: { nextRunAt: "asc" },
  });
  for (const enrollment of due) {
    await processEnrollment(enrollment.id);
  }
  return { processed: due.length };
}

async function processEnrollment(enrollmentId: string) {
  for (let i = 0; i < MAX_STEPS_PER_TICK; i++) {
    const enrollment = await prisma.automationEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment || enrollment.status !== "RUNNING") return;
    if (enrollment.nextRunAt > new Date()) return; // vẫn đang trong thời gian WAIT

    const step = await prisma.automationStep.findUnique({
      where: { automationId_order: { automationId: enrollment.automationId, order: enrollment.currentOrder } },
    });

    if (!step) {
      await prisma.automationEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "COMPLETED" },
      });
      return;
    }

    try {
      await executeStep(enrollment, step);
    } catch (err) {
      await prisma.automationEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "FAILED",
          lastError: err instanceof Error ? err.message : "Lỗi không xác định",
        },
      });
      return;
    }
  }
}

async function executeStep(enrollment: AutomationEnrollment, step: AutomationStep) {
  const contact = await prisma.contact.findUnique({ where: { id: enrollment.contactId } });
  if (!contact) {
    await prisma.automationEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "CANCELED" },
    });
    return;
  }

  switch (step.type) {
    case "SEND_EMAIL": {
      if (!contact.emailOptOut) {
        const config = step.config as unknown as { subject: string; contentBlocks: EmailBlock[] };
        const automation = await prisma.automation.findUnique({
          where: { id: enrollment.automationId },
          include: { owner: true },
        });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const unsubscribeUrl = `${appUrl}/unsubscribe/${signUnsubscribeToken(contact.id)}`;
        const html = renderBlocksToHtml(config.contentBlocks, {
          unsubscribeUrl,
          organizerName: automation?.owner.name ?? undefined,
        });
        if (automation) {
          const result = await sendEmailForOwner(automation.ownerId, {
            to: contact.email,
            subject: config.subject,
            html,
          });
          if (result.ok) {
            await recordInteraction({
              contactId: contact.id,
              type: "EMAIL_SENT",
              metadata: { automationId: enrollment.automationId, stepOrder: step.order },
            });
          }
        }
      }
      await advance(enrollment, step);
      break;
    }

    case "WAIT": {
      const config = step.config as unknown as { hours: number };
      const nextRunAt = new Date(Date.now() + config.hours * 60 * 60 * 1000);
      await prisma.automationEnrollment.update({
        where: { id: enrollment.id },
        data: { currentOrder: step.order + 1, nextRunAt },
      });
      break;
    }

    case "CONDITION_BRANCH": {
      const config = step.config as unknown as {
        minScore: number;
        ifTrueOrder: number;
        ifFalseOrder: number;
      };
      const nextOrder = contact.score >= config.minScore ? config.ifTrueOrder : config.ifFalseOrder;
      await prisma.automationEnrollment.update({
        where: { id: enrollment.id },
        data: { currentOrder: nextOrder },
      });
      break;
    }

    case "ADD_TAG": {
      const config = step.config as unknown as { tagName: string; color?: string };
      const automation = await prisma.automation.findUnique({ where: { id: enrollment.automationId } });
      if (automation) {
        const tag = await prisma.tag.upsert({
          where: { ownerId_name: { ownerId: automation.ownerId, name: config.tagName } },
          update: {},
          create: { ownerId: automation.ownerId, name: config.tagName, color: config.color || "#3730a9" },
        });
        await prisma.contactTag.upsert({
          where: { contactId_tagId: { contactId: contact.id, tagId: tag.id } },
          update: {},
          create: { contactId: contact.id, tagId: tag.id },
        });
        await recordInteraction({
          contactId: contact.id,
          type: "TAG_ADDED",
          metadata: { tagName: tag.name, automationId: enrollment.automationId },
        });
      }
      await advance(enrollment, step);
      break;
    }
  }
}

async function advance(enrollment: AutomationEnrollment, step: AutomationStep) {
  await prisma.automationEnrollment.update({
    where: { id: enrollment.id },
    data: { currentOrder: step.order + 1, nextRunAt: new Date() },
  });
}
