"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCopy}
        className="rounded-full border border-line px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
      >
        {copied ? "Đã sao chép!" : "Sao chép link đăng ký"}
      </button>
      <a
        href={path}
        target="_blank"
        className="text-xs text-ink/50 underline underline-offset-4"
      >
        Xem trang công khai
      </a>
    </div>
  );
}
