import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type CampaignFilter = {
  tagIds?: string[];
  minScore?: number;
};

export function buildAudienceWhere(
  ownerId: string,
  filter: CampaignFilter
): Prisma.ContactWhereInput {
  return {
    ownerId,
    emailOptOut: false,
    ...(filter.tagIds && filter.tagIds.length > 0
      ? { tags: { some: { tagId: { in: filter.tagIds } } } }
      : {}),
    ...(filter.minScore != null ? { score: { gte: filter.minScore } } : {}),
  };
}

export async function countAudience(ownerId: string, filter: CampaignFilter) {
  return prisma.contact.count({ where: buildAudienceWhere(ownerId, filter) });
}

export async function resolveAudience(ownerId: string, filter: CampaignFilter) {
  return prisma.contact.findMany({ where: buildAudienceWhere(ownerId, filter) });
}
