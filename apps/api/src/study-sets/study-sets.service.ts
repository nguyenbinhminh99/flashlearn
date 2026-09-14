import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { CreateStudySetDto } from './dto/create-study-set.dto';
import { UpdateStudySetDto } from './dto/update-study-set.dto';
import { QueryStudySetsDto } from './dto/query-study-sets.dto';

const listSelect = {
  id: true,
  title: true,
  description: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  owner: { select: { id: true, displayName: true } },
  _count: { select: { flashcards: true } },
} as const;

@Injectable()
export class StudySetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryStudySetsDto, user: AuthUser | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: Prisma.StudySetWhereInput = {};

    if (query.mine) {
      if (!user) {
        throw new UnauthorizedException('Login required to view your sets');
      }
      where.ownerId = user.id;
    } else if (query.public || !user) {
      where.isPublic = true;
    } else {
      where.OR = [{ isPublic: true }, { ownerId: user.id }];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.studySet.findMany({
        where,
        select: listSelect,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.studySet.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: AuthUser | null) {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id },
      select: {
        ...listSelect,
        ownerId: true,
        categoryId: true,
        flashcards: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            front: true,
            back: true,
            imageUrl: true,
            position: true,
          },
        },
      },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    this.assertCanRead(studySet, user);
    const { ownerId: _, ...rest } = studySet;
    return rest;
  }

  async create(userId: string, dto: CreateStudySetDto) {
    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }
    return this.prisma.studySet.create({
      data: {
        title: dto.title,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        ownerId: userId,
        categoryId: dto.categoryId ?? null,
      },
      select: listSelect,
    });
  }

  async update(id: string, user: AuthUser, dto: UpdateStudySetDto) {
    const existing = await this.getOwnedOrAdmin(id, user);
    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }
    return this.prisma.studySet.update({
      where: { id: existing.id },
      data: {
        title: dto.title,
        description: dto.description,
        isPublic: dto.isPublic,
        categoryId: dto.categoryId === undefined ? undefined : dto.categoryId,
      },
      select: listSelect,
    });
  }

  async remove(id: string, user: AuthUser) {
    const existing = await this.getOwnedOrAdmin(id, user);
    await this.prisma.studySet.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async getOwnedOrAdmin(id: string, user: AuthUser) {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (studySet.ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not own this study set');
    }
    return studySet;
  }

  private assertCanRead(
    studySet: { isPublic: boolean; ownerId: string },
    user: AuthUser | null,
  ): void {
    if (studySet.isPublic) {
      return;
    }
    if (!user) {
      throw new ForbiddenException('This study set is private');
    }
    if (studySet.ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This study set is private');
    }
  }

  private async ensureCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }
}
