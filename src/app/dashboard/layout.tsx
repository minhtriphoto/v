import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 px-6 py-4 border-b border-line md:px-12">
        <Link href="/dashboard" className="font-display text-lg font-semibold">
          Sự Kiện Cộng Đồng
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/dashboard/contacts" className="hover:underline">
            Khách hàng
          </Link>
          <Link href="/dashboard/campaigns" className="hover:underline">
            Chiến dịch
          </Link>
          <Link href="/dashboard/automations" className="hover:underline">
            Automation
          </Link>
          <Link href="/dashboard/settings/integrations" className="hover:underline">
            Tích hợp
          </Link>
          <span className="text-ink/60 hidden md:inline">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-10 md:px-12">{children}</main>
    </div>
  );
}
