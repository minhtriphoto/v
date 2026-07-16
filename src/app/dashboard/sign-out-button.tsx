"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-line px-4 py-1.5 hover:bg-ink hover:text-paper transition-colors"
    >
      Đăng xuất
    </button>
  );
}
