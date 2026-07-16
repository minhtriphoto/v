"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type State = {
  telegram: { connected: boolean; chatId?: string };
  googleSheets: {
    connected: boolean;
    googleEmail?: string;
    spreadsheetId?: string;
    sheetName?: string;
  };
  gmail: { connected: boolean; gmailAddress?: string };
};

const errorMessages: Record<string, string> = {
  google_not_configured:
    "Chưa cấu hình GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET trên server.",
  google_denied: "Bạn đã huỷ cấp quyền trên Google.",
  google_invalid: "Yêu cầu không hợp lệ, vui lòng thử lại.",
  google_invalid_state: "Phiên xác thực đã hết hạn, vui lòng thử lại.",
  google_no_refresh_token:
    "Google không trả về refresh token — hãy vào Google Account > Security > Third-party access, gỡ quyền truy cập ứng dụng này rồi kết nối lại.",
};

export function IntegrationsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State | null>(null);
  const [banner, setBanner] = useState<string | null>(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) return errorMessages[error] ?? "Có lỗi xảy ra.";
    if (connected === "google_sheets") return "Đã kết nối Google Sheets thành công!";
    if (connected === "gmail") return "Đã kết nối Gmail thành công!";
    return null;
  });

  useEffect(() => {
    if (searchParams.get("error") || searchParams.get("connected")) {
      router.replace("/dashboard/settings/integrations");
    }
    // Chỉ cần chạy 1 lần khi mount để dọn query string
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then(setState);
  }, []);

  async function refresh() {
    const data = await fetch("/api/integrations").then((r) => r.json());
    setState(data);
  }

  if (!state) return <p className="text-sm text-ink/50">Đang tải...</p>;

  return (
    <div className="flex flex-col gap-8">
      {banner && (
        <div className="rounded-lg border border-line bg-ink/[0.03] px-4 py-3 text-sm flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="text-ink/40">
            ✕
          </button>
        </div>
      )}

      <TelegramSection data={state.telegram} onChange={refresh} />
      <GoogleSheetsSection data={state.googleSheets} onChange={refresh} />
      <GmailSection data={state.gmail} onChange={refresh} />
    </div>
  );
}

function TelegramSection({
  data,
  onChange,
}: {
  data: State["telegram"];
  onChange: () => void;
}) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState(data.chatId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/integrations/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken, chatId }),
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setBotToken("");
    setMsg("Đã kết nối và gửi tin nhắn thử thành công!");
    onChange();
  }

  async function sendTest() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/integrations/telegram/test", { method: "POST" });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMsg("Đã gửi tin nhắn thử!");
  }

  async function disconnect() {
    setLoading(true);
    await fetch("/api/integrations/telegram", { method: "DELETE" });
    setLoading(false);
    onChange();
  }

  return (
    <section className="rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-medium">Telegram</h2>
        {data.connected && (
          <span className="rounded-full bg-success/15 text-success text-xs font-medium px-2.5 py-1">
            Đã kết nối
          </span>
        )}
      </div>
      <p className="text-sm text-ink/60 mb-4">
        Nhận thông báo tức thời mỗi khi có người đăng ký sự kiện mới.
      </p>

      {!data.connected ? (
        <div className="flex flex-col gap-3">
          <ol className="text-sm text-ink/60 list-decimal list-inside space-y-1 mb-1">
            <li>
              Nhắn <span className="font-mono">/newbot</span> cho{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                className="underline underline-offset-4"
              >
                @BotFather
              </a>{" "}
              trên Telegram để lấy Bot Token
            </li>
            <li>
              Thêm bot vào nhóm/chat của bạn, sau đó lấy Chat ID bằng{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                className="underline underline-offset-4"
              >
                @userinfobot
              </a>
            </li>
          </ol>
          <input
            className="input"
            placeholder="Bot Token (vd: 123456:ABC-def...)"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
          <input
            className="input"
            placeholder="Chat ID (vd: -1001234567890)"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <button
            onClick={save}
            disabled={loading || !botToken || !chatId}
            className="self-start rounded-full bg-indigo px-5 py-2 text-sm text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
          >
            {loading ? "Đang kết nối..." : "Kết nối"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-mono text-ink/60">Chat ID: {data.chatId}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <div className="flex gap-3 mt-1">
            <button
              onClick={sendTest}
              disabled={loading}
              className="text-sm underline underline-offset-4 disabled:opacity-50"
            >
              Gửi thử
            </button>
            <button
              onClick={disconnect}
              disabled={loading}
              className="text-sm text-danger underline underline-offset-4 disabled:opacity-50"
            >
              Ngắt kết nối
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function GoogleSheetsSection({
  data,
  onChange,
}: {
  data: State["googleSheets"];
  onChange: () => void;
}) {
  const [spreadsheetId, setSpreadsheetId] = useState(data.spreadsheetId ?? "");
  const [sheetName, setSheetName] = useState(data.sheetName ?? "Trang tính1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveSheet() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/integrations/google-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId, sheetName }),
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMsg(`Đã kết nối tới sheet "${result.sheetTitle}".`);
    onChange();
  }

  async function syncAll() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/integrations/google-sheets/sync-all", {
      method: "POST",
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMsg(`Đã đồng bộ ${result.synced} dòng${result.failed ? `, ${result.failed} lỗi` : ""}.`);
  }

  async function disconnect() {
    setLoading(true);
    await fetch("/api/integrations/google-sheets", { method: "DELETE" });
    setLoading(false);
    onChange();
  }

  return (
    <section className="rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-medium">Google Sheets</h2>
        {data.connected && (
          <span className="rounded-full bg-success/15 text-success text-xs font-medium px-2.5 py-1">
            Đã kết nối
          </span>
        )}
      </div>
      <p className="text-sm text-ink/60 mb-4">
        Tự động thêm dòng vào Google Sheet mỗi khi có người đăng ký.
      </p>

      {!data.connected ? (
        <a
          href="/api/integrations/google-sheets/connect"
          className="inline-block rounded-full bg-indigo px-5 py-2 text-sm text-paper font-medium hover:bg-indigo-light transition-colors"
        >
          Kết nối tài khoản Google
        </a>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink/60">
            Đã đăng nhập:{" "}
            <span className="font-mono">{data.googleEmail}</span>
          </p>
          <p className="text-xs text-ink/50">
            Lấy Spreadsheet ID từ URL của Google Sheet:{" "}
            <span className="font-mono">
              docs.google.com/spreadsheets/d/<b>SPREADSHEET_ID</b>/edit
            </span>{" "}
            — nhớ chia sẻ sheet (quyền Chỉnh sửa) cho email ở trên.
          </p>
          <input
            className="input"
            placeholder="Spreadsheet ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
          <input
            className="input"
            placeholder="Tên sheet (tab), vd: Trang tính1"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={saveSheet}
              disabled={loading || !spreadsheetId || !sheetName}
              className="rounded-full bg-indigo px-5 py-2 text-sm text-paper font-medium hover:bg-indigo-light transition-colors disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              onClick={syncAll}
              disabled={loading || !data.spreadsheetId}
              className="text-sm underline underline-offset-4 disabled:opacity-50"
            >
              Đồng bộ lại toàn bộ dữ liệu hiện có
            </button>
            <button
              onClick={disconnect}
              disabled={loading}
              className="text-sm text-danger underline underline-offset-4 disabled:opacity-50"
            >
              Ngắt kết nối
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function GmailSection({
  data,
  onChange,
}: {
  data: State["gmail"];
  onChange: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendTest() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/integrations/gmail/test", { method: "POST" });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(result.error);
      return;
    }
    setMsg("Đã gửi email thử tới chính hộp thư của bạn!");
  }

  async function disconnect() {
    setLoading(true);
    await fetch("/api/integrations/gmail", { method: "DELETE" });
    setLoading(false);
    onChange();
  }

  return (
    <section className="rounded-xl border border-line p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-medium">Gmail cá nhân</h2>
        {data.connected && (
          <span className="rounded-full bg-success/15 text-success text-xs font-medium px-2.5 py-1">
            Đã kết nối
          </span>
        )}
      </div>
      <p className="text-sm text-ink/60 mb-4">
        Gửi chiến dịch email và automation bằng chính hộp thư Gmail của bạn thay vì
        dịch vụ gửi email chung — độ tin cậy cao hơn, người nhận thấy đúng địa chỉ của bạn.
      </p>

      {!data.connected ? (
        <div className="flex flex-col gap-2">
          <a
            href="/api/integrations/gmail/connect"
            className="inline-block self-start rounded-full bg-indigo px-5 py-2 text-sm text-paper font-medium hover:bg-indigo-light transition-colors"
          >
            Kết nối Gmail
          </a>
          <p className="text-xs text-ink/40">
            Gmail cá nhân giới hạn khoảng 500 email/ngày. Nếu chưa kết nối, hệ thống
            sẽ tự dùng Resend (nếu đã cấu hình) để gửi.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-mono text-ink/60">{data.gmailAddress}</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
          <div className="flex gap-3 mt-1">
            <button
              onClick={sendTest}
              disabled={loading}
              className="text-sm underline underline-offset-4 disabled:opacity-50"
            >
              Gửi thử
            </button>
            <button
              onClick={disconnect}
              disabled={loading}
              className="text-sm text-danger underline underline-offset-4 disabled:opacity-50"
            >
              Ngắt kết nối
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
