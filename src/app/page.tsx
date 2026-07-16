import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-display text-xl font-semibold tracking-tight">
          Sự Kiện Cộng Đồng
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="hover:underline">
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-indigo transition-colors"
          >
            Tạo sự kiện miễn phí
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col justify-center px-6 md:px-12 py-16 max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo mb-4">
          Nền tảng cộng đồng · Miễn phí
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] tracking-tight max-w-3xl">
          Mỗi sự kiện là một tấm vé đáng nhớ.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Tạo trang đăng ký đẹp trong một phút, duyệt khách tham dự, và theo
          dõi cộng đồng của bạn lớn lên theo từng sự kiện.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-indigo px-6 py-3 text-paper font-medium hover:bg-indigo-light transition-colors"
          >
            Bắt đầu ngay
          </Link>
          <Link href="/login" className="text-sm underline underline-offset-4">
            Tôi đã có tài khoản
          </Link>
        </div>
      </section>

      <div className="ticket-perforation h-4 border-t border-b border-line" />

      <footer className="px-6 md:px-12 py-6 text-xs font-mono text-ink/50">
        Được xây dựng cho cộng đồng — miễn phí, mã nguồn mở.
      </footer>
    </main>
  );
}
