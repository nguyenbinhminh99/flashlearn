# FlashLearn – Database Design

ORM: **Prisma** · DB: **PostgreSQL**

## Enums

```prisma
enum Role {
  USER
  ADMIN
}
```

## Models

### User

| Column | Type | Notes |
|--------|------|--------|
| id | UUID | PK |
| email | String | Unique |
| passwordHash | String | bcrypt |
| displayName | String | |
| avatarUrl | String? | URL string |
| role | Role | Default `USER` |
| isBlocked | Boolean | Default `false` |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Category

| Column | Type | Notes |
|--------|------|--------|
| id | UUID | PK |
| name | String | Unique |
| slug | String | Unique |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### StudySet

| Column | Type | Notes |
|--------|------|--------|
| id | UUID | PK |
| title | String | |
| description | String? | |
| isPublic | Boolean | Default `false` |
| ownerId | UUID | FK → User |
| categoryId | UUID? | FK → Category |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Indexes: `(ownerId)`, `(isPublic)`, `(categoryId)`

### Flashcard

| Column | Type | Notes |
|--------|------|--------|
| id | UUID | PK |
| front | String | |
| back | String | |
| imageUrl | String? | |
| position | Int | Order within set |
| studySetId | UUID | FK → StudySet (cascade delete) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Index: `(studySetId, position)`

## Relations

- User `1 — N` StudySet (owner)
- Category `1 — N` StudySet
- StudySet `1 — N` Flashcard (ON DELETE CASCADE)

## Access rules (application layer)

| Actor | Read private set | Mutate own set | Mutate any set | Manage users/categories |
|-------|------------------|----------------|----------------|-------------------------|
| Guest | No | No | No | No |
| User | Own only | Yes | No | No |
| Admin | Yes | Yes | Yes | Yes |

Public sets (`isPublic = true`) readable by Guest and User.
