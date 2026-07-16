import { Suspense } from "react";
import { IntegrationsPanel } from "./integrations-panel";

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold mb-2">Tích hợp</h1>
      <p className="text-sm text-ink/60 mb-8">
        Kết nối Telegram để nhận thông báo tức thời, và Google Sheets để tự
        động đồng bộ danh sách người đăng ký.
      </p>
      <Suspense fallback={<p className="text-sm text-ink/50">Đang tải...</p>}>
        <IntegrationsPanel />
      </Suspense>
    </div>
  );
}
