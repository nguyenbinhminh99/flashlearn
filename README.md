# FlashLearn

Nền tảng flashcard kiểu Quizlet — quản lý Study Set, Flashcard, Learn (lật thẻ), Admin & Category. Không có Quiz.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind + React Router
- **Backend:** NestJS + Prisma + JWT
- **Database:** PostgreSQL (Docker Compose)

## Tài liệu

- [Mô tả dự án](docs/PROJECT_DESCRIPTION.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Deploy miễn phí (Neon + Render + Vercel)](docs/DEPLOY.md)

## Chạy local

### 1. Database

```bash
docker compose up -d
```

### 2. API

```bash
cd apps/api
cp .env.example .env   # nếu chưa có .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

API: http://localhost:3000/api

> Seed dùng `tsx` (đã có trong `apps/api`).

### 3. Web

```bash
cd apps/web
npm install
npm run dev
```

Web: http://localhost:5173

## Tài khoản demo (sau seed)

| Role  | Email                   | Password  |
|-------|-------------------------|-----------|
| Admin | admin@flashlearn.local  | Admin123  |
| User  | demo@flashlearn.local   | User1234  |

## Cấu trúc

```
apps/api   NestJS + Prisma
apps/web   React SPA
docs/      Tài liệu mô tả
```

## Công thức toán trong flashcard

Mặt trước và mặt sau hỗ trợ văn bản xen công thức LaTeX, hiển thị bằng KaTeX:

- Trong dòng: `Định lý Pythagoras: \(a^2 + b^2 = c^2\)`.
- Riêng dòng: `$$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$` hoặc `\[\frac{a}{b}\]`.
- Hệ phương trình: `$$\begin{aligned}x+y&=3\\x-y&=1\end{aligned}$$`.

Form tạo/sửa thẻ có xem trước trực tiếp và bộ đếm ký tự. Mặt trước tối đa 500 ký tự,
mặt sau tối đa 2.000 ký tự, bao gồm mã LaTeX. Công thức sai hiển thị mã màu đỏ;
công thức thiếu dấu phân cách đóng hiển thị nguyên văn. Ký hiệu `$` đơn được giữ
như văn bản thông thường.

Nút **Chèn công thức** cạnh từng ô mở bàn phím toán trực quan (MathLive), có
phân số, căn, lũy thừa, hàm và ký hiệu. Chọn **Trong dòng** hoặc **Riêng dòng**,
xem nội dung sau khi chèn rồi xác nhận. Công thức được chèn tại con trỏ hoặc
thay phần đang chọn; chọn toàn bộ công thức có dấu phân cách để mở và sửa lại.
**Hủy** hoặc **Escape** giữ nội dung và vị trí chọn. Bộ nhập kiểm tra công thức
với KaTeX và giới hạn ký tự trước khi chèn. MathLive và font được tải từ assets
của ứng dụng khi mở bộ nhập lần đầu.

API lưu mã nguồn LaTeX dưới dạng chuỗi; frontend render khi xem chi tiết hoặc học thẻ.

## Kiểm thử E2E MVP 1

Test Playwright chạy luồng: đăng nhập → tạo bộ thẻ riêng tư gồm 3 flashcard →
học/lật thẻ → khôi phục tiến độ sau reload → hoàn thành → học lại/xáo trộn →
sửa → xóa → đăng xuất. Test dùng API và PostgreSQL thật, kiểm tra thêm KaTeX,
lật bằng Space/Enter, nội dung dài trên mobile và `prefers-reduced-motion`.
Bộ thẻ tạm có tên riêng cho từng lần chạy và được xóa cả khi test thất bại.

Chuẩn bị PostgreSQL và API theo phần chạy local. Với cấu hình Vite proxy hiện tại,
đặt `PORT=3001` trong `apps/api/.env`; Docker Compose dùng database port `5433`.
Chạy migrations và seed để có tài khoản demo, rồi giữ API chạy ở port 3001.

```bash
npm run test:e2e --prefix apps/web
```

Test dùng Google Chrome đã cài và tự mở/dừng Vite riêng ở port 5174.
Để dùng Chromium do Playwright quản lý:

```bash
cd apps/web
npx playwright install chromium
E2E_BROWSER_CHANNEL=chromium npm run test:e2e
```

Có thể đặt `E2E_EMAIL` và `E2E_PASSWORD` để dùng tài khoản test khác;
`E2E_BASE_URL` để dùng frontend đang chạy sẵn. Báo cáo HTML và ảnh desktop/mobile
nằm trong `apps/web/playwright-report` và `apps/web/test-results` (không commit).
