import { Suspense } from "react";
import { ContactsList } from "./contacts-list";

export default function ContactsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold mb-2">Khách hàng</h1>
      <p className="text-sm text-ink/60 mb-8">
        Danh bạ gộp từ mọi sự kiện bạn tổ chức, xếp hạng theo mức độ quan tâm.
      </p>
      <Suspense fallback={<p className="text-sm text-ink/50">Đang tải...</p>}>
        <ContactsList />
      </Suspense>
    </div>
  );
}
