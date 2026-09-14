# Deploy FlashLearn (miễn phí): Neon + Render + Vercel

Mục tiêu: nhóm mở được website trên internet.

```
Vercel (React)  →  Render (NestJS API)  →  Neon (PostgreSQL)
```

---

## 0. Chuẩn bị

1. Đẩy code lên **GitHub** (private cũng được).
2. Đảm bảo **không** commit file `.env` (đã có trong `.gitignore`).
3. Mọi người trong nhóm tạo tài khoản:
   - [github.com](https://github.com)
   - [neon.tech](https://neon.tech)
   - [render.com](https://render.com)
   - [vercel.com](https://vercel.com) (đăng nhập bằng GitHub)

---

## 1. Neon — Database PostgreSQL

1. Vào [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Đặt tên `flashlearn`, region gần (Singapore nếu có).
3. Vào **Dashboard** → **Connection string** → chọn **URI**.
4. Copy chuỗi dạng:

```text
postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

5. Thêm `?schema=public` nếu chưa có (hoặc `&schema=public` nếu đã có `?`):

```text
postgresql://USER:PASSWORD@ep-xxxx.../neondb?sslmode=require&schema=public
```

Giữ chuỗi này — sẽ dán vào Render.

> Có thể chạy migrate từ máy local trước (tùy chọn):
>
> ```powershell
> cd apps/api
> $env:DATABASE_URL="postgresql://...neon...sslmode=require&schema=public"
> npx prisma migrate deploy
> npm run prisma:seed
> ```

---

## 2. Render — NestJS API

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect repo GitHub FlashLearn.
3. Cấu hình:

| Field | Giá trị |
|-------|---------|
| Name | `flashlearn-api` |
| Root Directory | `apps/api` |
| Runtime | **Node** |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:migrate` |
| Instance | **Free** |

> **Lưu ý:** Repo có file [`.renderignore`](../.renderignore) để Render **không** xóa thư mục `dist/` (Nest build). Nếu thiếu file này, start sẽ lỗi `Cannot find module .../dist/main`.

4. **Environment** → thêm biến:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Connection string Neon (bước 1) |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài (vd: tạo bằng password generator) |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `10000` (Render thường inject PORT; có thể để trống nếu Render tự set) |
| `FRONTEND_URL` | Tạm `http://localhost:5173` — **sửa lại** sau khi có URL Vercel |

5. **Create Web Service** → đợi build xong (~5–10 phút lần đầu).
6. Copy URL API, ví dụ: `https://flashlearn-api.onrender.com`

Kiểm tra nhanh trình duyệt:

```text
https://flashlearn-api.onrender.com/api/categories
```

Phải trả JSON (mảng danh mục hoặc `[]`).

### Seed dữ liệu demo trên Neon

Trên máy local (một lần):

```powershell
cd apps/api
$env:DATABASE_URL="postgresql://...neon..."
npm run prisma:seed
```

Tài khoản demo:

- Admin: `admin@flashlearn.local` / `Admin123`
- User: `demo@flashlearn.local` / `User1234`

---

## 3. Vercel — Frontend React

1. [vercel.com/new](https://vercel.com/new) → Import repo GitHub.
2. Cấu hình:

| Field | Giá trị |
|-------|---------|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. **Environment Variables**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://flashlearn-api.onrender.com/api` |

(đúng URL Render của bạn, **có** `/api` ở cuối)

4. Deploy → copy URL web, ví dụ: `https://flashlearn-xxx.vercel.app`

---

## 4. Nối CORS (quan trọng)

Vào lại **Render** → `flashlearn-api` → **Environment**:

- Sửa `FRONTEND_URL` = `https://flashlearn-xxx.vercel.app` (URL Vercel thật)
- **Save** → service sẽ redeploy

Sau đó mở site Vercel → Đăng nhập bằng tài khoản demo.

---

## 5. Checklist khi lỗi

| Hiện tượng | Cách xử lý |
|------------|------------|
| Vite/local `ECONNREFUSED` | Chạy `npm run start:dev` trong `apps/api` |
| Vercel gọi API lỗi CORS | `FRONTEND_URL` trên Render phải khớp domain Vercel (https, không slash thừa) |
| API Render chậm lần đầu | Free tier **sleep** ~15 phút không ai dùng; đợi 30–60s |
| `Cannot find module .../dist/main` | Thiếu `.renderignore` (Render bỏ `dist/` vì `.gitignore`). Push lại repo rồi **Manual Deploy** |
| `/api/categories` 404 | Thiếu prefix: URL phải là `...onrender.com/api/...` |
| Prisma migrate fail | Kiểm tra `DATABASE_URL` có `sslmode=require` |
| Login được nhưng trắng trang | Sai `VITE_API_URL` (thiếu `/api` hoặc dùng HTTP thay HTTPS) |

---

## 6. Chia sẻ cho nhóm

Gửi mọi người:

1. Link web: `https://....vercel.app`
2. Tài khoản demo (hoặc bảo họ tự đăng ký)
3. Link GitHub repo (nếu cần xem code)

Ai sửa code: push GitHub → Vercel/Render thường **tự deploy lại**.

---

## Tóm tắt biến môi trường

**Render (`apps/api`)**

```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require&schema=public
JWT_SECRET=doi-thanh-chuoi-bi-mat
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
```

**Vercel (`apps/web`)**

```env
VITE_API_URL=https://flashlearn-api.onrender.com/api
```
