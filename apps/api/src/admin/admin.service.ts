import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminStudySetsQueryDto,
  AdminUsersQueryDto,
  BlockUserDto,
} from './dto/admin-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = {};
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { displayName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          _count: { select: { studySets: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async setBlocked(id: string, actorId: string, dto: BlockUserDto) {
    if (id === actorId) {
      throw new ForbiddenException('Cannot block yourself');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'ADMIN' && dto.isBlocked) {
      throw new ForbiddenException('Cannot block another admin');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isBlocked: dto.isBlocked },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isBlocked: true,
      },
    });
  }

  async listStudySets(query: AdminStudySetsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.StudySetWhereInput = {};
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.studySet.findMany({
        where,
        select: {
          id: true,
          title: true,
          isPublic: true,
          createdAt: true,
          owner: { select: { id: true, displayName: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { flashcards: true } },
        },
        orderBy: { createdAt: 'desc' },
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

  async deleteStudySet(id: string) {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    await this.prisma.studySet.delete({ where: { id } });
    return { success: true };
  }
}
