import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ContentChangeActorType = "admin" | "seller" | "system";

export async function writeContentChangeLog(input: {
  targetType: string;
  targetId: string;
  actorId: string;
  actorType: ContentChangeActorType;
  changeType: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
}): Promise<void> {
  await prisma.contentChangeLog.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      actorId: input.actorId,
      actorType: input.actorType,
      changeType: input.changeType,
      beforeJson: input.before ?? undefined,
      afterJson: input.after ?? undefined,
    },
  });
}
