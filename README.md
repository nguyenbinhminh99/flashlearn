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
