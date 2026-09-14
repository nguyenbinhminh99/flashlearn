# FlashLearn – API Design

Base URL: `http://localhost:3000/api`  
Auth: `Authorization: Bearer <accessToken>` (JWT)

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login, returns JWT + user |

### POST `/auth/register`

```json
{ "email": "user@example.com", "password": "Secret123", "displayName": "Alice" }
```

### POST `/auth/login`

```json
{ "email": "user@example.com", "password": "Secret123" }
```

Response:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "Alice",
    "avatarUrl": null,
    "role": "USER"
  }
}
```

Logout: client xóa token (không bắt buộc endpoint server).

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | User | Current profile |
| PUT | `/users/me` | User | Update profile |

```json
{ "displayName": "Alice Nguyen", "avatarUrl": "https://..." }
```

## Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | No | List categories |
| POST | `/categories` | Admin | Create |
| PUT | `/categories/:id` | Admin | Update |
| DELETE | `/categories/:id` | Admin | Delete |

```json
{ "name": "Lập trình" }
```

## Study Sets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/study-sets` | Optional | Query: `mine=true`, `public=true`, `categoryId`, `q`, `page`, `limit` |
| GET | `/study-sets/:id` | Optional | Detail + cards (auth nếu private) |
| POST | `/study-sets` | User | Create |
| PUT | `/study-sets/:id` | Owner/Admin | Update |
| DELETE | `/study-sets/:id` | Owner/Admin | Delete |

### Create / Update body

```json
{
  "title": "JavaScript Fundamentals",
  "description": "Core JS concepts",
  "isPublic": true,
  "categoryId": "<uuid-or-null>"
}
```

## Flashcards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/study-sets/:id/cards` | Optional | List cards (auth nếu private) |
| POST | `/study-sets/:id/cards` | Owner | Create card |
| PUT | `/study-sets/:id/cards/reorder` | Owner | Reorder |
| PUT | `/flashcards/:id` | Owner | Update card |
| DELETE | `/flashcards/:id` | Owner | Delete card |

### Create / Update card

```json
{
  "front": "What is a Promise?",
  "back": "An object representing async completion",
  "imageUrl": null
}
```

### Reorder

```json
{ "orderedIds": ["uuid1", "uuid2", "uuid3"] }
```

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | Admin | List users (`q`, `page`, `limit`) |
| PATCH | `/admin/users/:id/block` | Admin | `{ "isBlocked": true }` |
| GET | `/admin/study-sets` | Admin | List all sets |
| DELETE | `/admin/study-sets/:id` | Admin | Delete any set |

## Error format

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

Common codes: `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `409` conflict.
