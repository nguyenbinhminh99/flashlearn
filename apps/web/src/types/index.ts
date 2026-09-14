export type Role = 'USER' | 'ADMIN';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly role: Role;
  readonly createdAt?: string;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt?: string;
  readonly _count?: { readonly studySets: number };
}

export interface Flashcard {
  readonly id: string;
  readonly front: string;
  readonly back: string;
  readonly imageUrl: string | null;
  readonly position: number;
  readonly studySetId?: string;
}

export interface StudySetSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly isPublic: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  readonly owner: { readonly id: string; readonly displayName: string };
  readonly _count: { readonly flashcards: number };
}

export interface StudySetDetail extends StudySetSummary {
  readonly categoryId: string | null;
  readonly flashcards: Flashcard[];
}

export interface Paginated<T> {
  readonly items: T[];
  readonly meta: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: User;
}
