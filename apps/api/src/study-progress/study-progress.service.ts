import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { SaveProgressDto } from './dto/save-progress.dto';

@Injectable()
export class StudyProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async get(studySetId: string, user: AuthUser) {
    await this.assertCanAccess(studySetId, user);
    const progress = await this.prisma.studyProgress.findUnique({
      where: { userId_studySetId: { userId: user.id, studySetId } },
    });
    return (
      progress ?? {
        studySetId,
        currentIndex: 0,
        completedIds: [] as string[],
        lastStudiedAt: null,
      }
    );
  }

  async save(studySetId: string, user: AuthUser, dto: SaveProgressDto) {
    await this.assertCanAccess(studySetId, user);
    return this.prisma.studyProgress.upsert({
      where: { userId_studySetId: { userId: user.id, studySetId } },
      update: {
        currentIndex: dto.currentIndex,
        completedIds: dto.completedIds,
        lastStudiedAt: new Date(),
      },
      create: {
        userId: user.id,
        studySetId,
        currentIndex: dto.currentIndex,
        completedIds: dto.completedIds,
      },
    });
  }

  async reset(studySetId: string, user: AuthUser) {
    await this.prisma.studyProgress.deleteMany({
      where: { userId: user.id, studySetId },
    });
    return { success: true };
  }

  private async assertCanAccess(
    studySetId: string,
    user: AuthUser,
  ): Promise<void> {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id: studySetId },
      select: { id: true, isPublic: true, ownerId: true },
    });
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (studySet.isPublic) {
      return;
    }
    if (studySet.ownerId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('This study set is private');
    }
  }
}
