"use server";

import { revalidatePath } from "next/cache";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { requireAdminAccess } from "@/lib/adminAuth";
import { syncAllCatalogVideosToDb } from "@/lib/catalogSync";
import { writeContentChangeLog } from "@/lib/contentChangeLog";
import { prisma } from "@/lib/prisma";

const VIDEO_STATUSES = new Set(["approved", "pending", "rejected", "hidden"]);
const PURCHASE_STATUSES = new Set(["paid", "refunded", "canceled"]);
const REPORT_STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

function stringFromForm(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function cleanReason(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 300) : null;
}

function nullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function integerFromForm(formData: FormData, key: string): number | null {
  const value = stringFromForm(formData, key);
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

export async function updateVideoModeration(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess();
  const videoId = stringFromForm(formData, "videoId");
  const status = stringFromForm(formData, "status");
  const reason = cleanReason(stringFromForm(formData, "reason"));

  if (!videoId || !VIDEO_STATUSES.has(status)) {
    throw new Error("영상 상태 변경 요청이 올바르지 않습니다.");
  }

  const before = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      status: true,
      moderationReason: true,
      approvedAt: true,
      approvedBy: true,
    },
  });

  if (!before) throw new Error("영상을 찾을 수 없습니다.");

  const after = await prisma.video.update({
    where: { id: videoId },
    data: {
      status,
      moderationReason: status === "approved" ? null : reason,
      approvedAt: status === "approved" ? new Date() : before.approvedAt,
      approvedBy: status === "approved" ? actor.id : before.approvedBy,
    },
    select: {
      id: true,
      status: true,
      moderationReason: true,
      approvedAt: true,
      approvedBy: true,
    },
  });

  await writeAdminAuditLog({
    actor,
    action: `video.${status}`,
    targetType: "video",
    targetId: videoId,
    before,
    after,
  });
  await writeContentChangeLog({
    targetType: "video",
    targetId: videoId,
    actorId: actor.id,
    actorType: "admin",
    changeType: "moderation",
    before,
    after,
  });

  revalidatePath("/admin");
}

export async function updateAdminVideoDetails(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess();
  const videoId = stringFromForm(formData, "videoId");
  const title = stringFromForm(formData, "title");
  const price = integerFromForm(formData, "price");
  const category = nullableString(stringFromForm(formData, "category"));
  const poster = nullableString(stringFromForm(formData, "poster"));
  const src = nullableString(stringFromForm(formData, "src"));
  const description = nullableString(stringFromForm(formData, "description"));

  if (!videoId || !title || price === null) {
    throw new Error("영상 수정 요청이 올바르지 않습니다.");
  }

  const before = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      poster: true,
      src: true,
      description: true,
      status: true,
    },
  });
  if (!before) throw new Error("영상을 찾을 수 없습니다.");

  const after = await prisma.video.update({
    where: { id: videoId },
    data: {
      title,
      price,
      category,
      poster: poster ?? before.poster,
      src: src ?? before.src,
      description,
    },
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      poster: true,
      src: true,
      description: true,
      status: true,
    },
  });

  await writeAdminAuditLog({
    actor,
    action: "video.edit",
    targetType: "video",
    targetId: videoId,
    before,
    after,
  });
  await writeContentChangeLog({
    targetType: "video",
    targetId: videoId,
    actorId: actor.id,
    actorType: "admin",
    changeType: "edit",
    before,
    after,
  });

  revalidatePath("/admin");
}

export async function createAdminNote(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess();
  const targetType = stringFromForm(formData, "targetType");
  const targetId = stringFromForm(formData, "targetId");
  const body = stringFromForm(formData, "body");

  if (!targetType || !targetId || body.length < 2) {
    throw new Error("운영 메모 내용을 입력해 주세요.");
  }

  const note = await prisma.adminNote.create({
    data: {
      targetType,
      targetId,
      body: body.slice(0, 1000),
      createdBy: actor.id,
    },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      body: true,
      createdBy: true,
      createdAt: true,
    },
  });

  await writeAdminAuditLog({
    actor,
    action: "note.create",
    targetType,
    targetId,
    after: {
      id: note.id,
      body: note.body,
      createdBy: note.createdBy,
      createdAt: note.createdAt.toISOString(),
    },
  });

  revalidatePath("/admin");
}

export async function updatePurchaseStatus(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess();
  const purchaseId = stringFromForm(formData, "purchaseId");
  const status = stringFromForm(formData, "status");

  if (!purchaseId || !PURCHASE_STATUSES.has(status)) {
    throw new Error("구매 상태 변경 요청이 올바르지 않습니다.");
  }

  const before = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, status: true, price: true, buyerId: true, sellerId: true, videoId: true },
  });

  if (!before) throw new Error("구매 기록을 찾을 수 없습니다.");

  const after = await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status },
    select: { id: true, status: true, price: true, buyerId: true, sellerId: true, videoId: true },
  });

  await writeAdminAuditLog({
    actor,
    action: `purchase.${status}`,
    targetType: "purchase",
    targetId: purchaseId,
    before,
    after,
  });

  revalidatePath("/admin");
}

export async function updateReportStatus(formData: FormData): Promise<void> {
  const actor = await requireAdminAccess();
  const reportId = stringFromForm(formData, "reportId");
  const status = stringFromForm(formData, "status");
  const note = cleanReason(stringFromForm(formData, "adminNote"));

  if (!reportId || !REPORT_STATUSES.has(status)) {
    throw new Error("신고 상태 변경 요청이 올바르지 않습니다.");
  }

  const before = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      adminNote: true,
      assignedAdminId: true,
    },
  });

  if (!before) throw new Error("신고 기록을 찾을 수 없습니다.");

  const after = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      adminNote: note,
      assignedAdminId: actor.id,
    },
    select: {
      id: true,
      status: true,
      adminNote: true,
      assignedAdminId: true,
    },
  });

  await writeAdminAuditLog({
    actor,
    action: `report.${status}`,
    targetType: "report",
    targetId: reportId,
    before,
    after,
  });

  revalidatePath("/admin");
}

export async function syncCatalogVideosToDb(): Promise<void> {
  const actor = await requireAdminAccess();
  await syncAllCatalogVideosToDb(actor);
  revalidatePath("/admin");
  revalidatePath("/admin/videos");
}
