import type { Prisma } from "@prisma/client";
import type { AdminUser } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  actor: AdminUser;
  action: string;
  targetType: string;
  targetId: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
};

export async function writeAdminAuditLog(input: AuditInput): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      beforeJson: input.before ?? undefined,
      afterJson: input.after ?? undefined,
    },
  });
}
