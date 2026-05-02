import { prisma } from "@/lib/prisma";

let ensured = false;

export async function ensureProfileAdminColumns(): Promise<void> {
  if (ensured) return;

  await prisma.$executeRaw`
    alter table public.profiles
      add column if not exists account_status text not null default 'active',
      add column if not exists role text not null default 'user',
      add column if not exists admin_memo text,
      add column if not exists suspended_at timestamptz,
      add column if not exists suspended_by text
  `;

  await prisma.$executeRaw`
    create index if not exists profiles_account_status_updated_at_idx
      on public.profiles (account_status, updated_at)
  `;

  await prisma.$executeRaw`
    create index if not exists profiles_role_updated_at_idx
      on public.profiles (role, updated_at)
  `;

  ensured = true;
}
