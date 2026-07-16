# Sự Kiện Cộng Đồng — Đầy đủ 6 giai đoạn

Nền tảng quản lý sự kiện miễn phí, kiểu Luma, dành cho cộng đồng — kèm CRM, Email Marketing, Automation/AI, và tích hợp Telegram/Google Sheets/Gmail. Xem `ARCHITECTURE.md` để biết kiến trúc tổng thể và sơ đồ dữ liệu.

## Đã có trong Giai đoạn 1

- Đăng nhập/đăng ký tài khoản organizer (email + mật khẩu; Google OAuth tuỳ chọn khi cấu hình)
- Tạo sự kiện: tên, mô tả, ảnh bìa (URL), thời gian, hình thức online/offline, giá vé, giới hạn số lượng, yêu cầu duyệt
- Câu hỏi đăng ký tuỳ chỉnh (text, textarea, chọn 1, chọn nhiều, số)
- Trang đăng ký công khai `/e/[slug]` — thiết kế kiểu vé, chuẩn mobile
- Trang quản trị: danh sách người đăng ký, duyệt/từ chối, xuất CSV

## Đã có trong Giai đoạn 2

- **Thông báo Telegram tức thời**: kết nối 1 lần tại `/dashboard/settings/integrations`, mỗi khi có người đăng ký mới sẽ nhận tin nhắn kèm link quản lý
- **Đồng bộ Google Sheets tự động**: kết nối tài khoản Google (OAuth riêng, không dùng chung với đăng nhập), mỗi đăng ký mới tự động thêm 1 dòng vào sheet đã chọn
- Nút **"Đồng bộ lại toàn bộ dữ liệu hiện có"** để đẩy các đăng ký cũ (trước khi kết nối) vào sheet
- Cả hai tích hợp chạy **best-effort ở background** (dùng `after()` của Next.js) — nếu Telegram/Sheets lỗi, khách vẫn đăng ký thành công bình thường

## Đã có trong Giai đoạn 3 (CRM)

- **Gộp khách hàng theo email**: mỗi lần đăng ký (ở bất kỳ sự kiện nào), hệ thống tự gộp vào một `Contact` duy nhất trong sổ danh bạ của organizer — không tạo trùng
- **Gắn thẻ (tag)**: tạo thẻ tuỳ ý ngay khi gắn (autocomplete gợi ý thẻ có sẵn), màu sắc riêng
- **Lịch sử tương tác đầy đủ**: đăng ký, được duyệt, check-in tại sự kiện, gắn thẻ, ghi chú thủ công — hiển thị theo dòng thời gian tại trang chi tiết khách hàng
- **Chấm điểm tự động**: đăng ký +5, được duyệt +5, check-in +15 — xếp hạng "Mới / Quan tâm / Rất quan tâm" ngay trong danh sách (`src/lib/scoring.ts`, có thể chỉnh sửa `DEFAULT_SCORE_RULES`)
- **Check-in tại sự kiện**: nút check-in ngay trong bảng quản lý người đăng ký (`/dashboard/events/[id]`)
- Trang `/dashboard/contacts`: tìm kiếm theo tên/email, lọc theo thẻ, sắp xếp theo điểm hoặc mới nhất

## Đã có trong Giai đoạn 4 (Email Marketing)

- **Soạn email kéo thả**: các khối Tiêu đề / Đoạn văn bản / Nút bấm / Hình ảnh / Đường kẻ / Khoảng trống, kéo-thả sắp xếp lại thứ tự, render ra HTML email chuẩn (inline style, tương thích Gmail/Outlook)
- **Gửi theo nhóm đã lọc**: chọn người nhận theo thẻ và/hoặc điểm quan tâm tối thiểu, xem trước số lượng người nhận theo thời gian thực trước khi gửi
- **Dashboard theo dõi**: tỉ lệ mở (tracking pixel), tỉ lệ click (rewrite link qua redirect có theo dõi), danh sách trạng thái từng người nhận
- **Tự động cộng điểm** khi khách mở/click email (đồng bộ với hệ thống chấm điểm CRM ở Giai đoạn 3)
- **Huỷ đăng ký nhận email** (`/unsubscribe/[token]`) tự động chèn vào cuối mỗi email — khách đã huỷ sẽ không nằm trong danh sách gửi của các chiến dịch sau
- Gửi qua **Resend** (dịch vụ email chuyên nghiệp, có gói miễn phí) — Gmail cá nhân sẽ là lựa chọn thay thế ở Giai đoạn 6

## Đã có trong Giai đoạn 5 (Automation đa tầng + AI)

- **Kịch bản chăm sóc nhiều tầng** tại `/dashboard/automations`: chuỗi các bước Gửi email / Chờ / Rẽ nhánh theo điểm / Gắn thẻ, kéo-thả sắp xếp thứ tự
- **5 kiểu kích hoạt**: khi đăng ký, khi được duyệt, số ngày trước/sau sự kiện (nhắc lịch tự động), hoặc thêm thủ công từ trang khách hàng
- **Rẽ nhánh theo điểm quan tâm**: bước "Điểm ≥ X?" cho phép automation tự chọn kịch bản khác nhau cho khách "nóng" và khách "nguội" — dùng chung hệ chấm điểm CRM
- **Chạy nền qua Vercel Cron** (`vercel.json`, mặc định mỗi 10 phút) xử lý các bước "Chờ" và nhắc lịch đúng giờ, không cần server luôn bật
- Nút **"Chạy thử ngay"** để kiểm tra automation ngay trong lúc phát triển, không cần đợi cron
- **AI hỗ trợ viết email** (nút "✨ Viết bằng AI", dùng Claude): mô tả ngắn gọn ý muốn, AI viết tiêu đề + nội dung — dùng được cả trong chiến dịch email (Giai đoạn 4) lẫn từng bước "Gửi email" trong automation

## Đã có trong Giai đoạn 6 (Gmail cá nhân)

- Kết nối Gmail cá nhân tại `/dashboard/settings/integrations` — OAuth riêng (scope `gmail.send`), tách biệt với đăng nhập
- **Tự động ưu tiên Gmail** khi gửi chiến dịch email và automation: nếu đã kết nối Gmail, hệ thống gửi qua đúng hộp thư của bạn (người nhận thấy email đến từ địa chỉ thật của bạn, độ tin cậy cao hơn); nếu chưa kết nối, tự động dùng lại Resend (Giai đoạn 4) — không cần đổi gì ở phía chiến dịch/automation
- Nút "Gửi thử" gửi 1 email test tới chính hộp thư của bạn để xác nhận kết nối hoạt động

## ⚠️ Lưu ý quan trọng trước khi chạy

Dự án dùng **Prisma 7** (mới, có nhiều thay đổi lớn so với các bản hướng dẫn cũ trên mạng: bắt buộc driver adapter `@prisma/adapter-pg`, cấu hình kết nối chuyển từ `schema.prisma` sang `prisma.config.ts`, generator vẫn giữ `prisma-client-js` để tương thích Turbopack của Next.js 16). Toàn bộ code đã được viết theo đúng các thay đổi này và kiểm tra bằng ESLint (không lỗi cú pháp).

Việc này được viết trong môi trường sandbox **không có quyền truy cập mạng tới `binaries.prisma.sh`**, nên lệnh `npx prisma generate` chưa chạy thử thành công ở đây (báo lỗi 403 khi tải schema-engine). Trên máy của bạn với internet đầy đủ, `npm install` (postinstall tự chạy `prisma generate`) sẽ hoạt động bình thường.

## Cài đặt

### 1. Tạo project Supabase (miễn phí)

Vào [supabase.com](https://supabase.com) → New Project → copy 2 connection string trong **Project Settings → Database**:
- Connection string chế độ **Transaction** (cổng 6543) → dùng cho `DATABASE_URL`
- Connection string chế độ **Session** (cổng 5432) → dùng cho `DIRECT_URL`

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Điền `DATABASE_URL`, `DIRECT_URL`, và tạo `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Cài đặt & khởi tạo database

```bash
npm install        # sẽ tự chạy `prisma generate` qua postinstall
npm run db:push     # đẩy schema lên Supabase (đọc DIRECT_URL từ prisma.config.ts)
```

### 4. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → **Tạo sự kiện miễn phí** để tạo tài khoản organizer đầu tiên.

## Xử lý sự cố thường gặp (Prisma 7 + Next.js 16)

- **`Cannot find module '.prisma/client/default'`**: đã xử lý sẵn qua `serverExternalPackages` + `turbopack.resolveAlias` trong `next.config.ts`. Nếu vẫn gặp, chạy `npx prisma generate` lại rồi xoá `.next` và chạy lại `npm run dev`.
- **`PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`**: nghĩa là code đang gọi `new PrismaClient()` không có `adapter` — không nên xảy ra vì `lib/prisma.ts` đã cấu hình sẵn `@prisma/adapter-pg`.
- **`the datasource property url is no longer supported in schema files`**: nếu bạn (hoặc AI khác) thêm lại `url`/`directUrl` vào `datasource` trong `schema.prisma` — Prisma 7 chỉ chấp nhận khai báo này trong `prisma.config.ts`.
- **Lỗi khi `npm run db:push`**: kiểm tra `DIRECT_URL` trong `.env` đúng là connection string cổng **5432** (Session mode), không phải cổng 6543 (pooled) — lệnh migrate/push cần kết nối trực tiếp.

## Kiểm tra nhanh luồng chính

1. Đăng ký tài khoản tại `/signup`
2. Vào `/dashboard/events/new` tạo một sự kiện (bật "Yêu cầu duyệt" để test luồng duyệt)
3. Sao chép link đăng ký công khai (`/e/[slug]`), mở ở tab ẩn danh, điền form đăng ký
4. Quay lại `/dashboard/events/[id]` để duyệt/từ chối và xuất CSV

## (Tuỳ chọn) Bật đăng nhập Google

Tạo OAuth Client tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials), thêm redirect URI `http://localhost:3000/api/auth/callback/google`, rồi điền `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` vào `.env`.

## Cấu hình Telegram (Giai đoạn 2)

1. Vào `/dashboard/settings/integrations`
2. Nhắn `/newbot` cho [@BotFather](https://t.me/BotFather) trên Telegram → nhận Bot Token
3. Thêm bot vào group/chat muốn nhận thông báo → lấy Chat ID qua [@userinfobot](https://t.me/userinfobot) (nếu là group, Chat ID thường có dấu `-` ở đầu)
4. Dán cả hai vào form → hệ thống tự gửi 1 tin nhắn thử để xác nhận trước khi lưu

## Cấu hình Google Sheets (Giai đoạn 2)

1. Cần `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` đã cấu hình (xem trên) — nhớ **bật "Google Sheets API"** trong Google Cloud Console (APIs & Services → Library) và thêm redirect URI thứ hai: `http://localhost:3000/api/integrations/google-sheets/callback`
2. Tại `/dashboard/settings/integrations`, bấm **Kết nối tài khoản Google**
3. Tạo một Google Sheet, chia sẻ (quyền **Chỉnh sửa**) cho đúng email Google vừa kết nối (nếu bạn kết nối bằng chính tài khoản sở hữu sheet thì bỏ qua bước này)
4. Copy **Spreadsheet ID** từ URL (`docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`) và tên tab (mặc định `Trang tính1`), dán vào form → **Lưu**
5. (Tuỳ chọn) Bấm **Đồng bộ lại toàn bộ dữ liệu hiện có** để đẩy các đăng ký từ trước vào sheet

> Lưu ý: Google chỉ trả `refresh_token` ở lần cấp quyền **đầu tiên**. Nếu kết nối lại mà gặp lỗi thiếu refresh token, vào [Google Account → Security → Third-party access](https://myaccount.google.com/permissions), gỡ quyền truy cập ứng dụng này rồi thử kết nối lại.

## Cấu hình Email Marketing (Giai đoạn 4)

1. Đăng ký tài khoản miễn phí tại [resend.com](https://resend.com)
2. Vào **Domains** → thêm và xác thực domain của bạn (thêm bản ghi DNS theo hướng dẫn của Resend). Nếu chưa có domain riêng, có thể dùng domain thử nghiệm `onboarding@resend.dev` của Resend để test trước (chỉ gửi được tới email đã đăng ký tài khoản Resend)
3. Vào **API Keys** → tạo key mới → dán vào `RESEND_API_KEY`
4. Đặt `RESEND_FROM_EMAIL`, ví dụ: `Cộng Đồng ABC <hello@domain-cua-ban.com>`
5. Vào `/dashboard/campaigns/new` → soạn nội dung bằng các khối kéo-thả → chọn nhóm người nhận → **Gửi ngay**

> ⚠️ Danh sách người nhận lớn hơn `CAMPAIGN_MAX_RECIPIENTS` (mặc định 300) sẽ bị từ chối gửi trong 1 lần bấm, vì hàm serverless có giới hạn thời gian chạy. Hãy thu hẹp bộ lọc rồi gửi thành nhiều đợt, hoặc tăng giới hạn này nếu deploy ở gói Vercel có timeout dài hơn (Pro trở lên).

## Cấu hình Automation + AI (Giai đoạn 5)

1. **AI viết email**: lấy API key tại [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) → điền `ANTHROPIC_API_KEY`
2. **Cron chạy automation**:
   - Trên Vercel: `vercel.json` đã khai báo cron gọi `/api/cron/automations` mỗi 10 phút. Đặt `CRON_SECRET` trong Vercel Env Variables — Vercel sẽ tự động gửi kèm khi gọi cron, không cần cấu hình thêm
   - ⚠️ Gói **Vercel Hobby (miễn phí)** giới hạn tần suất cron — nếu bị giới hạn, dùng dịch vụ miễn phí như [cron-job.org](https://cron-job.org) gọi `GET https://domain-cua-ban.com/api/cron/automations?secret=<CRON_SECRET>` mỗi 5–10 phút thay thế
   - Khi phát triển ở local, dùng nút **"Chạy thử ngay"** trong trang chi tiết automation thay vì đợi cron
3. Vào `/dashboard/automations/new` → chọn thời điểm kích hoạt (khi đăng ký / khi duyệt / số ngày trước-sau sự kiện / thủ công) → thêm các bước → **Tạo automation**

> Lưu ý: bước "Rẽ nhánh theo điểm" trỏ tới bước đích bằng vị trí (Bước 1, Bước 2...). Nếu bạn thêm/xoá/sắp xếp lại các bước sau khi đã cấu hình rẽ nhánh, hãy kiểm tra lại 2 lựa chọn "Đúng/Sai" vì vị trí có thể đã đổi.

## Cấu hình Gmail cá nhân (Giai đoạn 6)

1. Dùng lại `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` đã tạo ở phần Google Sheets — vào Google Cloud Console, bật thêm **Gmail API** (APIs & Services → Library)
2. Thêm redirect URI thứ ba vào OAuth Client: `http://localhost:3000/api/integrations/gmail/callback` (và domain thật khi deploy)
3. Vào `/dashboard/settings/integrations` → **Kết nối Gmail** → đăng nhập bằng chính Gmail bạn muốn gửi email
4. Từ giờ mọi chiến dịch email và automation sẽ tự động gửi qua Gmail này thay vì Resend

> ⚠️ **Giới hạn cần biết**: Gmail cá nhân giới hạn khoảng 500 email/ngày (tài khoản Workspace có thể cao hơn) và không phù hợp để gửi số lượng lớn liên tục — dùng tốt cho cộng đồng vài trăm người trở xuống. Ngoài ra, khi app của bạn ở chế độ OAuth "Testing" trên Google Cloud Console, chỉ tối đa 100 tài khoản Google có thể kết nối (đủ dùng cho một cộng đồng nhỏ); muốn mở rộng hơn cần gửi app đi Google xác minh (do `gmail.send` là scope nhạy cảm) — xem hướng dẫn tại [Google OAuth verification](https://support.google.com/cloud/answer/13463073).

## Deploy lên Vercel

1. Push code lên GitHub, import repo vào [vercel.com](https://vercel.com)
2. Thêm toàn bộ biến môi trường cần thiết (xem bảng bên dưới) vào Vercel → Project Settings → Environment Variables
3. Cập nhật `NEXT_PUBLIC_APP_URL` thành domain thật sau khi deploy — **quan trọng**: giá trị này được dùng để build redirect URI của Google OAuth (Sheets, Gmail) và link trong tin nhắn Telegram/email, phải khớp với domain thật và đã được thêm vào Google Cloud Console
4. Cập nhật lại **tất cả** Authorized redirect URIs trong Google Cloud Console sang domain thật (đăng nhập, Sheets, Gmail — 3 URI)
5. Sau khi deploy, chạy `npm run db:push` từ máy local (trỏ `DATABASE_URL`/`DIRECT_URL` tới Supabase production) để khởi tạo schema, hoặc cấu hình CI chạy lệnh này

## Tổng hợp biến môi trường cần cho deploy

| Biến | Bắt buộc? | Dùng cho |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | ✅ Luôn cần | Kết nối Supabase Postgres |
| `AUTH_SECRET` | ✅ Luôn cần | Mã hoá session (NextAuth) |
| `NEXT_PUBLIC_APP_URL` | ✅ Luôn cần | Sinh link chia sẻ, redirect OAuth, tracking email |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Tuỳ chọn | Đăng nhập Google, Google Sheets, Gmail cá nhân (Giai đoạn 2 & 6) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Tuỳ chọn | Gửi email khi chưa kết nối Gmail cá nhân (Giai đoạn 4) |
| `CAMPAIGN_MAX_RECIPIENTS` | Tuỳ chọn | Giới hạn gửi/lần (mặc định 300) |
| `ANTHROPIC_API_KEY` | Tuỳ chọn | AI viết nội dung email (Giai đoạn 5) |
| `CRON_SECRET` | Khuyến nghị | Bảo vệ endpoint chạy automation (Giai đoạn 5) |

Chi tiết từng biến và cách lấy xem trong `.env.example`.
